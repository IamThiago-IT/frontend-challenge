import { HttpResponse, http } from 'msw'

import { loginRequestSchema, registerRequestSchema } from '@/features/auth/contracts'
import { loginUser, logoutSession, registerUser, sessionResponse } from '@/mocks/domain/auth'
import {
  getRequestSessionToken,
  jsonData,
  mockApiPath,
  mockHandler,
  readJson,
  requireAuthenticatedActor,
} from '@/mocks/http'

export const authHandlers = [
  http.post(
    mockApiPath('/auth/login'),
    mockHandler(async ({ request }) => {
      const input = await readJson(request, loginRequestSchema)
      const response = await loginUser(input)

      return jsonData(response)
    }),
  ),
  http.post(
    mockApiPath('/auth/register'),
    mockHandler(async ({ request }) => {
      const input = await readJson(request, registerRequestSchema)
      const response = await registerUser(input)

      return jsonData(response, 201)
    }),
  ),
  http.get(
    mockApiPath('/auth/session'),
    mockHandler(({ request }) => {
      const actor = requireAuthenticatedActor(request)

      return jsonData(sessionResponse(actor.user, actor.session.expiresAt))
    }),
  ),
  http.post(
    mockApiPath('/auth/logout'),
    mockHandler(({ request }) => {
      const token = getRequestSessionToken(request)

      if (token) {
        logoutSession(token)
      }

      return new HttpResponse(null, {
        status: 204,
      })
    }),
  ),
]
