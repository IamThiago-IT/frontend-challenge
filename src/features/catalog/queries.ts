import { queryOptions } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query/keys'
import { registerNftVersions, registerResourceVersion } from '@/lib/socket/version-registry'
import { getNft, getNftCategories, listNfts } from '@/features/catalog/api'
import type { NftDetail, NftListParams, NftListResponse } from '@/features/catalog/contracts'
import { normalizeNftListParams } from '@/features/catalog/params'

function reconcileNftPage(previous: NftListResponse, incoming: NftListResponse) {
  const previousById = new Map(previous.items.map((item) => [item.id, item]))

  return {
    ...incoming,
    items: incoming.items.map((item) => {
      const previousItem = previousById.get(item.id)

      return previousItem && previousItem.version > item.version ? previousItem : item
    }),
  }
}

export function nftListQueryOptions(params: NftListParams) {
  const normalizedParams = normalizeNftListParams(params)
  const queryKey = queryKeys.nfts.list(normalizedParams)

  return queryOptions({
    queryKey,
    queryFn: async ({ client, signal }) => {
      const response = await listNfts(normalizedParams, signal)
      registerNftVersions(response.items)

      const previous = client.getQueryData<NftListResponse>(queryKey)

      return previous ? reconcileNftPage(previous, response) : response
    },
    staleTime: 30_000,
    gcTime: 10 * 60_000,
  })
}

export function nftDetailQueryOptions(nftId: string) {
  const queryKey = queryKeys.nfts.detail(nftId)

  return queryOptions({
    queryKey,
    queryFn: async ({ client, signal }) => {
      const nft = await getNft(nftId, signal)
      registerResourceVersion('nft', nft.id, nft.version)

      const previous = client.getQueryData<NftDetail>(queryKey)

      return previous && previous.version > nft.version ? previous : nft
    },
    staleTime: 30_000,
    gcTime: 10 * 60_000,
  })
}

export const nftCategoriesQueryOptions = queryOptions({
  queryKey: queryKeys.nfts.categories,
  queryFn: ({ signal }) => getNftCategories(signal),
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
})
