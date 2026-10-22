import { queryOptions } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query/keys'
import { registerNftVersions } from '@/lib/socket/version-registry'
import { getFavorites } from '@/features/favorites/api'

export function favoritesQueryOptions(userId: string) {
  return queryOptions({
    queryKey: queryKeys.private.favorites(userId),
    queryFn: async ({ signal }) => {
      const response = await getFavorites(signal)
      registerNftVersions(response.items)

      return response
    },
    staleTime: 30_000,
    gcTime: 10 * 60_000,
  })
}
