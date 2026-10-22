import { apiRequest } from '@/lib/api/request'
import { quoteRequestSchema, quoteSchema, type QuoteRequest } from '@/features/checkout/contracts'

export function createQuote(input: QuoteRequest, signal?: AbortSignal) {
  const body = quoteRequestSchema.parse(input)

  return apiRequest(quoteSchema, {
    method: 'POST',
    url: '/quote',
    data: body,
    signal,
  })
}
