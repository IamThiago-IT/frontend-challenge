import type { QueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query/keys'
import { clearGuestId, getGuestId } from '@/lib/session/storage'
import { mergeGuestCart } from '@/features/cart/api'
import { applyAuthenticatedSession } from '@/features/auth/session'
import { toInternalRedirect } from '@/features/auth/redirect'
import type { AuthResponse } from '@/features/auth/contracts'

export async function completeSignIn(
  queryClient: QueryClient,
  session: AuthResponse,
  redirect: string | undefined,
) {
  applyAuthenticatedSession(queryClient, session)

  if (getGuestId()) {
    try {
      const merged = await mergeGuestCart()
      queryClient.setQueryData(queryKeys.private.cart(session.user.id), merged.cart)
      clearGuestId()
    } catch {
      clearGuestId()
    }
  }

  queryClient.removeQueries({ queryKey: queryKeys.guest.cart })
  await queryClient.invalidateQueries({
    queryKey: queryKeys.private.cart(session.user.id),
  })

  window.location.assign(toInternalRedirect(redirect))
}
