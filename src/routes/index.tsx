import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute, stripSearchParams, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  catalogSearchDefaults,
  catalogSearchSchema,
  toNftListParams,
  type CatalogSearch,
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
  component: CatalogPage,
  pendingComponent: CatalogPending,
})

type CatalogSearchFormProps = {
  initialQuery: string
  onSearch: (query: string) => void
  onClear: () => void
}

function CatalogSearchForm({ initialQuery, onSearch, onClear }: CatalogSearchFormProps) {
  const [query, setQuery] = useState(initialQuery)

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault()
        onSearch(query)
      }}
    >
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Busque por nome, coleção ou criador"
        className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        aria-label="Buscar NFTs"
      />
      <Button type="submit">Buscar</Button>
      {initialQuery ? (
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setQuery('')
            onClear()
          }}
        >
          Limpar
        </Button>
      ) : null}
    </form>
  )
}

const sortOptions: Array<{ value: CatalogSearch['sort']; label: string }> = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'price-asc', label: 'Menor preço' },
  { value: 'price-desc', label: 'Maior preço' },
  { value: 'popular', label: 'Mais populares' },
]

const availabilityOptions: Array<{
  value: NonNullable<CatalogSearch['availability']>
  label: string
}> = [
  { value: 'available', label: 'Disponíveis' },
  { value: 'sold_out', label: 'Esgotados' },
  { value: 'unavailable', label: 'Indisponíveis' },
]

type CatalogFiltersProps = {
  search: CatalogSearch
  onChange: (next: Partial<CatalogSearch>) => void
  onClear: () => void
}

function CatalogFilters({ search, onChange, onClear }: CatalogFiltersProps) {
  const [minPrice, setMinPrice] = useState(search.minPrice ?? '')
  const [maxPrice, setMaxPrice] = useState(search.maxPrice ?? '')
  const hasFilters = Boolean(
    search.q ||
    search.categories.length > 0 ||
    search.minPrice ||
    search.maxPrice ||
    search.availability ||
    search.featured !== undefined,
  )

  return (
    <div className="flex flex-col gap-3 border-t pt-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Ordenar por
          <select
            value={search.sort}
            onChange={(event) =>
              onChange({
                sort: event.target.value as CatalogSearch['sort'],
                page: 1,
              })
            }
            data-testid="catalog-sort"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Disponibilidade
          <select
            value={search.availability ?? ''}
            onChange={(event) =>
              onChange({
                availability: event.target.value
                  ? (event.target.value as NonNullable<CatalogSearch['availability']>)
                  : undefined,
                page: 1,
              })
            }
            data-testid="catalog-availability"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">Todas</option>
            {availabilityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm sm:pt-5">
          <input
            type="checkbox"
            checked={search.featured === true}
            onChange={(event) =>
              onChange({
                featured: event.target.checked ? true : undefined,
                page: 1,
              })
            }
            data-testid="catalog-featured"
            className="size-4 rounded border-input accent-primary"
          />
          Apenas destaques
        </label>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            onChange({
              minPrice: minPrice.trim() || undefined,
              maxPrice: maxPrice.trim() || undefined,
              page: 1,
            })
          }}
        >
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Preço mínimo (ETH)
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              data-testid="catalog-min-price"
              className="h-9 w-32 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Preço máximo (ETH)
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              data-testid="catalog-max-price"
              className="h-9 w-32 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </label>
          <Button type="submit" variant="outline" size="sm">
            Aplicar preço
          </Button>
        </form>

        {hasFilters ? (
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            Limpar filtros
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function CatalogPage() {
  const loadedData = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/' })
  const { data: liveData } = useQuery(nftListQueryOptions(toNftListParams(search)))
  const data = liveData ?? loadedData
  const { data: categories = [] } = useQuery(nftCategoriesQueryOptions)

  const updateSearch = (next: Partial<typeof search>) => {
    void navigate({
      search: (previous) => ({
        ...previous,
        ...next,
      }),
    })
  }

  const toggleCategory = (categoryId: (typeof search.categories)[number]) => {
    const categoriesSelected = search.categories.includes(categoryId)
      ? search.categories.filter((category) => category !== categoryId)
      : [...search.categories, categoryId]

    updateSearch({
      categories: categoriesSelected,
      page: 1,
    })
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="flex flex-col gap-4">
        <span className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          Curadoria digital
        </span>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Marketplace de NFTs
        </h1>
        <p className="max-w-2xl text-base text-pretty text-muted-foreground sm:text-lg">
          Descubra edições de arte, música, fotografia e colecionáveis digitais. Todo o fluxo de
          compra é simulado localmente para você explorar sem risco.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-5">
        <CatalogSearchForm
          key={search.q ?? ''}
          initialQuery={search.q ?? ''}
          onSearch={(query) =>
            updateSearch({
              q: query.trim() || undefined,
              page: 1,
            })
          }
          onClear={() => updateSearch({ q: undefined, page: 1 })}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="xs"
            variant={search.categories.length === 0 ? 'default' : 'outline'}
            onClick={() => updateSearch({ categories: [], page: 1 })}
          >
            Todas
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              type="button"
              size="xs"
              variant={search.categories.includes(category.id) ? 'default' : 'outline'}
              onClick={() => toggleCategory(category.id)}
            >
              {category.label}
              <span className="text-[10px] opacity-70">{category.count}</span>
            </Button>
          ))}
        </div>
        <CatalogFilters
          key={`${search.minPrice ?? ''}:${search.maxPrice ?? ''}`}
          search={search}
          onChange={updateSearch}
          onClear={() =>
            updateSearch({
              ...catalogSearchDefaults,
              q: undefined,
              minPrice: undefined,
              maxPrice: undefined,
              availability: undefined,
              featured: undefined,
            })
          }
        />
      </div>

      <div className="flex items-end justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {data.total} {data.total === 1 ? 'item encontrado' : 'itens encontrados'}
        </p>
      </div>

      {data.items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <h2 className="text-lg font-semibold">Nenhum NFT encontrado</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ajuste os filtros ou tente outra busca.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.items.map((nft, index) => (
            <Link
              key={nft.id}
              to="/nft/$nftId"
              params={{ nftId: nft.id }}
              data-testid="nft-card"
              className="group overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-lg"
            >
              <div className="relative aspect-square overflow-hidden bg-muted">
                <img
                  src={nft.imageUrl}
                  alt={nft.name}
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  decoding="async"
                />
                {nft.availability !== 'available' ? (
                  <span className="absolute top-3 left-3 rounded-full bg-background/90 px-2 py-1 text-xs font-medium">
                    {nft.availability === 'sold_out' ? 'Esgotado' : 'Indisponível'}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-col gap-2 p-4">
                <p className="text-xs text-muted-foreground">{nft.collection.name}</p>
                <h2 className="truncate font-semibold">{nft.name}</h2>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-muted-foreground">{nft.creator.name}</span>
                  <span className="font-mono font-medium">{nft.priceEth} ETH</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {data.totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            disabled={search.page <= 1}
            onClick={() => updateSearch({ page: search.page - 1 })}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {search.page} de {data.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={search.page >= data.totalPages}
            onClick={() => updateSearch({ page: search.page + 1 })}
          >
            Próxima
          </Button>
        </div>
      ) : null}
    </section>
  )
}

function CatalogPending() {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-16 sm:px-6 lg:px-8">
      <div className="h-10 w-72 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="h-80 animate-pulse rounded-xl border bg-muted" />
        ))}
      </div>
    </section>
  )
}
