import type { Cart, CartMergeResponse } from '@/features/cart/contracts'
import { getMockDb, mutateMockDb, nextMockId } from '@/mocks/db'
import type { MockActor } from '@/mocks/http'
import { MockRequestError as RequestError } from '@/mocks/http'
import type { MockCart, MockDb } from '@/mocks/db/schema'
import { nowIso } from '@/mocks/domain/time'
import { maxCartQuantity, resolveCoupon, toCart } from '@/mocks/domain/serializers'

export function cartOwnerKey(actor: MockActor) {
  return actor.type === 'user' ? `user:${actor.user.id}` : `guest:${actor.guestId}`
}

function findCart(db: MockDb, ownerKey: string) {
  return db.carts[ownerKey] ?? null
}

function createCart(db: MockDb, ownerKey: string): MockCart {
  const cart: MockCart = {
    id: nextMockId(db, 'cart'),
    ownerKey,
    items: [],
    couponCode: null,
    version: 1,
    updatedAt: nowIso(),
  }

  db.carts[ownerKey] = cart

  return cart
}

function ensureCart(db: MockDb, ownerKey: string) {
  const cart = findCart(db, ownerKey)

  if (cart) {
    cart.items = cart.items.filter((item) => db.nfts.some((nft) => nft.id === item.nftId))

    return cart
  }

  return createCart(db, ownerKey)
}

function touchCart(cart: MockCart) {
  cart.version += 1
  cart.updatedAt = nowIso()
}

function unavailableError(message: string, details?: Record<string, unknown>) {
  return new RequestError(409, 'INSUFFICIENT_AVAILABILITY', message, { details })
}

function ensureAvailable(db: MockDb, nftId: string, requestedQuantity: number) {
  const nft = db.nfts.find((item) => item.id === nftId)

  if (!nft) {
    throw new RequestError(404, 'NOT_FOUND', 'NFT não encontrado.')
  }

  if (
    nft.availability !== 'available' ||
    nft.availableQuantity <= 0 ||
    requestedQuantity > nft.availableQuantity
  ) {
    throw unavailableError('Quantidade indisponível para este NFT.', {
      nftId,
      requestedQuantity,
      availableQuantity: nft.availableQuantity,
    })
  }

  return nft
}

export function getCart(actor: MockActor): Cart {
  return mutateMockDb((db) => {
    const cart = ensureCart(db, cartOwnerKey(actor))

    return toCart(db, cart)
  })
}

export function addCartItem(actor: MockActor, nftId: string, quantity: number): Cart {
  return mutateMockDb((db) => {
    const cart = ensureCart(db, cartOwnerKey(actor))
    const existingItem = cart.items.find((item) => item.nftId === nftId)
    const requestedQuantity = (existingItem?.quantity ?? 0) + quantity

    if (requestedQuantity > maxCartQuantity) {
      throw new RequestError(
        422,
        'VALIDATION_ERROR',
        `A quantidade máxima por NFT é ${maxCartQuantity}.`,
      )
    }

    const nft = ensureAvailable(db, nftId, requestedQuantity)

    if (existingItem) {
      existingItem.quantity = requestedQuantity
      existingItem.addedAt = nowIso()
    } else {
      cart.items.push({
        nftId: nft.id,
        quantity,
        addedAt: nowIso(),
      })
    }

    touchCart(cart)

    return toCart(db, cart)
  })
}

export function updateCartItem(actor: MockActor, nftId: string, quantity: number): Cart {
  return mutateMockDb((db) => {
    const cart = ensureCart(db, cartOwnerKey(actor))
    const item = cart.items.find((candidate) => candidate.nftId === nftId)

    if (!item) {
      throw new RequestError(404, 'NOT_FOUND', 'Item não encontrado no carrinho.')
    }

    ensureAvailable(db, nftId, quantity)
    item.quantity = quantity
    touchCart(cart)

    return toCart(db, cart)
  })
}

export function removeCartItem(actor: MockActor, nftId: string): Cart {
  return mutateMockDb((db) => {
    const cart = ensureCart(db, cartOwnerKey(actor))
    const nextItems = cart.items.filter((item) => item.nftId !== nftId)

    if (nextItems.length === cart.items.length) {
      throw new RequestError(404, 'NOT_FOUND', 'Item não encontrado no carrinho.')
    }

    cart.items = nextItems
    touchCart(cart)

    return toCart(db, cart)
  })
}

