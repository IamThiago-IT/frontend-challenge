import type { NftListParams } from '@/features/catalog/contracts'

export function normalizeNftListParams(params: Partial<NftListParams> = {}): NftListParams {
  const categories = [...new Set(params.categories ?? [])].sort()
  const network = [...new Set(params.network ?? [])].sort()

  return {
    q: params.q?.trim() || undefined,
    categories: categories.length > 0 ? categories : undefined,
    network: network.length > 0 ? network : undefined,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    availability: params.availability,
    featured: params.featured,
    sort: params.sort ?? 'recent',
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 12,
  }
}
