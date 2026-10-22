import { queryOptions } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query/keys'
import { getWallets } from '@/features/wallets/api'

export function walletsQueryOptions(userId: string) {
  return queryOptions({
    queryKey: queryKeys.private.wallets(userId),
    queryFn: ({ signal }) => getWallets(signal),
    staleTime: 30_000,
    gcTime: 10 * 60_000,
  })
}