export function applyCoupon(actor: MockActor, code: string): Cart {
  return mutateMockDb((db) => {
    const cart = ensureCart(db, cartOwnerKey(actor))
    const normalizedCode = code.trim().toUpperCase()
    const coupon = db.coupons.find((item) => item.code === normalizedCode)

    if (!coupon) {
      throw new RequestError(422, 'INVALID_COUPON', 'Cupom inválido.')
    }

    if (Date.parse(coupon.expiresAt) <= Date.now()) {
      throw new RequestError(409, 'EXPIRED_COUPON', 'Este cupom está expirado.')
    }

    cart.couponCode = coupon.code
    touchCart(cart)

    return toCart(db, cart)
  })
}

export function removeCoupon(actor: MockActor): Cart {
  return mutateMockDb((db) => {
    const cart = ensureCart(db, cartOwnerKey(actor))
    cart.couponCode = null
    touchCart(cart)

    return toCart(db, cart)
  })
}

export function mergeGuestCart(userId: string, guestId: string): CartMergeResponse {
  return mutateMockDb((db) => {
    const userCart = ensureCart(db, `user:${userId}`)
    const guestCart = findCart(db, `guest:${guestId}`)

    if (!guestCart) {
      return {
        cart: toCart(db, userCart),
        adjustments: [],
      }
    }

    const adjustments: CartMergeResponse['adjustments'] = []

    for (const guestItem of guestCart.items) {
      const nft = db.nfts.find((candidate) => candidate.id === guestItem.nftId)
      const existingItem = userCart.items.find((item) => item.nftId === guestItem.nftId)
      const requestedQuantity = (existingItem?.quantity ?? 0) + guestItem.quantity

      if (!nft) {
        adjustments.push({
          nftId: guestItem.nftId,
          requestedQuantity,
          appliedQuantity: 0,
          reason: 'missing',
        })
        continue
      }

      if (nft.availability !== 'available' || nft.availableQuantity <= 0) {
        adjustments.push({
          nftId: nft.id,
          requestedQuantity,
          appliedQuantity: 0,
          reason: 'unavailable',
        })
        continue
      }

      const appliedQuantity = Math.min(requestedQuantity, nft.availableQuantity, maxCartQuantity)

      if (appliedQuantity < requestedQuantity) {
        adjustments.push({
          nftId: nft.id,
          requestedQuantity,
          appliedQuantity,
          reason: 'availability',
        })
      }

      if (appliedQuantity <= 0) {
        continue
      }

      if (existingItem) {
        existingItem.quantity = appliedQuantity
        existingItem.addedAt = nowIso()
      } else {
        userCart.items.push({
          nftId: nft.id,
          quantity: appliedQuantity,
          addedAt: nowIso(),
        })
      }
    }

    delete db.carts[`guest:${guestId}`]
    touchCart(userCart)

    return {
      cart: toCart(db, userCart),
      adjustments,
    }
  })
}

export function applyOrderToCart(
  db: MockDb,
  userId: string,
  cartId: string,
  cartVersion: number,
  items: Array<{ nftId: string; quantity: number }>,
) {
  const cart = findCart(db, `user:${userId}`)

  if (!cart || cart.id !== cartId) {
    return
  }

  if (cart.version === cartVersion) {
    cart.items = []
    cart.couponCode = null
    touchCart(cart)
    return
  }

  for (const purchased of items) {
    const cartItem = cart.items.find((item) => item.nftId === purchased.nftId)

    if (!cartItem) {
      continue
    }

    cartItem.quantity -= purchased.quantity

    if (cartItem.quantity <= 0) {
      cart.items = cart.items.filter((item) => item.nftId !== purchased.nftId)
    }
  }

  if (cart.items.length === 0) {
    cart.couponCode = null
  }

  touchCart(cart)
}

export function getCouponForCart(db: MockDb, cart: MockCart) {
  return resolveCoupon(db, cart.couponCode)
}

export function getExistingCart(actor: MockActor) {
  return findCart(getMockDb(), cartOwnerKey(actor))
}
