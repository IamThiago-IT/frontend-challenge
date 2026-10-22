import { HttpResponse, http } from 'msw'

import {
  changePasswordRequestSchema,
  updateAvatarRequestSchema,
  updateProfileRequestSchema,
} from '@/features/profile/contracts'
import { changePassword, updateAvatar, updateProfile } from '@/mocks/domain/profile'
import {
  jsonData,
  mockApiPath,
  mockHandler,
  readJson,
  requireAuthenticatedActor,
} from '@/mocks/http'

export const profileHandlers = [
  http.get(
    mockApiPath('/profile'),
    mockHandler(({ request }) => {
      const actor = requireAuthenticatedActor(request)

      return jsonData(actor.user)
    }),
  ),
  http.patch(
    mockApiPath('/profile'),
    mockHandler(async ({ request }) => {
      const actor = requireAuthenticatedActor(request)
      const input = await readJson(request, updateProfileRequestSchema)

      return jsonData(updateProfile(actor.user.id, input))
    }),
  ),
  http.put(
    mockApiPath('/profile/avatar'),
    mockHandler(async ({ request }) => {
      const actor = requireAuthenticatedActor(request)
      const input = await readJson(request, updateAvatarRequestSchema)

      return jsonData(updateAvatar(actor.user.id, input))
    }),
  ),
  http.put(
    mockApiPath('/profile/password'),
    mockHandler(async ({ request }) => {
      const actor = requireAuthenticatedActor(request)
      const input = await readJson(request, changePasswordRequestSchema)

      await changePassword(actor.user.id, input)

      return new HttpResponse(null, {
        status: 204,
      })
    }),
  ),
]
