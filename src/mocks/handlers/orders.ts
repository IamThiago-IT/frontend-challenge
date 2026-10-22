import { delay, http } from 'msw'

import { createOrderRequestSchema } from '@/features/checkout/contracts'
import { createOrder, getOrderById } from '@/mocks/domain/orders'
import { getMockScenario } from '@/mocks/db'
import {
  jsonData,
  mockApiPath,
  mockHandler,
  readJson,
  requireAuthenticatedActor,
} from '@/mocks/http'

export const ordersHandlers = [
  http.post(
    mockApiPath('/orders'),
    mockHandler(async ({ request }) => {
      const actor = requireAuthenticatedActor(request)
      const input = await readJson(request, createOrderRequestSchema)
      const idempotencyKey = request.headers.get('Idempotency-Key') ?? ''
      const result = await createOrder(actor, input, idempotencyKey)
      const scenario = getMockScenario()

      if (scenario.timeoutAfterOrderCreate && !result.replayed) {
        await delay(scenario.orderTimeoutDelayMs)
      }

      return jsonData(result.order, result.replayed ? 200 : 201)
    }),
  ),
  http.get(
    mockApiPath('/orders/:orderId'),
    mockHandler(({ request, params }) => {
      const actor = requireAuthenticatedActor(request)

      return jsonData(getOrderById(actor.user.id, String(params.orderId)))
    }),
  ),
]
