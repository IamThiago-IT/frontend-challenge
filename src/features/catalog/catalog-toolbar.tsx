import { cn } from '@/lib/utils'
import { catalogTabs, type CatalogTabId } from '@/features/catalog/catalog-tabs'
import type { CatalogSearch } from '@/features/catalog/search-params'

const sortOptions: Array<{ value: CatalogSearch['sort']; label: string }> = [
  { value: 'recent', label: 'Listados recentemente' },
  { value: 'price-asc', label: 'Menor preço' },
  { value: 'price-desc', label: 'Maior preço' },
  { value: 'popular', label: 'Mais populares' },
]

type CatalogToolbarProps = {
  activeTab: CatalogTabId
  onTabChange: (tab: CatalogTabId) => void
  sort: CatalogSearch['sort']
  onSortChange: (sort: CatalogSearch['sort']) => void
}

export function CatalogToolbar({
  activeTab,
  onTabChange,
  sort,
  onSortChange,
}: CatalogToolbarProps) {
  return (
    <div className="flex w-full flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex max-w-full flex-wrap items-start gap-x-4 gap-y-3 text-[13px] leading-4 font-medium whitespace-nowrap sm:gap-x-5 sm:text-[15px]">
        {catalogTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex flex-col gap-5 transition-colors',
              activeTab === tab.id ? 'font-bold text-text-accent' : 'text-foreground',
            )}
          >
            {tab.label}
            {activeTab === tab.id ? (
              <span aria-hidden="true" className="h-0.5 w-full bg-primary" />
            ) : null}
          </button>
        ))}
      </div>

      <label className="flex shrink-0 items-center gap-2 text-[15px] text-foreground">
        Ordenar por:
        <select
          value={sort}
          onChange={(event) => onSortChange(event.target.value as CatalogSearch['sort'])}
          data-testid="catalog-sort"
          className="cursor-pointer appearance-none bg-transparent pr-5 font-normal outline-none"
          style={{
            backgroundImage: "url('/design/icon-arrow-down.svg')",
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right center',
            backgroundSize: '14px 14px',
          }}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
