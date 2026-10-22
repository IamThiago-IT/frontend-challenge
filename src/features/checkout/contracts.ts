import { z } from 'zod'

import {
  blockchainNetworkSchema,
  currencySchema,
  ethAmountSchema,
  idSchema,
  isoDateSchema,
  versionSchema,
} from '@/lib/api/contracts'
import { appliedCouponSchema } from '@/features/cart/contracts'

export const quoteRequestSchema = z.object({
  walletId: idSchema,
  network: blockchainNetworkSchema,
})

export const quoteItemSchema = z.object({
  nftId: idSchema,
  name: z.string().min(1),
  imageUrl: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPriceEth: ethAmountSchema,
  lineTotalEth: ethAmountSchema,
  version: versionSchema,
})

export const quoteSchema = z.object({
  id: idSchema,
  items: z.array(quoteItemSchema).min(1),
  coupon: appliedCouponSchema.nullable(),
  subtotalEth: ethAmountSchema,
  discountEth: ethAmountSchema,
  networkFeeEth: ethAmountSchema,
  totalEth: ethAmountSchema,
  currency: currencySchema,
  walletId: idSchema,
  network: blockchainNetworkSchema,
  cartVersion: versionSchema,
  createdAt: isoDateSchema,
  expiresAt: isoDateSchema,
})

export const orderCollectorSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email(),
})

export const createOrderRequestSchema = z.object({
  quoteId: idSchema,
  walletId: idSchema,
  network: blockchainNetworkSchema,
  collector: orderCollectorSchema,
})

export type QuoteRequest = z.infer<typeof quoteRequestSchema>
export type Quote = z.infer<typeof quoteSchema>
export type QuoteItem = z.infer<typeof quoteItemSchema>
export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>
export type OrderCollector = z.infer<typeof orderCollectorSchema>
