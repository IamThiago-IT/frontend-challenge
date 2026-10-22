import { queryOptions } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query/keys'
import { getProfile } from '@/features/profile/api'

export function profileQueryOptions(userId: string) {
  return queryOptions({
    queryKey: queryKeys.private.profile(userId),
    queryFn: ({ signal }) => getProfile(signal),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  })
}
