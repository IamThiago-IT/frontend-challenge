import { http } from 'msw'

import { quoteRequestSchema } from '@/features/checkout/contracts'
import { createQuote } from '@/mocks/domain/orders'
import {
  jsonData,
  mockApiPath,
  mockHandler,
  readJson,
  requireAuthenticatedActor,
} from '@/mocks/http'

export const checkoutHandlers = [
  http.post(
    mockApiPath('/quote'),
    mockHandler(async ({ request }) => {
      const actor = requireAuthenticatedActor(request)
      const input = await readJson(request, quoteRequestSchema)

      return jsonData(createQuote(actor, input.walletId, input.network))
    }),
  ),
]
