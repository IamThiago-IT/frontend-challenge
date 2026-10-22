import { apiRequest, apiRequestVoid } from '@/lib/api/request'
import {
  authResponseSchema,
  loginRequestSchema,
  registerRequestSchema,
  sessionResponseSchema,
  type LoginRequest,
  type RegisterRequest,
} from '@/features/auth/contracts'

export function login(input: LoginRequest) {
  const body = loginRequestSchema.parse(input)

  return apiRequest(authResponseSchema, {
    method: 'POST',
    url: '/auth/login',
    data: body,
  })
}

export function register(input: RegisterRequest) {
  const body = registerRequestSchema.parse(input)

  return apiRequest(authResponseSchema, {
    method: 'POST',
    url: '/auth/register',
    data: body,
  })
}

export function getSession(signal?: AbortSignal) {
  return apiRequest(sessionResponseSchema, {
    method: 'GET',
    url: '/auth/session',
    signal,
  })
}

export function logout() {
  return apiRequestVoid({
    method: 'POST',
    url: '/auth/logout',
  })
}
