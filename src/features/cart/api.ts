import { apiRequest } from '@/lib/api/request'
import { getOrCreateGuestId, getSessionToken } from '@/lib/session/storage'
import {
  addCartItemRequestSchema,
  applyCouponRequestSchema,
  cartMergeResponseSchema,
  cartSchema,
  updateCartItemRequestSchema,
} from '@/features/cart/contracts'

function ensureGuestIdentity() {
  if (!getSessionToken()) {
    getOrCreateGuestId()
  }
}

export function getCart(signal?: AbortSignal) {
  ensureGuestIdentity()

  return apiRequest(cartSchema, {
    method: 'GET',
    url: '/cart',
    signal,
  })
}

export function addCartItem(nftId: string, quantity: number) {
  ensureGuestIdentity()
  const body = addCartItemRequestSchema.parse({ nftId, quantity })

  return apiRequest(cartSchema, {
    method: 'POST',
    url: '/cart/items',
    data: body,
  })
}

export function updateCartItem(nftId: string, quantity: number) {
  ensureGuestIdentity()
  const body = updateCartItemRequestSchema.parse({ quantity })

  return apiRequest(cartSchema, {
    method: 'PATCH',
    url: `/cart/items/${nftId}`,
    data: body,
  })
}

export function removeCartItem(nftId: string) {
  ensureGuestIdentity()

  return apiRequest(cartSchema, {
    method: 'DELETE',
    url: `/cart/items/${nftId}`,
  })
}

export function applyCoupon(code: string) {
  ensureGuestIdentity()
  const body = applyCouponRequestSchema.parse({ code })

  return apiRequest(cartSchema, {
    method: 'PUT',
    url: '/cart/coupon',
    data: body,
  })
}

export function removeCoupon() {
  ensureGuestIdentity()

  return apiRequest(cartSchema, {
    method: 'DELETE',
    url: '/cart/coupon',
  })
}

export function mergeGuestCart() {
  const guestId = getOrCreateGuestId()

  return apiRequest(cartMergeResponseSchema, {
    method: 'POST',
    url: '/cart/merge',
    headers: {
      'X-Guest-Id': guestId,
    },
  })
}
