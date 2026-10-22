import type { NftCategory, NftDetail } from '@/features/catalog/contracts'
import type { Quote } from '@/features/checkout/contracts'
import type { Order } from '@/features/orders/contracts'
import type { UserProfile } from '@/features/auth/contracts'
import type { Wallet } from '@/features/wallets/contracts'
import type { RealtimeEvent } from '@/lib/socket/events'
import type { MockScenario } from '@/mocks/scenario'

export const mockDbSchemaVersion = 1
export const mockSeedVersion = '2026-10-21.1'

export type MockUser = UserProfile & {
  passwordSalt: string
  passwordHash: string
}

export type MockSession = {
  token: string
  userId: string
  createdAt: string
  expiresAt: string
}

export type MockCartItem = {
  nftId: string
  quantity: number
  addedAt: string
}

export type MockCart = {
  id: string
  ownerKey: string
  items: MockCartItem[]
  couponCode: string | null
  version: number
  updatedAt: string
}

export type MockCoupon = {
  code: string
  label: string
  discountBps: number
  expiresAt: string
}

export type MockQuote = Quote & {
  userId: string
}

export type MockOrder = Order & {
  userId: string
  cartId: string
  cartVersionAtCheckout: number
  paymentResult: 'confirmed' | 'declined'
  settleAt: string
}

export type MockIdempotencyRecord = {
  userId: string
  payloadHash: string
  orderId: string
  createdAt: string
}

export type MockDb = {
  schemaVersion: number
  seedVersion: string
  seedId: string
  users: MockUser[]
  sessions: MockSession[]
  nfts: NftDetail[]
  categories: NftCategory[]
  favorites: Record<string, string[]>
  carts: Record<string, MockCart>
  quotes: MockQuote[]
  orders: MockOrder[]
  wallets: Record<string, Wallet[]>
  coupons: MockCoupon[]
  idempotency: Record<string, MockIdempotencyRecord>
  counters: Record<string, number>
  lastEvents: RealtimeEvent[]
  scenario: MockScenario
}
