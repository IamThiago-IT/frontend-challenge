import type { Cart } from '@/features/cart/contracts'
import type { CreateOrderRequest, Quote } from '@/features/checkout/contracts'
import type { Order } from '@/features/orders/contracts'
import { bytesToHex } from '@/lib/crypto/encoding'
import { sha256Hex } from '@/lib/crypto/hash'
import { stableStringify } from '@/lib/json/stable-json'
import { parseEthToWei, toEthString } from '@/lib/money/eth'
import { getMockDb, mutateMockDb, nextMockId } from '@/mocks/db'
import type { MockDb, MockOrder, MockQuote } from '@/mocks/db/schema'
import { MockRequestError } from '@/mocks/http'
import { applyOrderToCart, getExistingCart } from '@/mocks/domain/cart'
import { addMilliseconds, isExpired, nowIso } from '@/mocks/domain/time'
import {
  calculateCartTotals,
  explorerUrlFor,
  networkFeeFor,
  quoteLifetimeMs,
  resolveCoupon,
  toCart,
  toNftSummary,
  toOrder,
  toQuote,
} from '@/mocks/domain/serializers'
import { emitNftUpdated, emitOrderUpdated } from '@/mocks/ws/emitter'
import type { MockAuthenticatedActor } from '@/mocks/http'

function randomHash() {
  return `0x${bytesToHex(crypto.getRandomValues(new Uint8Array(32)))}`
}

function appliedCoupon(coupon: ReturnType<typeof resolveCoupon>) {
  return coupon
    ? {
        code: coupon.code,
        label: coupon.label,
        expiresAt: coupon.expiresAt,
      }
    : null
}

function findUserCart(db: MockDb, userId: string) {
  return db.carts[`user:${userId}`] ?? null
}

export function createQuote(
  actor: MockAuthenticatedActor,
  walletId: string,
  network: Quote['network'],
): Quote {
  const db = getMockDb()
  const wallet = db.wallets[actor.user.id]?.find((item) => item.id === walletId)

  if (!wallet) {
    throw new MockRequestError(404, 'NOT_FOUND', 'Carteira não encontrada.')
  }

  if (wallet.network !== network) {
    throw new MockRequestError(
      422,
      'VALIDATION_ERROR',
      'A rede informada não corresponde à carteira selecionada.',
    )
  }

  const cart = findUserCart(db, actor.user.id)

  if (!cart || cart.items.length === 0) {
    throw new MockRequestError(400, 'CART_EMPTY', 'Seu carrinho está vazio.')
  }

  const quoteItems = cart.items.map((item) => {
    const nft = db.nfts.find((candidate) => candidate.id === item.nftId)

    if (!nft || nft.availability !== 'available' || nft.availableQuantity < item.quantity) {
      throw new MockRequestError(
        409,
        'INSUFFICIENT_AVAILABILITY',
        'Um item do carrinho não está mais disponível.',
        { details: { nftId: item.nftId } },
      )
    }

    return {
      nftId: nft.id,
      name: nft.name,
      imageUrl: nft.imageUrl,
      quantity: item.quantity,
      unitPriceEth: nft.priceEth,
      lineTotalEth: toEthString(parseEthToWei(nft.priceEth) * BigInt(item.quantity)),
      version: nft.version,
    }
  })
  const coupon = resolveCoupon(db, cart.couponCode)

  if (cart.couponCode && !coupon) {
    const storedCoupon = db.coupons.find((item) => item.code === cart.couponCode)

    throw new MockRequestError(
      409,
      storedCoupon ? 'EXPIRED_COUPON' : 'INVALID_COUPON',
      storedCoupon ? 'O cupom do carrinho expirou.' : 'O cupom do carrinho é inválido.',
    )
  }

  const totals = calculateCartTotals(
    quoteItems.map((item) => {
      const nft = db.nfts.find((candidate) => candidate.id === item.nftId)

      if (!nft) {
        throw new MockRequestError(404, 'NOT_FOUND', 'NFT não encontrado.')
      }

      return {
        nft: toNftSummary(nft),
        quantity: item.quantity,
      }
    }),
    coupon,
    network,
  )
  const createdAt = nowIso()

  return mutateMockDb((draft) => {
    const quote: MockQuote = {
      id: nextMockId(draft, 'quote'),
      userId: actor.user.id,
      items: quoteItems,
      coupon: appliedCoupon(coupon),
      subtotalEth: totals.subtotalEth,
      discountEth: totals.discountEth,
      networkFeeEth: networkFeeFor(network),
      totalEth: totals.totalEth,
      currency: 'ETH',
      walletId: wallet.id,
      network,
      cartVersion: cart.version,
      createdAt,
      expiresAt: addMilliseconds(createdAt, quoteLifetimeMs),
    }

    draft.quotes = [
      quote,
      ...draft.quotes.filter(
        (item) => item.userId !== actor.user.id || Date.parse(item.expiresAt) > Date.now(),
      ),
    ].slice(0, 10)

    return toQuote(quote)
  })
}

