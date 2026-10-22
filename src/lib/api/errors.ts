import type { ApiErrorBody, ApiErrorCode } from '@/lib/api/contracts'

export class ApiError extends Error {
  readonly status: number
  readonly code: ApiErrorCode
  readonly fieldErrors?: Record<string, string[]>
  readonly details?: Record<string, unknown>

  constructor(input: {
    status: number
    code: ApiErrorCode
    message: string
    fieldErrors?: Record<string, string[]>
    details?: Record<string, unknown>
    cause?: unknown
  }) {
    super(input.message, { cause: input.cause })

    this.name = 'ApiError'
    this.status = input.status
    this.code = input.code
    this.fieldErrors = input.fieldErrors
    this.details = input.details
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function getApiFieldError(error: unknown, field: string) {
  if (!isApiError(error)) {
    return null
  }

  return error.fieldErrors?.[field]?.[0] ?? null
}

export function createApiError(error: ApiErrorBody, status: number) {
  return new ApiError({
    status,
    code: error.code,
    message: error.message,
    fieldErrors: error.fieldErrors,
    details: error.details,
  })
}

export const sessionExpiredEventName = 'nft-marketplace:session-expired'

export function dispatchSessionExpired() {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new Event(sessionExpiredEventName))
}

export function subscribeToSessionExpired(listener: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  window.addEventListener(sessionExpiredEventName, listener)

  return () => window.removeEventListener(sessionExpiredEventName, listener)
}
