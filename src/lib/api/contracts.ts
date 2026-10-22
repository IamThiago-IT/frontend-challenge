import { z } from 'zod'

import { ethAmountPattern, parseEthToWei } from '@/lib/money/eth'

export const idSchema = z.string().min(1)
export const isoDateSchema = z.iso.datetime()
export const versionSchema = z.number().int().nonnegative()
export const currencySchema = z.literal('ETH')
export const blockchainNetworkSchema = z.enum(['ethereum', 'polygon', 'base'])
export const ethAmountSchema = z
  .string()
  .regex(ethAmountPattern, 'Informe um valor em ETH com até 18 casas decimais')
export const positiveEthAmountSchema = ethAmountSchema.refine(
  (value) => parseEthToWei(value) > 0n,
  'O valor deve ser maior que zero',
)

export const apiErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'INVALID_CREDENTIALS',
  'EMAIL_ALREADY_EXISTS',
  'SESSION_EXPIRED',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'INSUFFICIENT_AVAILABILITY',
  'CART_EMPTY',
  'GUEST_ID_REQUIRED',
  'INVALID_COUPON',
  'EXPIRED_COUPON',
  'QUOTE_EXPIRED',
  'QUOTE_STALE',
  'IDEMPOTENCY_CONFLICT',
  'PAYMENT_DECLINED',
  'WALLET_LIMIT_EXCEEDED',
  'WALLET_CONFLICT',
  'TRANSIENT_ERROR',
  'NETWORK_ERROR',
  'TIMEOUT',
  'INVALID_RESPONSE',
  'UNKNOWN_ERROR',
])

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>

export const fieldErrorsSchema = z.record(z.string(), z.array(z.string()))

export const apiErrorBodySchema = z.object({
  code: apiErrorCodeSchema,
  message: z.string(),
  fieldErrors: fieldErrorsSchema.optional(),
  details: z.record(z.string(), z.unknown()).optional(),
})

export const apiErrorResponseSchema = z.object({
  error: apiErrorBodySchema,
})

export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>

export function paginatedSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })
}