function findIdempotencyRecord(db: MockDb, userId: string, key: string) {
  return db.idempotency[`${userId}:${key}`] ?? null
}

async function validateIdempotency(
  userId: string,
  key: string,
  payloadHash: string,
): Promise<Order | null> {
  const record = findIdempotencyRecord(getMockDb(), userId, key)

  if (!record) {
    return null
  }

  if (record.payloadHash !== payloadHash) {
    throw new MockRequestError(
      409,
      'IDEMPOTENCY_CONFLICT',
      'Esta chave de idempotência já foi usada com outro conteúdo.',
    )
  }

  const order = getMockDb().orders.find((item) => item.id === record.orderId)

  if (!order) {
    throw new MockRequestError(404, 'NOT_FOUND', 'Pedido original não encontrado.')
  }

  return toOrder(order)
}

export async function createOrder(
  actor: MockAuthenticatedActor,
  input: CreateOrderRequest,
  idempotencyKey: string,
): Promise<{ order: Order; replayed: boolean }> {
  if (!idempotencyKey.trim()) {
    throw new MockRequestError(
      400,
      'VALIDATION_ERROR',
      'O cabeçalho Idempotency-Key é obrigatório.',
    )
  }

  const payloadHash = await sha256Hex(
    stableStringify({
      quoteId: input.quoteId,
      walletId: input.walletId,
      network: input.network,
      collector: input.collector,
    }),
  )
  const replayedOrder = await validateIdempotency(actor.user.id, idempotencyKey, payloadHash)

  if (replayedOrder) {
    return {
      order: replayedOrder,
      replayed: true,
    }
  }

  const db = getMockDb()
  const quote = db.quotes.find((item) => item.id === input.quoteId && item.userId === actor.user.id)

  if (!quote) {
    throw new MockRequestError(404, 'NOT_FOUND', 'Cotação não encontrada.')
  }

  if (isExpired(quote.expiresAt)) {
    throw new MockRequestError(409, 'QUOTE_EXPIRED', 'Esta cotação expirou.')
  }

  if (quote.walletId !== input.walletId || quote.network !== input.network) {
    throw new MockRequestError(
      409,
      'QUOTE_STALE',
      'A cotação não corresponde à carteira informada.',
    )
  }

  const cart = findUserCart(db, actor.user.id)

  if (!cart || cart.version !== quote.cartVersion) {
    throw new MockRequestError(409, 'QUOTE_STALE', 'O carrinho mudou depois da cotação.')
  }

  for (const item of quote.items) {
    const nft = db.nfts.find((candidate) => candidate.id === item.nftId)

    if (!nft) {
      throw new MockRequestError(409, 'QUOTE_STALE', 'Um NFT da cotação não existe mais.')
    }

    if (nft.version !== item.version || nft.priceEth !== item.unitPriceEth) {
      throw new MockRequestError(
        409,
        'QUOTE_STALE',
        'Os dados de um NFT mudaram depois da cotação.',
      )
    }

    if (nft.availability !== 'available' || nft.availableQuantity < item.quantity) {
      throw new MockRequestError(
        409,
        'INSUFFICIENT_AVAILABILITY',
        'Um item da cotação não está mais disponível.',
        { details: { nftId: nft.id } },
      )
    }
  }

  const wallet = db.wallets[actor.user.id]?.find((item) => item.id === quote.walletId)

  if (!wallet) {
    throw new MockRequestError(404, 'NOT_FOUND', 'Carteira não encontrada.')
  }

  const createdAt = nowIso()
  const paymentDelayMs = db.scenario.paymentDelayMs

  const result = mutateMockDb((draft) => {
    const orderId = nextMockId(draft, 'order')
    const order: MockOrder = {
      id: orderId,
      userId: actor.user.id,
      status: 'pending',
      items: quote.items.map((item) => ({
        nftId: item.nftId,
        name: item.name,
        imageUrl: item.imageUrl,
        quantity: item.quantity,
        unitPriceEth: item.unitPriceEth,
        lineTotalEth: item.lineTotalEth,
      })),
      collector: input.collector,
      wallet: {
        id: wallet.id,
        label: wallet.label,
        address: wallet.address,
        network: wallet.network,
      },
      couponCode: quote.coupon?.code ?? null,
      subtotalEth: quote.subtotalEth,
      discountEth: quote.discountEth,
      networkFeeEth: quote.networkFeeEth,
      totalEth: quote.totalEth,
      currency: quote.currency,
      quoteId: quote.id,
      receipt: null,
      failureReason: null,
      createdAt,
      updatedAt: createdAt,
      version: 1,
      cartId: cart.id,
      cartVersionAtCheckout: cart.version,
      paymentResult: draft.scenario.paymentResult,
      settleAt: addMilliseconds(createdAt, paymentDelayMs),
    }
    const updatedNfts = quote.items.flatMap((item) => {
      const nft = draft.nfts.find((candidate) => candidate.id === item.nftId)

      if (!nft) {
        return []
      }

      nft.editionSold += item.quantity
      nft.availableQuantity = Math.max(0, nft.availableQuantity - item.quantity)

      if (nft.availableQuantity === 0) {
        nft.availability = 'sold_out'
      }

      nft.version += 1
      nft.updatedAt = createdAt

      return [structuredClone(nft)]
    })

    draft.orders.push(order)
    draft.quotes = draft.quotes.filter((item) => item.id !== quote.id)
    draft.idempotency[`${actor.user.id}:${idempotencyKey}`] = {
      userId: actor.user.id,
      payloadHash,
      orderId,
      createdAt,
    }

    return {
      order,
      updatedNfts,
      paymentDelayMs,
    }
  })

  emitOrderUpdated(toOrder(result.order), actor.user.id)

  for (const nft of result.updatedNfts) {
    emitNftUpdated(nft)
  }

  globalThis.setTimeout(() => {
    settleOrder(result.order.id)
  }, result.paymentDelayMs)

  return {
    order: toOrder(result.order),
    replayed: false,
  }
}

