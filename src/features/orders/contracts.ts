import { z } from 'zod'

import {
  blockchainNetworkSchema,
  currencySchema,
  ethAmountSchema,
  idSchema,
  isoDateSchema,
  versionSchema,
} from '@/lib/api/contracts'
import { orderCollectorSchema } from '@/features/checkout/contracts'

export const orderStatusSchema = z.enum(['pending', 'confirmed', 'declined'])

export const orderItemSchema = z.object({
  nftId: idSchema,
  name: z.string().min(1),
  imageUrl: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPriceEth: ethAmountSchema,
  lineTotalEth: ethAmountSchema,
})

export const orderWalletSchema = z.object({
  id: idSchema,
  label: z.string().min(1),
  address: z.string().min(1),
  network: blockchainNetworkSchema,
})

export const orderReceiptSchema = z.object({
  number: z.string().min(1),
  transactionHash: z.string().min(1),
  explorerUrl: z.url(),
  paidAt: isoDateSchema,
})

export const orderSchema = z.object({
  id: idSchema,
  status: orderStatusSchema,
  items: z.array(orderItemSchema).min(1),
  collector: orderCollectorSchema,
  wallet: orderWalletSchema,
  couponCode: z.string().nullable(),
  subtotalEth: ethAmountSchema,
  discountEth: ethAmountSchema,
  networkFeeEth: ethAmountSchema,
  totalEth: ethAmountSchema,
  currency: currencySchema,
  quoteId: idSchema,
  receipt: orderReceiptSchema.nullable(),
  failureReason: z.string().nullable(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
  version: versionSchema,
})

export type Order = z.infer<typeof orderSchema>
export type OrderStatus = z.infer<typeof orderStatusSchema>
export type OrderItem = z.infer<typeof orderItemSchema>
export type OrderWallet = z.infer<typeof orderWalletSchema>
export type OrderReceipt = z.infer<typeof orderReceiptSchema>
