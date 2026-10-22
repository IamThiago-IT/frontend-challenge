import { Link, Outlet, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
})

function RootComponent() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-sm font-semibold tracking-tight">
            NFT Marketplace
          </Link>
          <span className="text-xs font-medium text-muted-foreground">Frontend Challenge</span>
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
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
      <Link
        to="/"
        className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        Voltar ao início
      </Link>
    </section>
  )
}
