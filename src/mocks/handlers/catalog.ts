import { http } from 'msw'

import { nftListQuerySchema, type NftListParams } from '@/features/catalog/contracts'
import { getNftById, getNftCategories, listNfts } from '@/mocks/domain/catalog'
import { jsonData, mockApiPath, mockHandler, parseInput } from '@/mocks/http'

export const catalogHandlers = [
  http.get(
    mockApiPath('/nfts/categories'),
    mockHandler(() => jsonData(getNftCategories())),
  ),
  http.get(
    mockApiPath('/nfts'),
    mockHandler(({ request }) => {
      const url = new URL(request.url)
      const data = parseInput(
        {
          q: url.searchParams.get('q') || undefined,
          categories: url.searchParams.getAll('category'),
          minPrice: url.searchParams.get('minPrice') || undefined,
          maxPrice: url.searchParams.get('maxPrice') || undefined,
          availability: url.searchParams.get('availability') || undefined,
          featured: url.searchParams.get('featured') ?? undefined,
          sort: url.searchParams.get('sort') || undefined,
          page: url.searchParams.get('page') ?? undefined,
          pageSize: url.searchParams.get('pageSize') ?? undefined,
        },
        nftListQuerySchema,
      )
      const params: NftListParams = {
        ...data,
        categories: data.categories?.length ? data.categories : undefined,
      }

      return jsonData(listNfts(params))
    }),
  ),
  http.get(
    mockApiPath('/nfts/:nftId'),
    mockHandler(({ params }) => {
      const nft = getNftById(String(params.nftId))

      return jsonData(nft)
    }),
  ),
]
