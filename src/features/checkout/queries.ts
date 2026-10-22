import { queryOptions, type QueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query/keys'
import { createQuote } from '@/features/checkout/api'
import type { QuoteRequest } from '@/features/checkout/contracts'

export function quoteQueryOptions(userId: string, input: QuoteRequest | null) {
  return queryOptions({
    queryKey: queryKeys.private.quote(userId, input ?? {}),
    queryFn: ({ signal }) => {
      if (!input) {
        throw new Error('Quote input is required')
      }

      return createQuote(input, signal)
    },
    enabled: Boolean(input),
    retry: false,
    staleTime: 0,
    gcTime: 10 * 60_000,
  })
}

export function invalidateQuotes(queryClient: QueryClient, userId: string) {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.private.quotes(userId),
  })
}
