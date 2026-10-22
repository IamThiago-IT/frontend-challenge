import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Outlet, createRootRouteWithContext, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import { RealtimeSync } from '@/app/realtime-sync'
import type { RouterContext } from '@/app/router-context'
import { Button } from '@/components/ui/button'
import { isApiError } from '@/lib/api/errors'
import { logout } from '@/features/auth/api'
import { sessionQueryOptions } from '@/features/auth/queries'
import { clearAuthenticatedSession } from '@/features/auth/session'
import { catalogSearchDefaults } from '@/features/catalog/search-params'
import { clearAllCheckoutStorage } from '@/features/checkout/storage'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: RootErrorComponent,
})

function RootComponent() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: session } = useQuery(sessionQueryOptions)
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      clearAuthenticatedSession(queryClient)
      clearAllCheckoutStorage()
      setLogoutError(null)
      void router.navigate({ to: '/', search: catalogSearchDefaults })
    },
    onError: (error) => {
      if (isApiError(error) && error.status === 401) {
        clearAuthenticatedSession(queryClient)
        clearAllCheckoutStorage()
        void router.navigate({ to: '/', search: catalogSearchDefaults })
        return
      }

      setLogoutError('Não foi possível encerrar a sessão. Tente novamente.')
    },
  })

  return (
    <div className="flex min-h-dvh flex-col">
      <RealtimeSync />
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-5">
            <Link
              to="/"
              search={catalogSearchDefaults}
              className="text-sm font-semibold tracking-tight"
            >
              NFT Marketplace
            </Link>
            <Link
              to="/cart"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Carrinho
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {session ? (
              <>
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  {session.user.name}
                </span>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/profile">Perfil</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/wallets">Carteiras</Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={logoutMutation.isPending}
                  onClick={() => logoutMutation.mutate()}
                >
                  {logoutMutation.isPending ? 'Saindo...' : 'Sair'}
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">Entrar</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/register">Criar conta</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
        {logoutError ? (
          <p className="mx-auto w-full max-w-7xl px-4 pb-2 text-xs text-destructive sm:px-6 lg:px-8">
            {logoutError}
          </p>
        ) : null}
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t py-6">
        <p className="mx-auto w-full max-w-7xl px-4 text-xs text-muted-foreground sm:px-6 lg:px-8">
          Projeto de estudo. Dados e pagamentos são simulados localmente.
        </p>
      </footer>
    </div>
  )
}

function NotFoundComponent() {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-col items-start gap-4 px-4 py-24 sm:px-6">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-3xl font-semibold tracking-tight">Página não encontrada</h1>
      <p className="text-muted-foreground">
        O endereço acessado não existe ou foi movido. Volte ao início para continuar navegando.
      </p>
      <Button asChild>
        <Link to="/" search={catalogSearchDefaults}>
          Voltar ao início
        </Link>
      </Button>
    </section>
  )
}

function RootErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  const message =
    isApiError(error) && error.status === 404
      ? 'O recurso solicitado não foi encontrado.'
      : 'Não foi possível carregar esta página.'

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col items-start gap-4 px-4 py-24 sm:px-6">
      <p className="text-sm font-medium text-destructive">Erro</p>
      <h1 className="text-3xl font-semibold tracking-tight">{message}</h1>
      <p className="text-muted-foreground">
        Tente novamente. Se o problema persistir, recarregue a aplicação.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Tentar novamente</Button>
        <Button asChild variant="outline">
          <Link to="/" search={catalogSearchDefaults}>
            Ir para o início
          </Link>
        </Button>
      </div>
    </section>
  )
}
