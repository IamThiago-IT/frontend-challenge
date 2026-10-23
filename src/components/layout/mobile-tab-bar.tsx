import { Link } from '@tanstack/react-router'

import { catalogSearchDefaults } from '@/features/catalog/search-params'

const barItemClass =
  'flex size-11 items-center justify-center rounded-xl transition-colors hover:bg-surface-raised'

export function MobileTabBar() {
  return (
    <nav aria-label="Navegação móvel" className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
      <div className="relative flex h-[68px] items-center justify-between rounded-t-2xl bg-surface-card px-6 pb-2 shadow-[0_-10px_30px_rgba(10,6,4,0.45)]">
        <Link to="/" search={catalogSearchDefaults} aria-label="Início" className={barItemClass}>
          <img src="/design/tab-icon-home.svg" alt="" className="h-4 w-4" />
        </Link>
        <Link to="/profile" aria-label="Minha coleção" className={barItemClass}>
          <img src="/design/tab-icon-heart.svg" alt="" className="h-[18px] w-5" />
        </Link>
        <span aria-hidden="true" className="w-11" />
        <Link to="/cart" aria-label="Carrinho" className={barItemClass}>
          <img src="/design/icon-cart.svg" alt="" className="size-6" />
        </Link>
        <Link to="/login" aria-label="Minha conta" className={barItemClass}>
          <img src="/design/icon-user.svg" alt="" className="size-5" />
        </Link>

        <div
          aria-hidden="true"
          className="absolute top-0 left-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background"
        />
        <Link
          to="/"
          search={catalogSearchDefaults}
          aria-label="Explorar mercado"
          className="absolute top-0 left-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary shadow-[0_4px_16px_rgba(210,138,76,0.4)]"
        >
          <img src="/design/icon-shop.svg" alt="" className="size-5 brightness-0" />
        </Link>
      </div>
    </nav>
  )
}
