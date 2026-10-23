import { cn } from '@/lib/utils'

type CatalogPaginationProps = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function CatalogPagination({ page, totalPages, onPageChange }: CatalogPaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <nav
      aria-label="Paginação do catálogo"
      className="flex w-full flex-col items-center gap-3 lg:items-end"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex h-[35px] items-center justify-center rounded border border-border px-3 text-sm text-foreground transition-colors hover:border-primary hover:text-text-accent disabled:pointer-events-none disabled:opacity-40"
        >
          Anterior
        </button>
        {pages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            aria-label={`Ir para a página ${pageNumber}`}
            aria-current={pageNumber === page ? 'page' : undefined}
            onClick={() => onPageChange(pageNumber)}
            className={cn(
              'flex size-[35px] items-center justify-center rounded text-lg leading-4 font-bold transition-colors',
              pageNumber === page
                ? 'bg-primary text-ink'
                : 'border border-border text-foreground hover:border-primary hover:text-text-accent',
            )}
          >
            {pageNumber}
          </button>
        ))}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex h-[35px] items-center justify-center rounded border border-border px-3 text-sm text-foreground transition-colors hover:border-primary hover:text-text-accent disabled:pointer-events-none disabled:opacity-40"
        >
          Próxima
        </button>
      </div>
      <p className="text-sm text-text-secondary">
        Página {page} de {totalPages}
      </p>
    </nav>
  )
}
