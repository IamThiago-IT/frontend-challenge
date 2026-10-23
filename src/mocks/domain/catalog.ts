import type {
  NftCategory,
  NftDetail,
  NftListParams,
  NftListResponse,
} from '@/features/catalog/contracts'
import { compareEth } from '@/lib/money/eth'
import { getMockDb } from '@/mocks/db'
import type { MockDb } from '@/mocks/db/schema'
import { MockRequestError } from '@/mocks/http'
import { toNftSummary } from '@/mocks/domain/serializers'

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function sortNfts(items: NftDetail[], sort: NftListParams['sort']) {
  return [...items].sort((left, right) => {
    if (sort === 'price-asc') {
      return compareEth(left.priceEth, right.priceEth) || left.id.localeCompare(right.id)
    }

    if (sort === 'price-desc') {
      return compareEth(right.priceEth, left.priceEth) || left.id.localeCompare(right.id)
    }

    if (sort === 'popular') {
      return right.likes - left.likes || left.id.localeCompare(right.id)
    }

    return (
      Date.parse(right.createdAt) - Date.parse(left.createdAt) || left.id.localeCompare(right.id)
    )
  })
}

export function listNfts(params: NftListParams, db: MockDb = getMockDb()): NftListResponse {
  if (db.scenario.mode === 'empty') {
    return {
      items: [],
      page: 1,
      pageSize: params.pageSize,
      total: 0,
      totalPages: 0,
    }
  }

  const query = params.q ? normalizeSearch(params.q) : ''
  const filtered = db.nfts.filter((nft) => {
    if (query) {
      const searchable = normalizeSearch(
        `${nft.name} ${nft.collection.name} ${nft.creator.name} ${nft.description}`,
      )

      if (!searchable.includes(query)) {
        return false
      }
    }

    if (params.categories?.length && !params.categories.includes(nft.category)) {
      return false
    }

    if (params.network?.length && !params.network.includes(nft.network)) {
      return false
    }

    if (params.availability && nft.availability !== params.availability) {
      return false
    }

    if (params.featured !== undefined && nft.featured !== params.featured) {
      return false
    }

    if (params.minPrice && compareEth(nft.priceEth, params.minPrice) < 0) {
      return false
    }

    if (params.maxPrice && compareEth(nft.priceEth, params.maxPrice) > 0) {
      return false
    }

    return true
  })
  const sorted = sortNfts(filtered, params.sort)
  const total = sorted.length
  const totalPages = total === 0 ? 0 : Math.ceil(total / params.pageSize)
  const start = (params.page - 1) * params.pageSize

  return {
    items: sorted.slice(start, start + params.pageSize).map(toNftSummary),
    page: params.page,
    pageSize: params.pageSize,
    total,
    totalPages,
  }
}

export function getNftById(nftId: string, db: MockDb = getMockDb()): NftDetail {
  const nft = db.nfts.find((item) => item.id === nftId)

  if (!nft) {
    throw new MockRequestError(404, 'NOT_FOUND', 'NFT não encontrado.')
  }

  return nft
}

export function getNftCategories(db: MockDb = getMockDb()): NftCategory[] {
  return db.categories
}
