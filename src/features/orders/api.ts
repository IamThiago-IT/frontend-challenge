import { apiRequest } from '@/lib/api/request'
import { orderSchema, type Order } from '@/features/orders/contracts'
import { createOrderRequestSchema, type CreateOrderRequest } from '@/features/checkout/contracts'

export function getOrder(orderId: string, signal?: AbortSignal) {
  return apiRequest(orderSchema, {
    method: 'GET',
    url: `/orders/${orderId}`,
    signal,
  })
}

export function createOrder(input: CreateOrderRequest, idempotencyKey: string) {
  const body = createOrderRequestSchema.parse(input)

  return apiRequest<Order>(orderSchema, {
    method: 'POST',
    url: '/orders',
    data: body,
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
  })
}
