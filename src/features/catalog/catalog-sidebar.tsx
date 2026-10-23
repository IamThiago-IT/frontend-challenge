import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { catalogSearchDefaults, type CatalogSearch } from '@/features/catalog/search-params'
import { PriceRangeSlider } from '@/features/catalog/price-range-slider'
import type { NftCategory } from '@/features/catalog/contracts'

const networks: Array<{ value: NonNullable<CatalogSearch['network']>[number]; label: string }> = [
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'polygon', label: 'Polygon' },
  { value: 'solana', label: 'Solana' },
]

const availabilityOptions: Array<{
  value: NonNullable<CatalogSearch['availability']>
  label: string
}> = [
  { value: 'available', label: 'Disponíveis' },
  { value: 'sold_out', label: 'Esgotados' },
  { value: 'unavailable', label: 'Indisponíveis' },
]

type CatalogSidebarProps = {
  search: CatalogSearch
  categories: NftCategory[]
  onChange: (next: Partial<CatalogSearch>) => void
  onClear: () => void
}

export function CatalogSidebar({ search, categories, onChange, onClear }: CatalogSidebarProps) {
  const totalCount = categories.reduce((total, category) => total + category.count, 0)
  const hasFilters = Boolean(
    search.q ||
    search.categories.length > 0 ||
    search.network.length > 0 ||
    search.minPrice ||
    search.maxPrice ||
    search.availability ||
    search.featured !== undefined,
  )

  const toggleNetwork = (network: (typeof networks)[number]['value']) => {
    const networksSelected = search.network.includes(network)
      ? search.network.filter((item) => item !== network)
      : [...search.network, network]

    onChange({ network: networksSelected, page: 1 })
  }

  return (
    <aside
      id="filtros"
      className="flex w-full shrink-0 flex-col gap-6 lg:w-[310px]"
      aria-label="Filtros do catálogo"
    >
      <div className="flex w-full flex-col gap-10 overflow-hidden bg-surface-card p-5">
        <section className="flex w-full flex-col gap-3">
          <h2 className="text-lg leading-4 font-bold text-foreground">Coleções</h2>
          <div className="flex w-full flex-col px-3">
            <button
              type="button"
              aria-label="Todas"
              onClick={() => onChange({ categories: [], page: 1 })}
              className="flex w-full items-start justify-between text-[15px] leading-10 transition-colors"
            >
              <span
                className={
                  search.categories.length === 0 ? 'text-text-accent' : 'text-text-secondary'
                }
              >
                Todas
              </span>
              <span
                className={cn(
                  'font-bold',
                  search.categories.length === 0 ? 'text-text-accent' : 'text-text-secondary',
                )}
              >
                ({totalCount})
              </span>
            </button>
            {categories.map((category) => {
              const isActive = search.categories.includes(category.id)

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    const categoriesSelected = isActive
                      ? search.categories.filter((item) => item !== category.id)
                      : [...search.categories, category.id]

                    onChange({ categories: categoriesSelected, page: 1 })
                  }}
                  className="flex w-full items-start justify-between text-[15px] leading-10 transition-colors"
                >
                  <span className={isActive ? 'text-text-accent' : 'text-text-secondary'}>
                    {category.label}
                  </span>
                  <span
                    className={cn(
                      'font-bold',
                      isActive ? 'text-text-accent' : 'text-text-secondary',
                    )}
                  >
                    ({category.count})
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="flex w-full flex-col gap-3">
          <h2 className="text-lg leading-4 font-bold text-foreground">Faixa de preço</h2>
          <PriceRangeSlider
            minValue={search.minPrice}
            maxValue={search.maxPrice}
            onApply={(minPrice, maxPrice) => onChange({ minPrice, maxPrice, page: 1 })}
          />
        </section>

        <section className="flex w-full flex-col gap-3">
          <h2 className="text-lg leading-4 font-bold text-foreground">Rede</h2>
          <div className="flex w-full flex-col px-3">
            {networks.map((network) => (
              <label
                key={network.value}
                className="flex w-full cursor-pointer items-center gap-2 text-[15px] leading-10 text-text-secondary"
              >
                <input
                  type="checkbox"
                  checked={search.network.includes(network.value)}
                  onChange={() => toggleNetwork(network.value)}
                  className="size-4 accent-primary"
                />
                {network.label}
              </label>
            ))}
          </div>
        </section>

        <section className="flex w-full flex-col gap-3">
          <h2 className="text-lg leading-4 font-bold text-foreground">Disponibilidade</h2>
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
            className="h-9 w-full rounded-md border border-border bg-surface-raised px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">Todas</option>
            {availabilityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </section>

        <section className="flex w-full flex-col gap-3">
          <h2 className="text-lg leading-4 font-bold text-foreground">Destaques</h2>
          <label className="flex cursor-pointer items-center gap-2 px-3 text-[15px] leading-10 text-text-secondary">
            <input
              type="checkbox"
              checked={search.featured === true}
              onChange={(event) =>
                onChange({ featured: event.target.checked ? true : undefined, page: 1 })
              }
              data-testid="catalog-featured"
              className="size-4 accent-primary"
            />
            Apenas destaques
          </label>
        </section>

        {hasFilters ? (
          <Button type="button" variant="outline" size="sm" onClick={onClear} className="w-fit">
            Limpar filtros
          </Button>
        ) : null}
      </div>

      <Link
        to="/"
        search={{ ...catalogSearchDefaults, sort: 'popular' }}
        className="relative flex h-[470px] w-full flex-col gap-4 overflow-hidden bg-gradient-to-b from-[rgba(210,138,76,0.1)] to-[rgba(210,138,76,0.03)] pt-6"
      >
        <p className="px-5 text-2xl leading-8 font-bold text-text-accent">NFT EM DESTAQUE</p>
        <p className="px-5 text-center text-[22px] leading-4 font-bold text-foreground">
          OFERTA LIMITADA
        </p>
        <img
          src="/design/nft-ape-02.jpg"
          alt="NFT em destaque"
          className="h-[368px] w-full rounded-[22px] object-cover"
          loading="lazy"
        />
        <span
          aria-hidden="true"
          className="absolute top-[105px] left-[38px] size-[15px] rounded-full bg-[rgba(210,138,76,0.3)]"
        />
        <span
          aria-hidden="true"
          className="absolute top-[343px] left-[248px] size-[45px] rounded-full bg-[rgba(210,138,76,0.3)]"
        />
      </Link>
    </aside>
  )
}
