import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { isApiError } from '@/lib/api/errors'
import { clearIdempotencyKey, getOrCreateIdempotencyKey } from '@/lib/api/idempotency'
import { queryKeys } from '@/lib/query/keys'
import { cartQueryOptions } from '@/features/cart/queries'
import { catalogSearchDefaults } from '@/features/catalog/search-params'
import { orderCollectorSchema, type QuoteRequest } from '@/features/checkout/contracts'
import { quoteQueryOptions } from '@/features/checkout/queries'
import {
  clearPendingOrderAttempt,
  getCheckoutDraft,
  getPendingOrderAttempt,
  orderIdempotencyScope,
  saveCheckoutDraft,
  savePendingOrderAttempt,
  type CheckoutStep,
  type PendingOrderAttempt,
} from '@/features/checkout/storage'
import { createOrder } from '@/features/orders/api'
import type { Order } from '@/features/orders/contracts'
import { connectWallet } from '@/features/wallets/api'
import type { Wallet } from '@/features/wallets/contracts'
import { walletsQueryOptions } from '@/features/wallets/queries'

export const Route = createFileRoute('/_authenticated/checkout')({
  component: CheckoutPage,
})

const networkOptions = ['ethereum', 'polygon', 'base'] as const

const networkLabels: Record<QuoteRequest['network'], string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  base: 'Base',
}

const quoteErrorCodes = new Set([
  'QUOTE_EXPIRED',
  'QUOTE_STALE',
  'INSUFFICIENT_AVAILABILITY',
  'INVALID_COUPON',
  'EXPIRED_COUPON',
  'CART_EMPTY',
  'NOT_FOUND',
  'IDEMPOTENCY_CONFLICT',
])

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function shouldKeepPendingAttempt(error: unknown) {
  if (!isApiError(error)) {
    return true
  }

  return (
    error.code === 'TIMEOUT' ||
    error.code === 'NETWORK_ERROR' ||
    error.code === 'TRANSIENT_ERROR' ||
    error.status === 0 ||
    error.status >= 500
  )
}

