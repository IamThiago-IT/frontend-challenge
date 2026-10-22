import { queryOptions } from '@tanstack/react-query'

import { isApiError } from '@/lib/api/errors'
import { queryKeys } from '@/lib/query/keys'
import { clearSessionToken, getSessionToken } from '@/lib/session/storage'
import { getSession } from '@/features/auth/api'
import type { SessionResponse } from '@/features/auth/contracts'

export const sessionQueryOptions = queryOptions({
  queryKey: queryKeys.auth.session,
  queryFn: async (): Promise<SessionResponse | null> => {
    if (!getSessionToken()) {
      return null
    }

    try {
      return await getSession()
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        clearSessionToken()
        return null
      }

      throw error
    }
  },
  staleTime: 0,
  gcTime: 10 * 60_000,
  retry: false,
})
