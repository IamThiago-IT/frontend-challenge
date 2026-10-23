import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'

import { RealtimeSync } from '@/app/realtime-sync'
import type { RouterContext } from '@/app/router-context'
import { SearchDisclosureProvider } from '@/app/search-disclosure'
import { Button } from '@/components/ui/button'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { MobileTabBar } from '@/components/layout/mobile-tab-bar'
import { isApiError } from '@/lib/api/errors'
import { Link } from '@tanstack/react-router'
import { catalogSearchDefaults } from '@/features/catalog/search-params'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: RootErrorComponent,
})

function RootComponent() {
  return (
    <SearchDisclosureProvider>
      <div className="flex min-h-dvh flex-col pb-[76px] lg:pb-0">
        <RealtimeSync />
        <SiteHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <SiteFooter />
        <MobileTabBar />
      </div>
    </SearchDisclosureProvider>
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
