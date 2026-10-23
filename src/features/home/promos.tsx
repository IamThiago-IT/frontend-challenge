import { Link } from '@tanstack/react-router'

import { catalogSearchDefaults } from '@/features/catalog/search-params'

const promos = [
  {
    id: 'genesis',
    title: ['Lançamentos gênesis', 'de edição limitada'],
    description: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    image: '/design/nft-ape-01.jpg',
    alt: 'Lançamentos gênesis',
  },
  {
    id: 'curated',
    title: ['Arte digital selecionada', 'e muito mais'],
    description:
      'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    image: '/design/nft-ape-03.jpg',
    alt: 'Arte digital selecionada',
  },
]

export function Promos() {
  return (
    <section id="promos" aria-label="Destaques do marketplace" className="w-full">
      <div className="flex w-full flex-col gap-6 lg:flex-row lg:justify-between">
        {promos.map((promo) => (
          <article
            key={promo.id}
            className="relative h-[250px] w-full overflow-hidden rounded-lg bg-surface-card"
          >
            <img
              src={promo.image}
              alt={promo.alt}
              className="absolute inset-y-0 left-0 h-full w-[49%] rounded-[18px] object-cover"
              loading="lazy"
            />
            <img
              src="/design/promo-mask.svg"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 size-full"
            />
            <div className="relative flex h-full flex-col items-end py-9 pr-8 pl-[52%] text-right">
              <p className="text-lg leading-6 font-bold text-foreground">
                {promo.title[0]}
                <br />
                {promo.title[1]}
              </p>
              <p className="mt-3 max-w-[263px] text-sm leading-6 text-text-secondary">
                {promo.description}
              </p>
              <Link
                to="/"
                search={catalogSearchDefaults}
                className="mt-4 flex h-10 w-[140px] items-center justify-center gap-2 rounded-md bg-primary text-sm leading-5 font-medium text-ink transition-colors hover:bg-primary/90"
              >
                Explorar
                <img src="/design/icon-arrow-right.svg" alt="" className="h-3 w-3" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
