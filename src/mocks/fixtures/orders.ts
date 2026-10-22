import type { MockOrder } from '@/mocks/db/schema'
import { seedNfts } from '@/mocks/fixtures/catalog'
import { seedUsers } from '@/mocks/fixtures/users'
import { seedWallets } from '@/mocks/fixtures/wallets'

export function createSeedOrder(): MockOrder {
  const buyer = seedUsers.find((user) => user.id === 'user-bruno') ?? seedUsers[0]
  const wallet = seedWallets['user-bruno']?.[0]
  const nft = seedNfts.find((item) => item.id === 'nft-006') ?? seedNfts[0]

  if (!buyer || !wallet || !nft) {
    throw new Error('Seed order dependencies are missing')
  }

  const transactionHash = `0x${'a1'.repeat(32)}`
  const createdAt = '2026-09-15T14:00:00.000Z'
  const updatedAt = '2026-09-15T14:01:00.000Z'

  return {
    id: 'order-seed-0001',
    userId: buyer.id,
    status: 'confirmed',
    items: [
      {
        nftId: nft.id,
        name: nft.name,
        imageUrl: nft.imageUrl,
        quantity: 1,
        unitPriceEth: '5.8',
        lineTotalEth: '5.8',
      },
    ],
    collector: {
      name: buyer.name,
      email: buyer.email,
    },
    wallet: {
      id: wallet.id,
      label: wallet.label,
      address: wallet.address,
      network: wallet.network,
    },
    couponCode: null,
    subtotalEth: '5.8',
    discountEth: '0',
    networkFeeEth: '0.005',
    totalEth: '5.805',
    currency: 'ETH',
    quoteId: 'quote-seed-0001',
    receipt: {
      number: 'REC-2026-0001',
      transactionHash,
      explorerUrl: `https://etherscan.io/tx/${transactionHash}`,
      paidAt: updatedAt,
    },
    failureReason: null,
    createdAt,
    updatedAt,
    version: 2,
    cartId: 'cart-seed-0001',
    cartVersionAtCheckout: 1,
    paymentResult: 'confirmed',
    settleAt: updatedAt,
  }
}
