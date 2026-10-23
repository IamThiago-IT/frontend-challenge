import { useQuery } from '@tanstack/react-query'
import { createFileRoute, stripSearchParams, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { cn } from '@/lib/utils'
import { CatalogPagination } from '@/features/catalog/catalog-pagination'
import { CatalogSearchBar } from '@/features/catalog/catalog-search-bar'
import { CatalogSidebar } from '@/features/catalog/catalog-sidebar'
import { CatalogToolbar } from '@/features/catalog/catalog-toolbar'
import type { CatalogTabId } from '@/features/catalog/catalog-tabs'
import { NftCard } from '@/features/catalog/nft-card'
import { Blog } from '@/features/home/blog'
import { Hero } from '@/features/home/hero'
import { Promos } from '@/features/home/promos'
import {
  catalogSearchDefaults,
  catalogSearchSchema,
  toNftListParams,
} from '@/features/catalog/search-params'
import { nftCategoriesQueryOptions, nftListQueryOptions } from '@/features/catalog/queries'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  search: {
    middlewares: [stripSearchParams(catalogSearchDefaults)],
  },
  loaderDeps: ({ search }) => ({
    search,
  }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(nftListQueryOptions(toNftListParams(deps.search))),
  component: HomePage,
  pendingComponent: HomePending,
})

function HomePage() {
  const loadedData = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/' })
  const { data: liveData } = useQuery(nftListQueryOptions(toNftListParams(search)))
  const data = liveData ?? loadedData
  const { data: categories = [] } = useQuery(nftCategoriesQueryOptions)
  const [activeTab, setActiveTab] = useState<CatalogTabId>('todos')

  const updateSearch = (next: Partial<typeof search>) => {
    void navigate({
      search: (previous) => ({
        ...previous,
        ...next,
      }),
    })
  }

  const clearFilters = () => {
    updateSearch({
      ...catalogSearchDefaults,
      q: undefined,
      network: [],
      minPrice: undefined,
      maxPrice: undefined,
      availability: undefined,
      featured: undefined,
    })
  }

  const handleTabChange = (tab: CatalogTabId) => {
    setActiveTab(tab)

    if (tab === 'todos') {
      updateSearch({ categories: [], network: [], sort: 'recent', page: 1 })
      return
    }

    updateSearch({ sort: tab === 'alta' ? 'popular' : 'recent', page: 1 })
  }

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-16 px-6 py-4 lg:gap-24 lg:px-[120px] lg:py-6">
      <div className="flex flex-col gap-6 lg:gap-8">
        <div className="flex w-full items-center gap-3 lg:block">
          <CatalogSearchBar
            key={search.q ?? ''}
            query={search.q ?? ''}
            onSearch={(query) => updateSearch({ q: query.trim() || undefined, page: 1 })}
            onClear={() => updateSearch({ q: undefined, page: 1 })}
          />
          <a
            href="#filtros"
            aria-label="Filtrar catálogo"
            className="flex size-[45px] shrink-0 items-center justify-center rounded-[10px] bg-primary transition-colors hover:bg-primary/90 lg:hidden"
          >
            <img src="/design/icon-filter.svg" alt="" className="size-5" />
          </a>
        </div>
        <Hero />
      </div>

      <section
        id="catalogo"
        aria-label="Catálogo de NFTs"
        className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12"
      >
        <div className="order-2 w-full lg:order-1 lg:w-auto">
          <CatalogSidebar
            search={search}
            categories={categories}
            onChange={updateSearch}
            onClear={clearFilters}
          />
        </div>

        <div className="order-1 flex min-w-0 flex-1 flex-col gap-8 lg:order-2">
          <CatalogToolbar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            sort={search.sort}
            onSortChange={(sort) => updateSearch({ sort, page: 1 })}
          />

          <p className="text-sm text-text-secondary">
            {data.total} {data.total === 1 ? 'item encontrado' : 'itens encontrados'}
          </p>

          {data.items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-12 text-center">
              <h2 className="text-lg font-bold text-foreground">Nenhum NFT encontrado</h2>
              <p className="mt-2 text-sm text-text-secondary">
                Ajuste os filtros ou tente outra busca.
              </p>
            </div>
          ) : (
            <div className="grid w-full grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3 lg:gap-x-[34px] lg:gap-y-[72px] [&>*:nth-child(even)]:mt-12 lg:[&>*:nth-child(even)]:mt-0">
              {data.items.map((nft, index) => (
                <NftCard key={nft.id} nft={nft} priority={index === 0} />
              ))}
            </div>
          )}

          <CatalogPagination
            page={search.page}
            totalPages={data.totalPages}
            onPageChange={(page) => updateSearch({ page })}
          />
        </div>
      </section>

      <Promos />
      <Blog />
    </div>
  )
}

function HomePending() {
  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-[1440px] flex-col gap-16 px-6 py-4',
        'lg:gap-24 lg:px-[120px] lg:py-6',
      )}
    >
      <div className="h-[300px] w-full animate-pulse rounded-[30px] bg-surface-card lg:h-[450px]" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-x-[34px] lg:gap-y-[72px]">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-[300px] animate-pulse bg-surface-card lg:h-[374px]" />
        ))}
      </div>
    </div>
  )
}
