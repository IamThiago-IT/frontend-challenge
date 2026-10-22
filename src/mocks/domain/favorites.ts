import type { FavoritesResponse } from '@/features/favorites/contracts'
import { getMockDb, mutateMockDb } from '@/mocks/db'
import { MockRequestError } from '@/mocks/http'
import { nowIso } from '@/mocks/domain/time'
import { toNftSummary } from '@/mocks/domain/serializers'

export function getFavorites(userId: string): FavoritesResponse {
  const db = getMockDb()
  const ids = db.favorites[userId] ?? []
  const items = ids.flatMap((nftId) => {
    const nft = db.nfts.find((candidate) => candidate.id === nftId)

    return nft ? [toNftSummary(nft)] : []
  })

  return {
    items,
    ids,
    total: items.length,
  }
}

export function addFavorite(userId: string, nftId: string) {
  return mutateMockDb((db) => {
    const nft = db.nfts.find((candidate) => candidate.id === nftId)

    if (!nft) {
      throw new MockRequestError(404, 'NOT_FOUND', 'NFT não encontrado.')
    }

    const currentIds = db.favorites[userId] ?? []
    const alreadyFavorited = currentIds.includes(nftId)

    if (!alreadyFavorited) {
      db.favorites[userId] = [nftId, ...currentIds]
    }

    return {
      favorited: true,
      favoritedAt: alreadyFavorited ? null : nowIso(),
    }
  })
}

export function removeFavorite(userId: string, nftId: string) {
  return mutateMockDb((db) => {
    db.favorites[userId] = (db.favorites[userId] ?? []).filter((favoriteId) => favoriteId !== nftId)

    return {
      favorited: false,
      favoritedAt: null,
    }
  })
}
