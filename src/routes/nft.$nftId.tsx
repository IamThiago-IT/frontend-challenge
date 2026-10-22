import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { isApiError } from '@/lib/api/errors'
import { queryKeys } from '@/lib/query/keys'
import { addCartItem } from '@/features/cart/api'
import { sessionQueryOptions } from '@/features/auth/queries'
import { nftDetailQueryOptions } from '@/features/catalog/queries'
import type { NftSummary } from '@/features/catalog/contracts'
import type { Cart } from '@/features/cart/contracts'
import { addFavorite, removeFavorite } from '@/features/favorites/api'
import { favoritesQueryOptions } from '@/features/favorites/queries'
import type { FavoritesResponse } from '@/features/favorites/contracts'

export const Route = createFileRoute('/nft/$nftId')({
  loader: async ({ context, params }) => {
    try {
      return await context.queryClient.ensureQueryData(nftDetailQueryOptions(params.nftId))
    } catch (error) {
      if (isApiError(error) && error.status === 404) {
        throw notFound()
      }

      throw error
    }
  },
  component: NftDetailPage,
  pendingComponent: NftDetailPending,
})

function NftDetailPage() {
  const loadedNft = Route.useLoaderData()
  const { nftId } = Route.useParams()
  const { data } = useQuery(nftDetailQueryOptions(nftId))
  const nft = data ?? loadedNft
  const queryClient = useQueryClient()
  const { data: session } = useQuery(sessionQueryOptions)
  const [feedback, setFeedback] = useState<string | null>(null)
  const userId = session?.user.id ?? 'guest'
  const favoritesKey = queryKeys.private.favorites(userId)
  const { data: favorites } = useQuery({
    ...favoritesQueryOptions(userId),
    enabled: Boolean(session),
  })
  const favorited = favorites?.ids.includes(nft.id) ?? false
  const favoriteMutation = useMutation({
    mutationFn: () => (favorited ? removeFavorite(nft.id) : addFavorite(nft.id)),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: favoritesKey })

      const previous = queryClient.getQueryData<FavoritesResponse>(favoritesKey)
      const summary: NftSummary = {
        id: nft.id,
        name: nft.name,
        imageUrl: nft.imageUrl,
        category: nft.category,
        collection: nft.collection,
        creator: nft.creator,
        priceEth: nft.priceEth,
        currency: nft.currency,
        availability: nft.availability,
        availableQuantity: nft.availableQuantity,
        editionSize: nft.editionSize,
        editionSold: nft.editionSold,
        likes: nft.likes,
        featured: nft.featured,
        version: nft.version,
        createdAt: nft.createdAt,
        updatedAt: nft.updatedAt,
      }

      queryClient.setQueryData<FavoritesResponse>(favoritesKey, (current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          ids: favorited
            ? current.ids.filter((favoriteId) => favoriteId !== nft.id)
            : [nft.id, ...current.ids],
          items: favorited
            ? current.items.filter((item) => item.id !== nft.id)
            : [summary, ...current.items],
          total: favorited ? Math.max(0, current.total - 1) : current.total + 1,
        }
      })

      return { previous }
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(favoritesKey, context.previous)
      }

      setFeedback(isApiError(error) ? error.message : 'Não foi possível atualizar seus favoritos.')
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: favoritesKey })
    },
  })
  const addMutation = useMutation({
    mutationFn: () => addCartItem(nft.id, 1),
    onSuccess: (cart) => {
      const cartKey = session ? queryKeys.private.cart(session.user.id) : queryKeys.guest.cart

      queryClient.setQueryData<Cart>(cartKey, cart)
      setFeedback('NFT adicionado ao carrinho.')
    },
    onError: (error) => {
      setFeedback(isApiError(error) ? error.message : 'Não foi possível adicionar ao carrinho.')
    },
  })

  return (
    <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-16">
      <div className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-2xl border bg-muted">
          <img
            src={nft.imageUrl}
            alt={nft.name}
            className="aspect-square w-full object-cover"
            fetchPriority="high"
            decoding="async"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {nft.gallery.slice(0, 3).map((imageUrl, index) => (
            <img
              key={`${imageUrl}-${index}`}
              src={imageUrl}
              alt={`${nft.name} — imagem ${index + 1}`}
              className="aspect-square rounded-lg border object-cover"
              loading="lazy"
              decoding="async"
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm text-muted-foreground">{nft.collection.name}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{nft.name}</h1>
        </div>

        <div className="flex items-center gap-3">
          <img
            src={nft.creator.avatarUrl}
            alt=""
            className="size-10 rounded-full border object-cover"
            loading="lazy"
            decoding="async"
          />
          <div>
            <p className="text-xs text-muted-foreground">Criado por</p>
            <p className="text-sm font-medium">
              {nft.creator.name}
              {nft.creator.verified ? (
                <span className="ml-2 text-xs text-muted-foreground">Verificado</span>
              ) : null}
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs text-muted-foreground">Preço atual</p>
          <p className="mt-1 font-mono text-3xl font-semibold">{nft.priceEth} ETH</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Disponíveis</dt>
              <dd className="font-medium">
                {nft.availableQuantity} de {nft.editionSize}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Curtidas</dt>
              <dd className="font-medium">{nft.likes}</dd>
            </div>
          </dl>
          <div className="mt-5 flex flex-col gap-2">
            <Button
              disabled={nft.availability !== 'available' || addMutation.isPending}
              onClick={() => addMutation.mutate()}
            >
              {addMutation.isPending
                ? 'Adicionando...'
                : nft.availability === 'available'
                  ? 'Adicionar ao carrinho'
                  : 'Indisponível'}
            </Button>
            {session ? (
              <Button
                type="button"
                variant="outline"
                data-testid="favorite-toggle"
                aria-pressed={favorited}
                disabled={favoriteMutation.isPending}
                onClick={() => favoriteMutation.mutate()}
              >
                <Heart aria-hidden="true" className={favorited ? 'fill-current' : undefined} />
                {favorited ? 'Favoritado' : 'Favoritar'}
              </Button>
            ) : (
              <Button asChild variant="outline" data-testid="favorite-toggle">
                <Link to="/login" search={{ redirect: `/nft/${nft.id}` }}>
                  <Heart aria-hidden="true" />
                  Entrar para favoritar
                </Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link to="/cart">Ver carrinho</Link>
            </Button>
          </div>
          {feedback ? (
            <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
              {feedback}
            </p>
          ) : null}
        </div>

        <div>
          <h2 className="text-lg font-semibold">Sobre esta obra</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{nft.description}</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Atributos</h2>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            {nft.attributes.map((attribute) => (
              <div
                key={`${attribute.traitType}-${attribute.value}`}
                className="rounded-lg border p-3"
              >
                <dt className="text-xs text-muted-foreground">{attribute.traitType}</dt>
                <dd className="mt-1 text-sm font-medium">{attribute.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

function NftDetailPending() {
  return (
    <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-16">
      <div className="aspect-square animate-pulse rounded-2xl border bg-muted" />
      <div className="flex flex-col gap-4">
        <div className="h-10 w-2/3 animate-pulse rounded-md bg-muted" />
        <div className="h-40 animate-pulse rounded-xl border bg-muted" />
      </div>
    </section>
  )
}
