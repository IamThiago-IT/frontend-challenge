import { apiRequest } from '@/lib/api/request'
import {
  favoriteMutationResponseSchema,
  favoritesResponseSchema,
} from '@/features/favorites/contracts'

export function getFavorites(signal?: AbortSignal) {
  return apiRequest(favoritesResponseSchema, {
    method: 'GET',
    url: '/favorites',
    signal,
  })
}

export function addFavorite(nftId: string) {
  return apiRequest(favoriteMutationResponseSchema, {
    method: 'PUT',
    url: `/favorites/${nftId}`,
  })
}

export function removeFavorite(nftId: string) {
  return apiRequest(favoriteMutationResponseSchema, {
    method: 'DELETE',
    url: `/favorites/${nftId}`,
  })
}
