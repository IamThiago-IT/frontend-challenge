import { queryOptions } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query/keys'
import { registerOrderVersion } from '@/lib/socket/version-registry'
import { getOrder } from '@/features/orders/api'

export function orderQueryOptions(userId: string, orderId: string) {
  return queryOptions({
    queryKey: queryKeys.private.order(userId, orderId),
    queryFn: async ({ client, signal }) => {
      const order = await getOrder(orderId, signal)
      const queryKey = queryKeys.private.order(userId, orderId)
      const previous = client.getQueryData<Awaited<ReturnType<typeof getOrder>>>(queryKey)

      if (previous && previous.version > order.version) {
        return previous
      }

      registerOrderVersion(order)

      return order
    },
    staleTime: 0,
    gcTime: 10 * 60_000,
    refetchOnMount: 'always',
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 1_500 : false),
  })
}
