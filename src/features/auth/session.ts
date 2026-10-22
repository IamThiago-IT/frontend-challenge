import type { QueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query/keys'
import { clearGuestId, clearSessionToken, setSessionToken } from '@/lib/session/storage'
import type { AuthResponse, SessionResponse } from '@/features/auth/contracts'

function removePrivateQueries(queryClient: QueryClient) {
  queryClient.removeQueries({
    predicate: (query) => query.queryKey[0] === 'private',
  })
}

export function applyAuthenticatedSession(queryClient: QueryClient, session: AuthResponse) {
  setSessionToken(session.token)
  removePrivateQueries(queryClient)
  queryClient.setQueryData<SessionResponse | null>(queryKeys.auth.session, () => ({
    user: session.user,
    expiresAt: session.expiresAt,
  }))
}

export function clearAuthenticatedSession(queryClient: QueryClient) {
  clearSessionToken()
  clearGuestId()
  void import('@/lib/socket/client').then(({ disconnectSocket }) => {
    disconnectSocket()
  })
  queryClient.setQueryData<SessionResponse | null>(queryKeys.auth.session, null)
  queryClient.removeQueries({
    predicate: (query) => query.queryKey[0] === 'private' || query.queryKey[0] === 'guest',
  })
  queryClient.getMutationCache().clear()
}
