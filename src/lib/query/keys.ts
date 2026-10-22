export type QueryParams = Record<string, unknown>

export const queryKeys = {
  auth: {
    session: ['auth', 'session'] as const,
  },
  nfts: {
    all: ['nfts'] as const,
    lists: () => ['nfts', 'list'] as const,
    list: (params: QueryParams) => ['nfts', 'list', params] as const,
    detail: (nftId: string) => ['nfts', 'detail', nftId] as const,
    categories: ['nfts', 'categories'] as const,
  },
  private: {
    all: ['private'] as const,
    root: (userId: string) => ['private', userId] as const,
    favorites: (userId: string) => ['private', userId, 'favorites'] as const,
    cart: (userId: string) => ['private', userId, 'cart'] as const,
    quotes: (userId: string) => ['private', userId, 'quote'] as const,
    quote: (userId: string, params: QueryParams) => ['private', userId, 'quote', params] as const,
    orders: (userId: string) => ['private', userId, 'orders'] as const,
    order: (userId: string, orderId: string) => ['private', userId, 'orders', orderId] as const,
    profile: (userId: string) => ['private', userId, 'profile'] as const,
    wallets: (userId: string) => ['private', userId, 'wallets'] as const,
  },
  guest: {
    cart: ['guest', 'cart'] as const,
  },
}

export function isPrivateQueryKey(queryKey: readonly unknown[]) {
  return queryKey[0] === 'private'
}
