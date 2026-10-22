import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { isApiError } from '@/lib/api/errors'
import { clearIdempotencyKey } from '@/lib/api/idempotency'
import { queryKeys } from '@/lib/query/keys'
import { catalogSearchDefaults } from '@/features/catalog/search-params'
import {
  clearCheckoutDraft,
  clearPendingOrderAttempt,
  getPendingOrderAttempt,
  orderIdempotencyScope,
} from '@/features/checkout/storage'
import { orderQueryOptions } from '@/features/orders/queries'

export const Route = createFileRoute('/_authenticated/orders/$orderId')({
  component: OrderDetailPage,
})

const statusLabels = {
  pending: 'Processando',
  confirmed: 'Confirmado',
  declined: 'Recusado',
} as const

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function OrderDetailPage() {
  const { session } = Route.useRouteContext()
  const userId = session.user.id
  const { orderId } = Route.useParams()
  const queryClient = useQueryClient()
  const orderQuery = useQuery(orderQueryOptions(userId, orderId))
  const order = orderQuery.data
  const reconciledOrderId = useRef<string | null>(null)

  useEffect(() => {
    if (!order || reconciledOrderId.current === order.id) {
      return
    }

    reconciledOrderId.current = order.id
    const attempt = getPendingOrderAttempt(userId)

    if (attempt?.quoteId === order.quoteId) {
      clearPendingOrderAttempt(userId)
      clearIdempotencyKey(orderIdempotencyScope(userId, order.quoteId))
    }

    if (order.status === 'confirmed') {
      clearCheckoutDraft(userId)
    }

    if (order.status !== 'pending') {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.private.cart(userId),
      })
    }
  }, [order, queryClient, userId])

  if (orderQuery.isPending) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </section>
    )
  }

  if (orderQuery.isError) {
    const notFound = isApiError(orderQuery.error) && orderQuery.error.status === 404

    return (
      <section className="mx-auto flex w-full max-w-xl flex-col items-start gap-4 px-4 py-24 sm:px-6">
        <p className="text-sm font-medium text-destructive">{notFound ? '404' : 'Erro'}</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {notFound ? 'Pedido não encontrado' : 'Não foi possível carregar o pedido'}
        </h1>
        <p className="text-muted-foreground">
          {isApiError(orderQuery.error)
            ? orderQuery.error.message
            : 'Tente novamente em instantes.'}
        </p>
        <div className="flex gap-3">
          {!notFound ? (
            <Button onClick={() => void orderQuery.refetch()}>Tentar novamente</Button>
          ) : null}
          <Button asChild variant="outline">
            <Link to="/" search={catalogSearchDefaults}>
              Voltar ao catálogo
            </Link>
          </Button>
        </div>
      </section>
    )
  }

  if (!order) {
    return null
  }

  const isPending = order.status === 'pending'

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Pedido</p>
        <h1 className="mt-1 font-mono text-2xl font-semibold tracking-tight">{order.id}</h1>
      </div>

      <div
        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5"
        data-testid="order-status"
        aria-live="polite"
      >
        <div>
          <p className="text-xs text-muted-foreground">Status</p>
          <p className="mt-1 text-lg font-semibold">{statusLabels[order.status]}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Atualizado em {formatDateTime(order.updatedAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="mt-1 font-mono text-xl font-semibold">{order.totalEth} ETH</p>
        </div>
      </div>

      {isPending ? (
        <div className="rounded-xl border border-dashed p-6" role="status">
          <h2 className="text-lg font-semibold">Processando pagamento</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            O pedido está aguardando a confirmação da simulação. Você pode atualizar esta página ou
            aguardar; o estado será recuperado automaticamente.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            disabled={orderQuery.isFetching}
            onClick={() => void orderQuery.refetch()}
          >
            {orderQuery.isFetching ? 'Atualizando...' : 'Atualizar status'}
          </Button>
        </div>
      ) : order.status === 'declined' ? (
        <div className="rounded-xl border border-destructive/30 p-6" role="alert">
          <h2 className="text-lg font-semibold">Pagamento recusado</h2>
          <p className="mt-2 text-sm text-destructive">
            {order.failureReason ?? 'O pagamento não foi autorizado.'}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Seus itens permanecem no carrinho e nenhuma cobrança foi realizada.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/checkout">Tentar novamente</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/cart">Voltar ao carrinho</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="rounded-xl border border-emerald-600/30 bg-emerald-500/10 p-6"
          role="status"
        >
          <h2 className="text-lg font-semibold">Pedido confirmado</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            O pagamento foi confirmado e o recibo abaixo representa o snapshot deste pedido.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {order.items.map((item) => (
          <div key={item.nftId} className="flex items-center gap-4 rounded-xl border bg-card p-4">
            <img src={item.imageUrl} alt="" className="size-16 rounded-lg border object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {item.quantity} unidade(s) · {item.unitPriceEth} ETH
              </p>
            </div>
            <span className="font-mono text-sm">{item.lineTotalEth} ETH</span>
          </div>
        ))}
      </div>

      <div className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2">
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="font-mono">{order.subtotalEth} ETH</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Desconto</dt>
            <dd className="font-mono">-{order.discountEth} ETH</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Taxa de rede</dt>
            <dd className="font-mono">{order.networkFeeEth} ETH</dd>
          </div>
          {order.couponCode ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Cupom</dt>
              <dd>{order.couponCode}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4 border-t pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd className="font-mono">{order.totalEth} ETH</dd>
          </div>
        </dl>

        <dl className="flex flex-col gap-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Colecionador</dt>
            <dd className="mt-1">{order.collector.name}</dd>
            <dd className="text-muted-foreground">{order.collector.email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Carteira</dt>
            <dd className="mt-1">{order.wallet.label}</dd>
            <dd className="truncate font-mono text-xs text-muted-foreground">
              {order.wallet.network} · {order.wallet.address}
            </dd>
          </div>
        </dl>
      </div>

      {order.status === 'confirmed' && order.receipt ? (
        <div className="rounded-xl border bg-card p-5" data-testid="order-receipt">
          <h2 className="text-lg font-semibold">Comprovante</h2>
          <dl className="mt-3 grid gap-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Número</dt>
              <dd className="font-mono">{order.receipt.number}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Transação</dt>
              <dd className="truncate font-mono">{order.receipt.transactionHash}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Pago em</dt>
              <dd>{formatDateTime(order.receipt.paidAt)}</dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={order.receipt.explorerUrl} target="_blank" rel="noreferrer">
                Ver no explorador
              </a>
            </Button>
            <Button asChild size="sm">
              <Link to="/" search={catalogSearchDefaults}>
                Continuar explorando
              </Link>
            </Button>
          </div>
        </div>
      ) : null}

      {!isPending && order.status !== 'confirmed' ? null : (
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost">
            <Link to="/" search={catalogSearchDefaults}>
              Voltar ao catálogo
            </Link>
          </Button>
        </div>
      )}
    </section>
  )
}