function CheckoutPage() {
  const { session } = Route.useRouteContext()
  const userId = session.user.id
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const detailsHeadingRef = useRef<HTMLHeadingElement>(null)
  const reviewHeadingRef = useRef<HTMLHeadingElement>(null)
  const [draft] = useState(() => getCheckoutDraft(userId))
  const cartQuery = useQuery(cartQueryOptions(userId))
  const walletsQuery = useQuery(walletsQueryOptions(userId))
  const [step, setStep] = useState<CheckoutStep>('details')
  const [collectorName, setCollectorName] = useState(draft?.collectorName ?? session.user.name)
  const [collectorEmail, setCollectorEmail] = useState(draft?.collectorEmail ?? session.user.email)
  const [selectedNetwork, setSelectedNetwork] = useState<QuoteRequest['network'] | null>(
    draft?.network ?? null,
  )
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(draft?.walletId ?? null)
  const [connectedWalletId, setConnectedWalletId] = useState<string | null>(null)
  const [acknowledgedQuoteId, setAcknowledgedQuoteId] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'name' | 'email', string>>>({})
  const [feedback, setFeedback] = useState<string | null>(null)
  const [pendingAttempt, setPendingAttempt] = useState<PendingOrderAttempt | null>(() =>
    getPendingOrderAttempt(userId),
  )

  const wallets = walletsQuery.data?.items ?? []
  const network =
    selectedNetwork ??
    wallets.find((wallet) => wallet.isPrimary)?.network ??
    wallets[0]?.network ??
    'ethereum'
  const networkWallets = wallets.filter((wallet) => wallet.network === network)
  const effectiveWallet =
    networkWallets.find((wallet) => wallet.id === selectedWalletId) ??
    networkWallets.find((wallet) => wallet.isPrimary) ??
    networkWallets[0] ??
    null
  const isConnected = Boolean(effectiveWallet && connectedWalletId === effectiveWallet.id)
  const cart = cartQuery.data
  const quoteInput =
    step === 'review' && effectiveWallet && isConnected
      ? {
          walletId: effectiveWallet.id,
          network,
        }
      : null
  const quoteQuery = useQuery(quoteQueryOptions(userId, quoteInput))
  const quote = quoteQuery.data
  const quoteIsCurrent = Boolean(quote && acknowledgedQuoteId === quote.id)
  const quoteChanged = Boolean(quote && acknowledgedQuoteId && quote.id !== acknowledgedQuoteId)
  const quoteErrorMessage = isApiError(quoteQuery.error)
    ? quoteQuery.error.message
    : 'Não foi possível calcular o pedido.'

  useEffect(() => {
    if (walletsQuery.isSuccess) {
      saveCheckoutDraft(userId, {
        collectorName,
        collectorEmail,
        network,
        walletId: effectiveWallet?.id ?? null,
        step,
      })
    }
  }, [
    collectorEmail,
    collectorName,
    effectiveWallet?.id,
    network,
    step,
    userId,
    walletsQuery.isSuccess,
  ])

  useEffect(() => {
    if (step === 'review') {
      reviewHeadingRef.current?.focus()
    } else {
      detailsHeadingRef.current?.focus()
    }
  }, [step])

  const connectMutation = useMutation({
    mutationFn: (wallet: Wallet) => connectWallet(wallet.id, { network: wallet.network }),
    onSuccess: (connection) => {
      setConnectedWalletId(connection.walletId)
      setFeedback(null)
    },
    onError: (error) => {
      setConnectedWalletId(null)
      setFeedback(isApiError(error) ? error.message : 'Não foi possível conectar a carteira.')
    },
  })

  const clearAttempt = (attempt: PendingOrderAttempt | null) => {
    if (attempt) {
      clearIdempotencyKey(orderIdempotencyScope(userId, attempt.quoteId))
    }

    clearPendingOrderAttempt(userId)
    setPendingAttempt(null)
  }

  const finishOrder = (order: Order, attempt: PendingOrderAttempt | null) => {
    clearAttempt(attempt)
    queryClient.setQueryData(queryKeys.private.order(userId, order.id), order)
    void queryClient.invalidateQueries({
      queryKey: queryKeys.private.cart(userId),
    })
    setFeedback(null)
    void navigate({
      to: '/orders/$orderId',
      params: { orderId: order.id },
    })
  }

  const handleOrderError = (error: unknown, attempt: PendingOrderAttempt | null) => {
    if (shouldKeepPendingAttempt(error)) {
      setFeedback(
        isApiError(error)
          ? `${error.message} Verifique o pedido antes de tentar novamente.`
          : 'Não foi possível confirmar se o pedido foi criado. Verifique antes de tentar novamente.',
      )
      return
    }

    clearAttempt(attempt)
    setAcknowledgedQuoteId(null)

    if (isApiError(error) && quoteErrorCodes.has(error.code)) {
      setStep('review')
      void queryClient.invalidateQueries({
        queryKey: queryKeys.private.cart(userId),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.private.quotes(userId),
      })
    }

    setFeedback(isApiError(error) ? error.message : 'Não foi possível criar o pedido.')
  }

  const orderMutation = useMutation({
    mutationFn: (attempt: PendingOrderAttempt) =>
      createOrder(
        {
          quoteId: attempt.quoteId,
          walletId: attempt.walletId,
          network: attempt.network,
          collector: attempt.collector,
        },
        attempt.idempotencyKey,
      ),
    onSuccess: (order, attempt) => finishOrder(order, attempt),
    onError: (error, attempt) => handleOrderError(error, attempt),
  })

  const recoveryMutation = useMutation({
    mutationFn: (attempt: PendingOrderAttempt) =>
      createOrder(
        {
          quoteId: attempt.quoteId,
          walletId: attempt.walletId,
          network: attempt.network,
          collector: attempt.collector,
        },
        attempt.idempotencyKey,
      ),
    onSuccess: (order, attempt) => finishOrder(order, attempt),
    onError: (error, attempt) => handleOrderError(error, attempt),
  })

  const resetConnection = () => {
    connectMutation.reset()
    setConnectedWalletId(null)
  }

  const handleContinue = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = orderCollectorSchema.safeParse({
      name: collectorName,
      email: collectorEmail,
    })

    if (!parsed.success) {
      const nextErrors: Partial<Record<'name' | 'email', string>> = {}

      for (const issue of parsed.error.issues) {
        const field = issue.path[0]

        if ((field === 'name' || field === 'email') && !nextErrors[field]) {
          nextErrors[field] = issue.message
        }
      }

      setFieldErrors(nextErrors)
      return
    }

    setFieldErrors({})

    if (!effectiveWallet) {
      setFeedback('Cadastre uma carteira nesta rede para continuar.')
      return
    }

    if (!isConnected) {
      setFeedback('Conecte a carteira selecionada para continuar.')
      return
    }

    setFeedback(null)
    setAcknowledgedQuoteId(null)
    setStep('review')
  }

  const handleConfirm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!quote || !quoteIsCurrent || !acknowledgedQuoteId) {
      return
    }

    const parsed = orderCollectorSchema.safeParse({
      name: collectorName,
      email: collectorEmail,
    })

    if (!parsed.success) {
      setStep('details')
      setAcknowledgedQuoteId(null)
      return
    }

    const attempt: PendingOrderAttempt = {
      quoteId: quote.id,
      walletId: quote.walletId,
      network: quote.network,
      collector: parsed.data,
      idempotencyKey: getOrCreateIdempotencyKey(orderIdempotencyScope(userId, quote.id)),
      createdAt: new Date().toISOString(),
    }

    savePendingOrderAttempt(userId, attempt)
    setPendingAttempt(attempt)
    orderMutation.mutate(attempt)
  }

  const handleNetworkChange = (nextNetwork: QuoteRequest['network']) => {
    setSelectedNetwork(nextNetwork)
    setSelectedWalletId(null)
    resetConnection()
    setAcknowledgedQuoteId(null)
    setFeedback(null)
  }

  const handleWalletChange = (walletId: string) => {
    setSelectedWalletId(walletId)
    resetConnection()
    setAcknowledgedQuoteId(null)
    setFeedback(null)
  }

  const toggleConnection = () => {
    if (!effectiveWallet) {
      return
    }

    if (isConnected) {
      resetConnection()
      setFeedback(null)
      return
    }

    setFeedback(null)
    connectMutation.mutate(effectiveWallet)
  }

  const renderDetails = () => (
    <form
      className="grid gap-6 lg:grid-cols-[1fr_360px]"
      onSubmit={handleContinue}
      data-testid="checkout-details"
    >
      <div className="flex flex-col gap-6">
        <section className="rounded-xl border bg-card p-5" aria-labelledby="collector-title">
          <h2 id="collector-title" className="text-lg font-semibold">
            Dados do colecionador
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Nome</span>
              <input
                value={collectorName}
                onChange={(event) => {
                  setCollectorName(event.target.value)
                  setFieldErrors((current) => ({ ...current, name: undefined }))
                }}
                aria-invalid={fieldErrors.name ? true : undefined}
                aria-describedby={fieldErrors.name ? 'checkout-name-error' : undefined}
                autoComplete="name"
                className="h-9 rounded-md border border-input bg-background px-3 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive"
              />
              {fieldErrors.name ? (
                <span id="checkout-name-error" className="text-xs text-destructive">
                  {fieldErrors.name}
                </span>
              ) : null}
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">E-mail</span>
              <input
                type="email"
                value={collectorEmail}
                onChange={(event) => {
                  setCollectorEmail(event.target.value)
                  setFieldErrors((current) => ({ ...current, email: undefined }))
                }}
                aria-invalid={fieldErrors.email ? true : undefined}
                aria-describedby={fieldErrors.email ? 'checkout-email-error' : undefined}
                autoComplete="email"
                className="h-9 rounded-md border border-input bg-background px-3 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive"
              />
              {fieldErrors.email ? (
                <span id="checkout-email-error" className="text-xs text-destructive">
                  {fieldErrors.email}
                </span>
              ) : null}
            </label>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-5" aria-labelledby="wallets-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="wallets-title" className="text-lg font-semibold">
              Carteira e rede
            </h2>
            <Link to="/wallets" className="text-sm font-medium underline underline-offset-4">
              Gerenciar carteiras
            </Link>
          </div>

          <label className="mt-4 flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Rede</span>
            <select
              value={network}
              onChange={(event) =>
                handleNetworkChange(event.target.value as QuoteRequest['network'])
              }
              className="h-9 rounded-md border border-input bg-background px-3 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {networkOptions.map((option) => (
                <option key={option} value={option}>
                  {networkLabels[option]}
                </option>
              ))}
            </select>
          </label>

          {walletsQuery.isPending ? (
            <div className="mt-4 flex flex-col gap-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : walletsQuery.isError ? (
            <p className="mt-4 text-sm text-destructive" role="alert">
              Não foi possível carregar suas carteiras.
            </p>
          ) : networkWallets.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Nenhuma carteira cadastrada em {networkLabels[network]}.
            </p>
          ) : (
            <fieldset className="mt-4 flex flex-col gap-2">
              <legend className="sr-only">Carteira</legend>
              {networkWallets.map((wallet) => (
                <label
                  key={wallet.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-accent/50"
                >
                  <input
                    type="radio"
                    name="wallet"
                    value={wallet.id}
                    checked={effectiveWallet?.id === wallet.id}
                    onChange={() => handleWalletChange(wallet.id)}
                    className="size-4 accent-primary"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">
                      {wallet.label}
                      {wallet.isPrimary ? ' · Principal' : ''}
                    </span>
                    <span className="block font-mono text-xs text-muted-foreground">
                      {networkLabels[wallet.network]} · {shortAddress(wallet.address)}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
          )}

          {effectiveWallet ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`size-2 rounded-full ${
                    isConnected
                      ? 'bg-emerald-500'
                      : connectMutation.isError
                        ? 'bg-destructive'
                        : 'bg-muted-foreground'
                  }`}
                />
                {connectMutation.isPending
                  ? 'Conectando carteira...'
                  : isConnected
                    ? 'Carteira conectada'
                    : connectMutation.isError
                      ? 'Conexão recusada'
                      : 'Carteira desconectada'}
              </span>
              <Button
                type="button"
                variant={isConnected ? 'outline' : 'default'}
                size="sm"
                disabled={connectMutation.isPending}
                onClick={toggleConnection}
              >
                {isConnected
                  ? 'Desconectar'
                  : connectMutation.isPending
                    ? 'Conectando...'
                    : 'Conectar carteira'}
              </Button>
            </div>
          ) : null}
        </section>
      </div>

      <aside className="flex h-fit flex-col gap-4 rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Resumo do carrinho</h2>
        <p className="text-sm text-muted-foreground">
          {cart?.itemCount ?? 0} item(ns) · {cart?.totals.totalEth ?? '0'} ETH
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to="/cart">Revisar carrinho</Link>
        </Button>
        <Button type="submit" disabled={!effectiveWallet || !isConnected}>
          Continuar para revisão
        </Button>
        <p className="text-xs text-muted-foreground">
          O valor final e a disponibilidade serão confirmados na próxima etapa.
        </p>
      </aside>
    </form>
  )

  const renderReview = () => {
    if (quoteQuery.isPending) {
      return (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]" data-testid="checkout-review">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      )
    }

    if (quoteQuery.isError || !quote) {
      return (
        <div className="rounded-xl border border-destructive/30 p-6" role="alert">
          <h2 className="text-lg font-semibold">Não foi possível revisar o pedido</h2>
          <p className="mt-2 text-sm text-destructive">{quoteErrorMessage}</p>
          <div className="mt-4 flex gap-2">
            <Button type="button" onClick={() => void quoteQuery.refetch()}>
              Tentar novamente
            </Button>
            <Button type="button" variant="outline" onClick={() => setStep('details')}>
              Voltar
            </Button>
          </div>
        </div>
      )
    }

    return (
      <form
        className="grid gap-6 lg:grid-cols-[1fr_360px]"
        onSubmit={handleConfirm}
        data-testid="checkout-review"
      >
        <div className="flex flex-col gap-4">
          <section className="rounded-xl border bg-card p-5" aria-labelledby="review-items-title">
            <h2 id="review-items-title" className="text-lg font-semibold">
              Itens do pedido
            </h2>
            <div className="mt-4 flex flex-col gap-3">
              {quote.items.map((item) => (
                <div key={item.nftId} className="flex items-center gap-3 text-sm">
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="size-14 rounded-lg border object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} × {item.unitPriceEth} ETH
                    </p>
                  </div>
                  <span className="font-mono">{item.lineTotalEth} ETH</span>
                </div>
              ))}
            </div>
          </section>

          <section
            className="rounded-xl border bg-card p-5"
            aria-labelledby="review-collector-title"
          >
            <h2 id="review-collector-title" className="text-lg font-semibold">
              Colecionador e carteira
            </h2>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Nome</dt>
                <dd className="mt-1">{collectorName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">E-mail</dt>
                <dd className="mt-1">{collectorEmail}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Carteira</dt>
                <dd className="mt-1">
                  {quote.walletId} · {networkLabels[quote.network]}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Cotação válida até</dt>
                <dd className="mt-1">
                  {new Intl.DateTimeFormat('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(quote.expiresAt))}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <aside className="flex h-fit flex-col gap-4 rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Resumo</h2>
            {quoteQuery.isFetching ? (
              <span className="text-xs text-muted-foreground">Atualizando...</span>
            ) : null}
          </div>

          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-mono">{quote.subtotalEth} ETH</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Desconto</dt>
              <dd className="font-mono">-{quote.discountEth} ETH</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Taxa de rede</dt>
              <dd className="font-mono">{quote.networkFeeEth} ETH</dd>
            </div>
            <div className="mt-2 flex justify-between border-t pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd className="font-mono" data-testid="checkout-total">
                {quote.totalEth} ETH
              </dd>
            </div>
          </dl>

          {quote.coupon ? (
            <p className="rounded-lg border bg-muted/40 p-3 text-sm">
              Cupom {quote.coupon.code} · {quote.coupon.label}
            </p>
          ) : null}

          {quoteChanged ? (
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400" role="status">
              O resumo foi atualizado por uma alteração de preço ou disponibilidade. Revise os
              valores e confirme novamente.
            </p>
          ) : null}

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={quoteIsCurrent}
              onChange={(event) => setAcknowledgedQuoteId(event.target.checked ? quote.id : null)}
              className="mt-0.5 size-4 accent-primary"
            />
            <span>Revisei os itens, taxas e o total deste pedido.</span>
          </label>

          <Button
            type="submit"
            disabled={!quoteIsCurrent || orderMutation.isPending || Boolean(pendingAttempt)}
            data-testid="checkout-confirm"
          >
            {orderMutation.isPending ? 'Processando pagamento...' : 'Confirmar e pagar'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={orderMutation.isPending}
            onClick={() => {
              setStep('details')
              setAcknowledgedQuoteId(null)
            }}
          >
            Alterar dados
          </Button>
          <p className="text-xs text-muted-foreground">
            Pagamento simulado localmente. Nenhuma transação real será executada.
          </p>
        </aside>
      </form>
    )
  }

  if (cartQuery.isPending) {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-52" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </section>
    )
  }

  if (cartQuery.isError) {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-destructive/30 p-6" role="alert">
          <h1 className="text-xl font-semibold">Não foi possível abrir o checkout</h1>
          <p className="mt-2 text-sm text-destructive">
            {isApiError(cartQuery.error)
              ? cartQuery.error.message
              : 'Falha ao carregar o carrinho.'}
          </p>
          <Button className="mt-4" onClick={() => void cartQuery.refetch()}>
            Tentar novamente
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Finalização</p>
        <h1
          ref={step === 'review' ? reviewHeadingRef : detailsHeadingRef}
          tabIndex={-1}
          className="mt-1 text-3xl font-semibold tracking-tight outline-none"
        >
          {step === 'review' ? 'Revisar pedido' : 'Checkout'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {step === 'review'
            ? 'Confira os dados e os valores atualizados antes de pagar.'
            : 'Informe os dados do colecionador, escolha a rede e conecte a carteira.'}
        </p>
      </div>

      {pendingAttempt ? (
        <div
          className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5"
          role="status"
          data-testid="checkout-recovery"
        >
          <h2 className="font-semibold">Pedido em processamento</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Já existe uma tentativa de compra iniciada. Verifique o pedido antes de tentar novamente
            para evitar duplicidade.
          </p>
          <Button
            className="mt-3"
            size="sm"
            disabled={recoveryMutation.isPending}
            onClick={() => recoveryMutation.mutate(pendingAttempt)}
          >
            {recoveryMutation.isPending ? 'Verificando...' : 'Verificar pedido'}
          </Button>
        </div>
      ) : null}

      {feedback ? (
        <p className="text-sm text-destructive" role="alert" aria-live="polite">
          {feedback}
        </p>
      ) : null}

      {!cart || cart.items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10" data-testid="checkout-empty">
          <h2 className="text-xl font-semibold">Seu carrinho está vazio</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Adicione um NFT ao carrinho para iniciar o checkout.
          </p>
          <Button asChild className="mt-4">
            <Link to="/" search={catalogSearchDefaults}>
              Explorar NFTs
            </Link>
          </Button>
        </div>
      ) : step === 'review' ? (
        renderReview()
      ) : (
        renderDetails()
      )}
    </section>
  )
}
