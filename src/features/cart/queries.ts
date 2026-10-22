import { queryOptions, type QueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query/keys'
import { getCart } from '@/features/cart/api'

export function cartQueryOptions(userId: string | null) {
  return queryOptions({
    queryKey: userId ? queryKeys.private.cart(userId) : queryKeys.guest.cart,
    queryFn: ({ signal }) => getCart(signal),
    staleTime: 0,
    gcTime: 10 * 60_000,
  })
}

export function invalidateCart(queryClient: QueryClient, userId: string | null) {
  void queryClient.invalidateQueries({
    queryKey: userId ? queryKeys.private.cart(userId) : queryKeys.guest.cart,
  })
}
