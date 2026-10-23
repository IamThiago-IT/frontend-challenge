import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useState } from 'react'

import { useSearchDisclosure } from '@/app/search-disclosure-context'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { isApiError } from '@/lib/api/errors'
import { logout } from '@/features/auth/api'
import { sessionQueryOptions } from '@/features/auth/queries'
import { clearAuthenticatedSession } from '@/features/auth/session'
import { cartQueryOptions } from '@/features/cart/queries'
import { catalogSearchDefaults } from '@/features/catalog/search-params'
import { clearAllCheckoutStorage } from '@/features/checkout/storage'

const navItems = [
  { label: 'Início', href: '#inicio', active: true },
  { label: 'Mercado', href: '#catalogo', active: false },
  { label: 'Criadores', href: '#criadores', active: false },
  { label: 'Aprenda', href: '#diario', active: false },
]

export function SiteHeader() {
  const navigate = useNavigate()
  const location = useRouterState({ select: (state) => state.location.pathname })
  const queryClient = useQueryClient()
  const { data: session } = useQuery(sessionQueryOptions)
  const { data: cart } = useQuery(cartQueryOptions(session?.user.id ?? null))
  const { isOpen: isSearchOpen, toggle: toggleSearch } = useSearchDisclosure()
  const [logoutError, setLogoutError] = useState<string | null>(null)

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      clearAuthenticatedSession(queryClient)
      clearAllCheckoutStorage()
      setLogoutError(null)
      void navigate({ to: '/', search: catalogSearchDefaults })
    },
    onError: (error) => {
      if (isApiError(error) && error.status === 401) {
        clearAuthenticatedSession(queryClient)
        clearAllCheckoutStorage()
        void navigate({ to: '/', search: catalogSearchDefaults })
        return
      }

      setLogoutError('Não foi possível encerrar a sessão. Tente novamente.')
    },
  })

  const handleSearchToggle = () => {
    if (location !== '/') {
      void navigate({ to: '/', search: catalogSearchDefaults })
    }

    toggleSearch()
  }

  const itemCount = cart?.itemCount ?? 0

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur">
      <div className="mx-auto w-full max-w-[1440px] px-6 py-6 lg:px-[120px]">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/"
            search={catalogSearchDefaults}
            className="text-sm font-bold tracking-[1.4px] text-foreground"
          >
            KURIO
          </Link>

          <nav aria-label="Navegação principal" className="hidden items-start gap-10 lg:flex">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={cn(
                  'flex flex-col gap-6 text-base transition-colors',
                  item.active
                    ? 'font-bold text-text-accent'
                    : 'text-foreground hover:text-text-accent',
                )}
              >
                {item.label}
                {item.active ? (
                  <span className="h-[3px] w-full bg-primary" aria-hidden="true" />
                ) : null}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4 lg:gap-7">
            <button
              type="button"
              onClick={handleSearchToggle}
              aria-label="Alternar busca"
              aria-expanded={isSearchOpen}
              aria-controls="catalog-search"
              className="hidden size-5 items-center justify-center lg:flex"
            >
              <img src="/design/icon-search.svg" alt="" className="size-5" />
            </button>

            <Link
              to="/cart"
              aria-label="Carrinho"
              className="relative hidden size-6 items-center justify-center lg:flex"
            >
              <img src="/design/icon-cart.svg" alt="" className="size-6" />
              {itemCount > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute -top-1 -right-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-ink"
                >
                  {itemCount}
                </span>
              ) : null}
            </Link>

            {session ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="hidden max-w-40 truncate text-sm text-text-secondary transition-colors hover:text-text-accent lg:inline"
                >
                  {session.user.name}
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-[35px] rounded-md border-primary px-4 text-base font-medium text-foreground"
                  disabled={logoutMutation.isPending}
                  onClick={() => logoutMutation.mutate()}
                >
                  Sair
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="inline-flex h-[35px] w-[100px] items-center justify-center gap-1 rounded-md bg-primary text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <img src="/design/icon-logout.svg" alt="" className="size-5" />
                  Entrar
                </Link>
                <Link
                  to="/register"
                  className="hidden text-sm text-text-secondary transition-colors hover:text-text-accent lg:inline"
                >
                  Criar conta
                </Link>
              </div>
            )}
          </div>
        </div>

        {logoutError ? <p className="mt-2 text-xs text-destructive">{logoutError}</p> : null}
      </div>
      <div className="h-px w-full bg-primary/60" aria-hidden="true" />
    </header>
  )
}
