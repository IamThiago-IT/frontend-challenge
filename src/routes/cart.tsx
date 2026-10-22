import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { isApiError } from '@/lib/api/errors'
import { queryKeys } from '@/lib/query/keys'
import { applyCoupon, removeCartItem, removeCoupon, updateCartItem } from '@/features/cart/api'
import { cartQueryOptions } from '@/features/cart/queries'
import type { Cart } from '@/features/cart/contracts'
import { sessionQueryOptions } from '@/features/auth/queries'
import { catalogSearchDefaults } from '@/features/catalog/search-params'

export const Route = createFileRoute('/cart')({
  component: CartPage,
})

function CartPage() {
  const queryClient = useQueryClient()
  const { data: session } = useQuery(sessionQueryOptions)
  const userId = session?.user.id ?? null
  const cartKey = userId ? queryKeys.private.cart(userId) : queryKeys.guest.cart
  const cartQuery = useQuery(cartQueryOptions(userId))
  const [couponCode, setCouponCode] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  const setCart = (cart: Cart) => {
    queryClient.setQueryData<Cart>(cartKey, cart)
  }
  const removeMutation = useMutation({
    mutationFn: removeCartItem,
    onSuccess: setCart,
    onError: (error) => {
      setFeedback(isApiError(error) ? error.message : 'Não foi possível remover o item.')
    },
  })
  const updateMutation = useMutation({
    mutationFn: ({ nftId, quantity }: { nftId: string; quantity: number }) =>
      updateCartItem(nftId, quantity),
    onSuccess: (cart) => {
      setCart(cart)
      setFeedback('Quantidade atualizada.')
    },
    onError: (error) => {
      setFeedback(isApiError(error) ? error.message : 'Não foi possível atualizar a quantidade.')
      void queryClient.invalidateQueries({ queryKey: cartKey })
    },
  })
  const couponMutation = useMutation({
    mutationFn: applyCoupon,
    onSuccess: (cart) => {
      setCart(cart)
      setCouponCode('')
      setFeedback('Cupom aplicado.')
    },
    onError: (error) => {
      setFeedback(isApiError(error) ? error.message : 'Não foi possível aplicar o cupom.')
    },
  })
  const removeCouponMutation = useMutation({
    mutationFn: removeCoupon,
    onSuccess: (cart) => {
      setCart(cart)
      setFeedback('Cupom removido.')
    },
    onError: (error) => {
      setFeedback(isApiError(error) ? error.message : 'Não foi possível remover o cupom.')
    },
  })

  const onSubmitCoupon = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!couponCode.trim()) {
      return
    }

    couponMutation.mutate(couponCode)
  }

  const cart = cartQuery.data

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Sua seleção</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Carrinho</h1>
        </div>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {cartQuery.isFetching && !cartQuery.isPending ? 'Sincronizando carrinho...' : null}
        </p>
      </div>

      {cartQuery.isPending ? (
        <div className="h-64 animate-pulse rounded-xl border bg-muted" />
      ) : cartQuery.isError ? (
        <div className="rounded-xl border border-destructive/30 p-6">
          <p className="text-sm text-destructive">
            {isApiError(cartQuery.error)
              ? cartQuery.error.message
              : 'Não foi possível carregar o carrinho.'}
          </p>
        </div>
      ) : !cart || cart.items.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed p-10">
          <h2 className="text-xl font-semibold">Seu carrinho está vazio</h2>
          <p className="text-sm text-muted-foreground">
            Explore o catálogo e adicione um NFT para começar.
          </p>
          <Button asChild>
            <Link to="/" search={catalogSearchDefaults}>
              Explorar NFTs
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-4">
            {cart.items.map((item) => (
              <article key={item.nft.id} className="flex gap-4 rounded-xl border bg-card p-4">
                <img
                  src={item.nft.imageUrl}
                  alt={item.nft.name}
                  className="size-24 rounded-lg border object-cover"
                />
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                  <div>
                    <Link
                      to="/nft/$nftId"
                      params={{ nftId: item.nft.id }}
                      className="font-semibold hover:underline"
                    >
                      {item.nft.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {item.nft.collection.name} · {item.quantity} unidade(s)
                    </p>
                  </div>
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex w-fit items-center rounded-md border">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Diminuir quantidade de ${item.nft.name}`}
                          disabled={
                            updateMutation.isPending ||
                            removeMutation.isPending ||
                            item.quantity <= 1
                          }
                          onClick={() =>
                            updateMutation.mutate({
                              nftId: item.nft.id,
                              quantity: item.quantity - 1,
                            })
                          }
                        >
                          -
                        </Button>
                        <span
                          className="min-w-8 text-center text-sm tabular-nums"
                          aria-live="polite"
                          data-testid={`cart-quantity-${item.nft.id}`}
                        >
                          {item.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Aumentar quantidade de ${item.nft.name}`}
                          disabled={
                            updateMutation.isPending ||
                            removeMutation.isPending ||
                            item.nft.availability !== 'available' ||
                            item.quantity >= Math.min(item.nft.availableQuantity, 100)
                          }
                          onClick={() =>
                            updateMutation.mutate({
                              nftId: item.nft.id,
                              quantity: item.quantity + 1,
                            })
                          }
                        >
                          +
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.nft.availability === 'available'
                          ? `Máximo: ${Math.min(item.nft.availableQuantity, 100)}`
                          : 'Indisponível'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{item.lineTotalEth} ETH</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={removeMutation.isPending || updateMutation.isPending}
                        onClick={() => removeMutation.mutate(item.nft.id)}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="flex h-fit flex-col gap-4 rounded-xl border bg-card p-5">
            <h2 className="text-lg font-semibold">Resumo</h2>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-mono">{cart.totals.subtotalEth} ETH</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Desconto</dt>
                <dd className="font-mono">-{cart.totals.discountEth} ETH</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Taxa de rede</dt>
                <dd className="font-mono">{cart.totals.networkFeeEth} ETH</dd>
              </div>
              <div className="mt-2 flex justify-between border-t pt-3 text-base font-semibold">
                <dt>Total</dt>
                <dd className="font-mono">{cart.totals.totalEth} ETH</dd>
              </div>
            </dl>

            {cart.coupon ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
                <span>{cart.coupon.code}</span>
                <Button
                  variant="ghost"
                  size="xs"
                  disabled={removeCouponMutation.isPending}
                  onClick={() => removeCouponMutation.mutate()}
                >
                  Remover
                </Button>
              </div>
            ) : (
              <form className="flex gap-2" onSubmit={onSubmitCoupon}>
                <input
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value)}
                  placeholder="Cupom"
                  className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm uppercase outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  aria-label="Código do cupom"
                />
                <Button type="submit" variant="outline" disabled={couponMutation.isPending}>
                  Aplicar
                </Button>
              </form>
            )}

            {session ? (
              <Button asChild>
                <Link to="/checkout">Ir para o checkout</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to="/login" search={{ redirect: '/checkout' }}>
                  Entrar para finalizar
                </Link>
              </Button>
            )}
            <Button asChild variant="ghost">
              <Link to="/" search={catalogSearchDefaults}>
                Continuar explorando
              </Link>
            </Button>
            {feedback ? (
              <p className="text-xs text-muted-foreground" aria-live="polite">
                {feedback}
              </p>
            ) : null}
          </aside>
        </div>
      )}
    </section>
  )
}
