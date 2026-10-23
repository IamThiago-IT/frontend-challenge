import { apiRequest } from '@/lib/api/request'
import {
  nftCategoriesResponseSchema,
  nftDetailSchema,
  nftListResponseSchema,
  type NftListParams,
} from '@/features/catalog/contracts'
import { normalizeNftListParams } from '@/features/catalog/params'

function buildListSearch(params: NftListParams) {
  const search = new URLSearchParams()
  const normalized = normalizeNftListParams(params)

  if (normalized.q) {
    search.set('q', normalized.q)
  }

  normalized.categories?.forEach((category) => search.append('category', category))
  normalized.network?.forEach((network) => search.append('network', network))

  if (normalized.minPrice) {
    search.set('minPrice', normalized.minPrice)
  }

  if (normalized.maxPrice) {
    search.set('maxPrice', normalized.maxPrice)
  }

  if (normalized.availability) {
    search.set('availability', normalized.availability)
  }

  if (normalized.featured !== undefined) {
    search.set('featured', String(normalized.featured))
  }

  search.set('sort', normalized.sort)
  search.set('page', String(normalized.page))
  search.set('pageSize', String(normalized.pageSize))

  return search.toString()
}

export function listNfts(params: NftListParams, signal?: AbortSignal) {
  const search = buildListSearch(params)

  return apiRequest(nftListResponseSchema, {
    method: 'GET',
    url: `/nfts?${search}`,
    signal,
  })
}

export function getNft(nftId: string, signal?: AbortSignal) {
  return apiRequest(nftDetailSchema, {
    method: 'GET',
    url: `/nfts/${nftId}`,
    signal,
  })
}

export function getNftCategories(signal?: AbortSignal) {
  return apiRequest(nftCategoriesResponseSchema, {
    method: 'GET',
    url: '/nfts/categories',
    signal,
  })
}
