import type { AxiosRequestConfig } from 'axios'
import type { ZodType } from 'zod'

import { ApiError } from '@/lib/api/errors'
import { apiClient } from '@/lib/api/client'

export async function apiRequest<T>(schema: ZodType<T>, config: AxiosRequestConfig) {
  const response = await apiClient.request<unknown>(config)
  const parsed = schema.safeParse(response.data)

  if (!parsed.success) {
    throw new ApiError({
      status: response.status,
      code: 'INVALID_RESPONSE',
      message: 'A resposta da API não corresponde ao contrato esperado.',
      details: {
        issues: parsed.error.issues,
      },
    })
  }

  return parsed.data
}

export async function apiRequestVoid(config: AxiosRequestConfig) {
  await apiClient.request(config)
}
