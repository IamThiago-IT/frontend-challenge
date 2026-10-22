import { z } from 'zod'

import {
  blockchainNetworkSchema,
  idSchema,
  isoDateSchema,
  versionSchema,
} from '@/lib/api/contracts'

export const walletAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Informe um endereço EVM válido')

export const walletSchema = z.object({
  id: idSchema,
  label: z.string().trim().min(1).max(40),
  address: walletAddressSchema,
  network: blockchainNetworkSchema,
  isPrimary: z.boolean(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
  version: versionSchema,
})

export const walletsResponseSchema = z.object({
  items: z.array(walletSchema),
  maxWallets: z.number().int().positive(),
})

export const createWalletRequestSchema = z.object({
  label: z.string().trim().min(1).max(40),
  address: walletAddressSchema,
  network: blockchainNetworkSchema,
  isPrimary: z.boolean().optional(),
})

export const updateWalletRequestSchema = z.object({
  label: z.string().trim().min(1).max(40).optional(),
  address: walletAddressSchema.optional(),
  network: blockchainNetworkSchema.optional(),
  isPrimary: z.boolean().optional(),
})

export const connectWalletRequestSchema = z.object({
  network: blockchainNetworkSchema,
})

export const walletConnectionSchema = z.object({
  walletId: idSchema,
  address: walletAddressSchema,
  network: blockchainNetworkSchema,
  connectedAt: isoDateSchema,
})

export type Wallet = z.infer<typeof walletSchema>
export type WalletsResponse = z.infer<typeof walletsResponseSchema>
export type CreateWalletRequest = z.infer<typeof createWalletRequestSchema>
export type UpdateWalletRequest = z.infer<typeof updateWalletRequestSchema>
export type ConnectWalletRequest = z.infer<typeof connectWalletRequestSchema>
export type WalletConnection = z.infer<typeof walletConnectionSchema>
