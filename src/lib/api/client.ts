import axios, { type AxiosError } from 'axios'

import { apiErrorResponseSchema } from '@/lib/api/contracts'
import { ApiError, createApiError, dispatchSessionExpired, isApiError } from '@/lib/api/errors'
import { env } from '@/lib/env'
import { getGuestId, getSessionToken } from '@/lib/session/storage'

const authEndpointsWithoutExpiry = ['/auth/login', '/auth/register', '/auth/session']

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  headers: {
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = getSessionToken()

  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  } else {
    const guestId = getGuestId()

    if (guestId) {
      config.headers.set('X-Guest-Id', guestId)
    }
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (isApiError(error)) {
      return Promise.reject(error)
    }

    if (!axios.isAxiosError(error)) {
      return Promise.reject(
        new ApiError({
          status: 0,
          code: 'UNKNOWN_ERROR',
          message: 'Ocorreu um erro inesperado.',
          cause: error,
        }),
      )
    }

    const axiosError = error as AxiosError<unknown>
    const status = axiosError.response?.status ?? 0

    if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
      return Promise.reject(
        new ApiError({
          status: 0,
          code: 'TIMEOUT',
          message: 'A requisição demorou mais que o esperado.',
          cause: error,
        }),
      )
    }

    if (!axiosError.response) {
      return Promise.reject(
        new ApiError({
          status: 0,
          code: 'NETWORK_ERROR',
          message: 'Não foi possível conectar à API.',
          cause: error,
        }),
      )
    }

    const parsedError = apiErrorResponseSchema.safeParse(axiosError.response.data)

    if (parsedError.success) {
      const apiError = createApiError(parsedError.data.error, status)
      const requestUrl = axiosError.config?.url ?? ''
      const shouldExpireSession =
        status === 401 &&
        Boolean(getSessionToken()) &&
        !authEndpointsWithoutExpiry.some((endpoint) => requestUrl.includes(endpoint))

      if (shouldExpireSession) {
        dispatchSessionExpired()
      }

      return Promise.reject(apiError)
    }

    return Promise.reject(
      new ApiError({
        status,
        code: status >= 500 ? 'TRANSIENT_ERROR' : 'UNKNOWN_ERROR',
        message:
          status >= 500
            ? 'A API está temporariamente indisponível.'
            : 'A resposta da API não pôde ser processada.',
        cause: error,
      }),
    )
  },
)
