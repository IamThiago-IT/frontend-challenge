import { mockDbSchemaVersion, mockSeedVersion, type MockDb } from '@/mocks/db/schema'
import { seedNfts, seedCategories } from '@/mocks/fixtures/catalog'
import { seedCoupons } from '@/mocks/fixtures/coupons'
import { createSeedOrder } from '@/mocks/fixtures/orders'
import { seedUsers } from '@/mocks/fixtures/users'
import { seedWallets } from '@/mocks/fixtures/wallets'
import { createDefaultScenario } from '@/mocks/scenario'

export function createSeedDb(): MockDb {
  return {
    schemaVersion: mockDbSchemaVersion,
    seedVersion: mockSeedVersion,
    seedId: crypto.randomUUID().slice(0, 8),
    users: structuredClone(seedUsers),
    sessions: [],
    nfts: structuredClone(seedNfts),
    categories: structuredClone(seedCategories),
    favorites: {
      'user-ana': ['nft-003', 'nft-012'],
      'user-bruno': ['nft-007'],
    },
    carts: {},
    quotes: [],
    orders: [createSeedOrder()],
    wallets: structuredClone(seedWallets),
    coupons: structuredClone(seedCoupons),
    idempotency: {},
    counters: {
      order: 1000,
      quote: 1000,
      cart: 1000,
      wallet: 1000,
      event: 0,
    },
    lastEvents: [],
    scenario: createDefaultScenario(),
  }
}
