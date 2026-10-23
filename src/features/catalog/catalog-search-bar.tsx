import { useState } from 'react'

import { useSearchDisclosure } from '@/app/search-disclosure-context'
import { cn } from '@/lib/utils'

type CatalogSearchBarProps = {
  query: string
  onSearch: (query: string) => void
  onClear: () => void
}

export function CatalogSearchBar({ query, onSearch, onClear }: CatalogSearchBarProps) {
  const { isOpen } = useSearchDisclosure()
  const [value, setValue] = useState(query)
  const isVisible = isOpen || query.length > 0

  return (
    <form
      id="catalog-search"
      role="search"
      className={cn(
        'min-w-0 flex-1 rounded-[10px] bg-surface-card p-2 lg:p-3',
        isVisible ? 'flex' : 'flex lg:hidden',
      )}
      onSubmit={(event) => {
        event.preventDefault()
        onSearch(value)
      }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          type="submit"
          aria-label="Buscar"
          className="flex size-[22px] shrink-0 items-center justify-center rounded-sm lg:hidden"
        >
          <img src="/design/icon-search.svg" alt="" className="size-[18px]" />
        </button>
        <img
          src="/design/icon-search.svg"
          alt=""
          className="hidden size-[22px] shrink-0 lg:block"
        />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Explorar coleções"
          className="h-7 w-full min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-price-old focus:outline-none"
          aria-label="Buscar NFTs"
        />
      </div>
      {query ? (
        <button
          type="button"
          onClick={() => {
            setValue('')
            onClear()
          }}
          className="ml-2 h-8 shrink-0 rounded-md px-2 text-sm text-text-secondary transition-colors hover:text-text-accent lg:px-3"
        >
          Limpar
        </button>
      ) : null}
      <button
        type="submit"
        aria-label="Buscar"
        className="ml-2 hidden h-8 shrink-0 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-ink transition-colors hover:bg-primary/90 lg:flex"
      >
        Buscar
      </button>
    </form>
  )
}
