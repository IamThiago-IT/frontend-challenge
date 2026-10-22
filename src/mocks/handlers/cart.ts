import { http } from 'msw'

import {
  addCartItemRequestSchema,
  applyCouponRequestSchema,
  updateCartItemRequestSchema,
} from '@/features/cart/contracts'
import {
  addCartItem,
  applyCoupon,
  getCart,
  mergeGuestCart,
  removeCartItem,
  removeCoupon,
  updateCartItem,
} from '@/mocks/domain/cart'
import { settleDueOrders } from '@/mocks/domain/orders'
import {
  jsonData,
  mockApiPath,
  mockHandler,
  readJson,
  requireActor,
  requireAuthenticatedActor,
  requireGuestId,
} from '@/mocks/http'

export const cartHandlers = [
  http.get(
    mockApiPath('/cart'),
    mockHandler(({ request }) => {
      const actor = requireActor(request, { allowGuest: true })
      settleDueOrders()

      return jsonData(getCart(actor))
    }),
  ),
  http.post(
    mockApiPath('/cart/items'),
    mockHandler(async ({ request }) => {
      const actor = requireActor(request, { allowGuest: true })
      const input = await readJson(request, addCartItemRequestSchema)

      return jsonData(addCartItem(actor, input.nftId, input.quantity))
    }),
  ),
  http.patch(
    mockApiPath('/cart/items/:nftId'),
    mockHandler(async ({ request, params }) => {
      const actor = requireActor(request, { allowGuest: true })
      const input = await readJson(request, updateCartItemRequestSchema)

      return jsonData(updateCartItem(actor, String(params.nftId), input.quantity))
    }),
  ),
  http.delete(
    mockApiPath('/cart/items/:nftId'),
    mockHandler(({ request, params }) => {
      const actor = requireActor(request, { allowGuest: true })

      return jsonData(removeCartItem(actor, String(params.nftId)))
    }),
  ),
  http.put(
    mockApiPath('/cart/coupon'),
    mockHandler(async ({ request }) => {
      const actor = requireActor(request, { allowGuest: true })
      const input = await readJson(request, applyCouponRequestSchema)

      return jsonData(applyCoupon(actor, input.code))
    }),
  ),
  http.delete(
    mockApiPath('/cart/coupon'),
    mockHandler(({ request }) => {
      const actor = requireActor(request, { allowGuest: true })

      return jsonData(removeCoupon(actor))
    }),
  ),
  http.post(
    mockApiPath('/cart/merge'),
    mockHandler(({ request }) => {
      const actor = requireAuthenticatedActor(request)
      const guestId = requireGuestId(request)

      return jsonData(mergeGuestCart(actor.user.id, guestId))
    }),
  ),
]
