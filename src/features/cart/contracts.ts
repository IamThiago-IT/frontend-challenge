import { z } from 'zod'

import {
  currencySchema,
  ethAmountSchema,
  idSchema,
  isoDateSchema,
  versionSchema,
} from '@/lib/api/contracts'
import { nftSummarySchema } from '@/features/catalog/contracts'

export const appliedCouponSchema = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
  expiresAt: isoDateSchema,
})

export const cartTotalsSchema = z.object({
  subtotalEth: ethAmountSchema,
  discountEth: ethAmountSchema,
  networkFeeEth: ethAmountSchema,
  totalEth: ethAmountSchema,
  currency: currencySchema,
})

export const cartItemSchema = z.object({
  nft: nftSummarySchema,
  quantity: z.number().int().positive(),
  lineTotalEth: ethAmountSchema,
})

export const cartSchema = z.object({
  id: idSchema,
  items: z.array(cartItemSchema),
  itemCount: z.number().int().nonnegative(),
  coupon: appliedCouponSchema.nullable(),
  totals: cartTotalsSchema,
  version: versionSchema,
  updatedAt: isoDateSchema,
})

export const addCartItemRequestSchema = z.object({
  nftId: idSchema,
  quantity: z.number().int().positive().max(100),
})

export const updateCartItemRequestSchema = z.object({
  quantity: z.number().int().positive().max(100),
})

export const applyCouponRequestSchema = z.object({
  code: z.string().trim().min(1).max(40),
})

export const cartMergeResponseSchema = z.object({
  cart: cartSchema,
  adjustments: z.array(
    z.object({
      nftId: idSchema,
      requestedQuantity: z.number().int().nonnegative(),
      appliedQuantity: z.number().int().nonnegative(),
      reason: z.enum(['availability', 'unavailable', 'missing']),
    }),
  ),
})

export type Cart = z.infer<typeof cartSchema>
export type CartItem = z.infer<typeof cartItemSchema>
export type CartTotals = z.infer<typeof cartTotalsSchema>
export type AppliedCoupon = z.infer<typeof appliedCouponSchema>
export type CartMergeResponse = z.infer<typeof cartMergeResponseSchema>
