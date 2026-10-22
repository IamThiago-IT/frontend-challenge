import { http } from 'msw'

import { addFavorite, getFavorites, removeFavorite } from '@/mocks/domain/favorites'
import { jsonData, mockApiPath, mockHandler, requireAuthenticatedActor } from '@/mocks/http'

export const favoritesHandlers = [
  http.get(
    mockApiPath('/favorites'),
    mockHandler(({ request }) => {
      const actor = requireAuthenticatedActor(request)

      return jsonData(getFavorites(actor.user.id))
    }),
  ),
  http.put(
    mockApiPath('/favorites/:nftId'),
    mockHandler(({ request, params }) => {
      const actor = requireAuthenticatedActor(request)

      return jsonData(addFavorite(actor.user.id, String(params.nftId)))
    }),
  ),
  http.delete(
    mockApiPath('/favorites/:nftId'),
    mockHandler(({ request, params }) => {
      const actor = requireAuthenticatedActor(request)

      return jsonData(removeFavorite(actor.user.id, String(params.nftId)))
    }),
  ),
]