export function settleOrder(orderId: string) {
  const settlement = mutateMockDb((db) => {
    const order = db.orders.find((item) => item.id === orderId)

    if (!order || order.status !== 'pending') {
      return null
    }

    const timestamp = nowIso()
    const updatedNfts: MockDb['nfts'] = []

    if (order.paymentResult === 'confirmed') {
      const transactionHash = randomHash()
      order.status = 'confirmed'
      order.receipt = {
        number: `REC-${new Date().getUTCFullYear()}-${order.id.split('-').at(-1) ?? order.id}`,
        transactionHash,
        explorerUrl: explorerUrlFor(order.wallet.network, transactionHash),
        paidAt: timestamp,
      }
      order.failureReason = null
      applyOrderToCart(db, order.userId, order.cartId, order.cartVersionAtCheckout, order.items)
    } else {
      order.status = 'declined'
      order.failureReason = 'Pagamento recusado pelo emissor.'
      order.receipt = null

      for (const item of order.items) {
        const nft = db.nfts.find((candidate) => candidate.id === item.nftId)

        if (!nft) {
          continue
        }

        nft.editionSold = Math.max(0, nft.editionSold - item.quantity)
        nft.availableQuantity += item.quantity

        if (nft.availability === 'sold_out') {
          nft.availability = 'available'
        }

        nft.version += 1
        nft.updatedAt = timestamp
        updatedNfts.push(structuredClone(nft))
      }
    }

    order.version += 1
    order.updatedAt = timestamp

    return {
      order: toOrder(order),
      userId: order.userId,
      updatedNfts,
    }
  })

  if (!settlement) {
    return null
  }

  emitOrderUpdated(settlement.order, settlement.userId)

  for (const nft of settlement.updatedNfts) {
    emitNftUpdated(nft)
  }

  return settlement.order
}

export function settleDueOrders() {
  const dueOrders = getMockDb().orders.filter(
    (order) => order.status === 'pending' && Date.parse(order.settleAt) <= Date.now(),
  )

  return dueOrders
    .map((order) => settleOrder(order.id))
    .filter((order): order is Order => order !== null)
}

export function getOrderById(userId: string, orderId: string): Order {
  settleDueOrders()

  const order = getMockDb().orders.find((item) => item.id === orderId && item.userId === userId)

  if (!order) {
    throw new MockRequestError(404, 'NOT_FOUND', 'Pedido não encontrado.')
  }

  return toOrder(order)
}

export function getCartForQuote(actor: MockAuthenticatedActor): Cart | null {
  const cart = getExistingCart(actor)

  return cart ? toCart(getMockDb(), cart) : null
}
