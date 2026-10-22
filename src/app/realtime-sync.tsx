import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'

import { queryKeys } from '@/lib/query/keys'
import { clearAuthenticatedSession } from '@/features/auth/session'
import { sessionQueryOptions } from '@/features/auth/queries'
import { subscribeToSessionExpired } from '@/lib/api/errors'
import { getSessionToken } from '@/lib/session/storage'
import { acceptRealtimeEvent, registerOrderVersion } from '@/lib/socket/version-registry'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/lib/socket/events'
import type { NftDetail, NftListResponse } from '@/features/catalog/contracts'
import type { FavoritesResponse } from '@/features/favorites/contracts'
import type { Order } from '@/features/orders/contracts'

function updateNftSummaryInList(previous: NftListResponse | undefined, event: NftUpdatedEvent) {
  if (!previous) {
    return previous
  }

  const nft = event.payload.nft

  return {
    ...previous,
    items: previous.items.map((item) =>
      item.id === nft.id && nft.version > item.version
        ? {
            ...item,
            name: nft.name,
            imageUrl: nft.imageUrl,
            priceEth: nft.priceEth,
            availability: nft.availability,
            availableQuantity: nft.availableQuantity,
            editionSize: nft.editionSize,
            editionSold: nft.editionSold,
            likes: nft.likes,
            version: nft.version,
            updatedAt: nft.updatedAt,
          }
        : item,
    ),
  }
}

export function RealtimeSync() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { data: session } = useQuery(sessionQueryOptions)
  const userId = session?.user.id ?? null

  useEffect(() => {
    return subscribeToSessionExpired(() => {
      clearAuthenticatedSession(queryClient)

      if (router.state.location.pathname !== '/login') {
        void router.navigate({
          to: '/login',
          search: {
            redirect: router.state.location.href,
          },
          replace: true,
        })
      }
    })
  }, [queryClient, router])

  useEffect(() => {
    let disposed = false
    let teardown = () => undefined
    const timeoutId = window.setTimeout(() => {
      void import('@/lib/socket/client').then(({ connectSocket, getSocket }) => {
        if (disposed) {
          return
        }

        const socket = getSocket()

        const reconcileActiveQueries = () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.guest.cart })

          if (userId) {
            void queryClient.invalidateQueries({
              queryKey: queryKeys.private.cart(userId),
            })
            void queryClient.invalidateQueries({
              queryKey: queryKeys.private.orders(userId),
            })
            void queryClient.invalidateQueries({
              queryKey: queryKeys.private.quotes(userId),
            })
          }
        }
        const handleConnect = () => {
          socket.emit('session:hello', {
            token: getSessionToken(),
          })
          reconcileActiveQueries()
        }
        const handleNftUpdated = (event: NftUpdatedEvent) => {
          if (!acceptRealtimeEvent(event)) {
            return
          }

          const nft = event.payload.nft

          queryClient.setQueryData<NftDetail>(queryKeys.nfts.detail(nft.id), (previous) =>
            previous && previous.version > nft.version ? previous : nft,
          )
          queryClient.setQueriesData<NftListResponse>(
            { queryKey: queryKeys.nfts.lists() },
            (previous) => updateNftSummaryInList(previous, event),
          )
          void queryClient.invalidateQueries({ queryKey: queryKeys.guest.cart })

          if (userId) {
            void queryClient.invalidateQueries({
              queryKey: queryKeys.private.cart(userId),
            })
            void queryClient.invalidateQueries({
              queryKey: queryKeys.private.quotes(userId),
            })
          }

          queryClient.setQueriesData<FavoritesResponse>(
            {
              predicate: (query) =>
                query.queryKey[0] === 'private' && query.queryKey[2] === 'favorites',
            },
            (previous) => {
              if (!previous) {
                return previous
              }

              return {
                ...previous,
                items: previous.items.map((item) =>
                  item.id === nft.id && nft.version > item.version
                    ? {
                        ...item,
                        name: nft.name,
                        imageUrl: nft.imageUrl,
                        priceEth: nft.priceEth,
                        availability: nft.availability,
                        availableQuantity: nft.availableQuantity,
                        editionSize: nft.editionSize,
                        editionSold: nft.editionSold,
                        likes: nft.likes,
                        version: nft.version,
                        updatedAt: nft.updatedAt,
                      }
                    : item,
                ),
              }
            },
          )
        }
        const handleOrderUpdated = (event: OrderUpdatedEvent) => {
          if (!acceptRealtimeEvent(event)) {
            return
          }

          if (!userId) {
            return
          }

          const order = event.payload.order
          registerOrderVersion(order)

          queryClient.setQueryData<Order>(queryKeys.private.order(userId, order.id), (previous) =>
            previous && previous.version > order.version ? previous : order,
          )
          void queryClient.invalidateQueries({
            queryKey: queryKeys.private.cart(userId),
          })
        }

        socket.on('connect', handleConnect)
        socket.on('nft.updated', handleNftUpdated)
        socket.on('order.updated', handleOrderUpdated)
        connectSocket()

        if (socket.connected) {
          handleConnect()
        }

        teardown = () => {
          socket.off('connect', handleConnect)
          socket.off('nft.updated', handleNftUpdated)
          socket.off('order.updated', handleOrderUpdated)
        }
      })
    }, 1000)

    return () => {
      disposed = true
      window.clearTimeout(timeoutId)
      teardown()
    }
  }, [queryClient, userId])

  return null
}
