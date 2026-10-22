import { apiRequest } from '@/lib/api/request'
import {
  connectWalletRequestSchema,
  createWalletRequestSchema,
  updateWalletRequestSchema,
  walletConnectionSchema,
  walletSchema,
  walletsResponseSchema,
  type ConnectWalletRequest,
  type CreateWalletRequest,
  type UpdateWalletRequest,
} from '@/features/wallets/contracts'

export function getWallets(signal?: AbortSignal) {
  return apiRequest(walletsResponseSchema, {
    method: 'GET',
    url: '/wallets',
    signal,
  })
}

export function connectWallet(walletId: string, input: ConnectWalletRequest) {
  const body = connectWalletRequestSchema.parse(input)

  return apiRequest(walletConnectionSchema, {
    method: 'POST',
    url: `/wallets/${walletId}/connect`,
    data: body,
  })
}

export function createWallet(input: CreateWalletRequest) {
  const body = createWalletRequestSchema.parse(input)

  return apiRequest(walletSchema, {
    method: 'POST',
    url: '/wallets',
    data: body,
  })
}

export function updateWallet(walletId: string, input: UpdateWalletRequest) {
  const body = updateWalletRequestSchema.parse(input)

  return apiRequest(walletSchema, {
    method: 'PATCH',
    url: `/wallets/${walletId}`,
    data: body,
  })
}
