import type { Cart, CartTotals } from '@/features/cart/contracts'
import type { NftDetail, NftSummary } from '@/features/catalog/contracts'
import type { Quote } from '@/features/checkout/contracts'
import type { Order } from '@/features/orders/contracts'
import type { UserProfile } from '@/features/auth/contracts'
import type {
  MockCart,
  MockCoupon,
  MockDb,
  MockOrder,
  MockQuote,
  MockUser,
} from '@/mocks/db/schema'
import { parseEthToWei, toEthString } from '@/lib/money/eth'

export const maxWallets = 5
export const maxCartQuantity = 100
export const quoteLifetimeMs = 10 * 60_000

const networkFeeWei: Record<'ethereum' | 'polygon' | 'base', bigint> = {
  ethereum: 2_000_000_000_000_000n,
  polygon: 500_000_000_000_000n,
  base: 1_000_000_000_000_000n,
}

export function toPublicUser(user: MockUser): UserProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    joinedAt: user.joinedAt,
  }
}

export function toNftSummary(nft: NftDetail): NftSummary {
  return {
    id: nft.id,
    name: nft.name,
    imageUrl: nft.imageUrl,
    category: nft.category,
    collection: nft.collection,
    creator: nft.creator,
    priceEth: nft.priceEth,
    currency: nft.currency,
    network: nft.network,
    availability: nft.availability,
    availableQuantity: nft.availableQuantity,
    editionSize: nft.editionSize,
    editionSold: nft.editionSold,
    likes: nft.likes,
    featured: nft.featured,
    version: nft.version,
    createdAt: nft.createdAt,
    updatedAt: nft.updatedAt,
  }
}

export function networkFeeFor(network: 'ethereum' | 'polygon' | 'base') {
  return toEthString(networkFeeWei[network])
}

export function calculateCartTotals(
  items: Array<{ nft: NftSummary; quantity: number }>,
  coupon: MockCoupon | null,
  network: 'ethereum' | 'polygon' | 'base' = 'ethereum',
): CartTotals {
  const subtotalWei = items.reduce(
    (total, item) => total + parseEthToWei(item.nft.priceEth) * BigInt(item.quantity),
    0n,
  )
  const discountWei = coupon ? (subtotalWei * BigInt(coupon.discountBps)) / 10_000n : 0n
  const feeWei = networkFeeWei[network]

  return {
    subtotalEth: toEthString(subtotalWei),
    discountEth: toEthString(discountWei),
    networkFeeEth: toEthString(feeWei),
    totalEth: toEthString(subtotalWei - discountWei + feeWei),
    currency: 'ETH',
  }
}

export function resolveCoupon(db: MockDb, code: string | null) {
  if (!code) {
    return null
  }

  const coupon = db.coupons.find((item) => item.code === code) ?? null

  if (!coupon || Date.parse(coupon.expiresAt) <= Date.now()) {
    return null
  }

  return coupon
}

export function toCart(db: MockDb, cart: MockCart): Cart {
  const items = cart.items
    .map((item) => {
      const nft = db.nfts.find((candidate) => candidate.id === item.nftId)

      if (!nft) {
        return null
      }

      return {
        nft: toNftSummary(nft),
        quantity: item.quantity,
        lineTotalEth: toEthString(parseEthToWei(nft.priceEth) * BigInt(item.quantity)),
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
  const coupon = resolveCoupon(db, cart.couponCode)

  return {
    id: cart.id,
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    coupon: coupon
      ? {
          code: coupon.code,
          label: coupon.label,
          expiresAt: coupon.expiresAt,
        }
      : null,
    totals: calculateCartTotals(items, coupon),
    version: cart.version,
    updatedAt: cart.updatedAt,
  }
}

export function toQuote(quote: MockQuote): Quote {
  return {
    id: quote.id,
    items: quote.items,
    coupon: quote.coupon,
    subtotalEth: quote.subtotalEth,
    discountEth: quote.discountEth,
    networkFeeEth: quote.networkFeeEth,
    totalEth: quote.totalEth,
    currency: quote.currency,
    walletId: quote.walletId,
    network: quote.network,
    cartVersion: quote.cartVersion,
    createdAt: quote.createdAt,
    expiresAt: quote.expiresAt,
  }
}

export function toOrder(order: MockOrder): Order {
  return {
    id: order.id,
    status: order.status,
    items: order.items,
    collector: order.collector,
    wallet: order.wallet,
    couponCode: order.couponCode,
    subtotalEth: order.subtotalEth,
    discountEth: order.discountEth,
    networkFeeEth: order.networkFeeEth,
    totalEth: order.totalEth,
    currency: order.currency,
    quoteId: order.quoteId,
    receipt: order.receipt,
    failureReason: order.failureReason,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    version: order.version,
  }
}

export function explorerUrlFor(network: 'ethereum' | 'polygon' | 'base', transactionHash: string) {
  const baseUrl =
    network === 'ethereum'
      ? 'https://etherscan.io'
      : network === 'polygon'
        ? 'https://polygonscan.com'
        : 'https://basescan.org'

  return `${baseUrl}/tx/${transactionHash}`
}
