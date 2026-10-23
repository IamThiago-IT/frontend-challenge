import { Link } from '@tanstack/react-router'

import type { CategoryId } from '@/features/catalog/contracts'
import { catalogSearchDefaults } from '@/features/catalog/search-params'

const medallions = [
  {
    letter: 'W',
    title: 'Segurança da carteira',
    description: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    letter: 'C',
    title: 'Criadores em destaque',
    description: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    letter: 'D',
    title: 'Alertas de lançamentos',
    description:
      'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
]

const profileLinks = [
  'Meu perfil',
  'Minha coleção',
  'Atividade',
  'Estúdio do criador',
  'Lista de interesse',
]
const helpLinks = [
  'Central de ajuda',
  'Como comprar NFTs',
  'Carteira e segurança',
  'Política do mercado',
  'Denunciar item',
]

const collectionLinks: Array<{ label: string; category: CategoryId }> = [
  { label: 'Arte digital', category: 'art' },
  { label: 'Fotografia', category: 'photography' },
  { label: 'Música', category: 'music' },
  { label: 'Arte 3D', category: 'metaverse' },
  { label: 'Utilidade', category: 'collectibles' },
]

export function SiteFooter() {
  return (
    <footer className="w-full">
      <div className="flex w-full flex-col gap-8 bg-surface-card p-8 lg:min-h-[250px] lg:flex-row lg:items-end lg:gap-0">
        {medallions.map((medallion) => (
          <div key={medallion.title} className="contents lg:flex lg:h-full">
            <div className="flex flex-1 flex-col items-start gap-3 px-4">
              <div className="flex size-[74px] items-center justify-center rounded-full bg-primary">
                <span className="text-2xl font-bold text-ink">{medallion.letter}</span>
              </div>
              <p className="text-[17px] leading-4 font-bold text-foreground">{medallion.title}</p>
              <p className="max-w-[204px] text-sm leading-[22px] text-text-secondary">
                {medallion.description}
              </p>
            </div>
            <div aria-hidden="true" className="hidden w-px self-stretch bg-primary lg:block" />
          </div>
        ))}

        <div aria-hidden="true" className="hidden w-px self-stretch bg-primary lg:block" />

        <div className="flex flex-col gap-3 px-4 lg:w-[357px]">
          <div className="flex flex-col gap-4">
            <p className="text-lg leading-4 font-bold text-foreground">
              Antecipe-se ao próximo lançamento
            </p>
            <form
              aria-label="Assinar novidades"
              className="flex h-10 w-full items-center justify-between overflow-hidden rounded-md bg-surface-dark pl-3 shadow-[0_0_10px_rgba(10,6,4,0.45)]"
              onSubmit={(event) => {
                event.preventDefault()
                event.currentTarget.reset()
              }}
            >
              <label htmlFor="footer-newsletter-email" className="sr-only">
                Assinar novidades
              </label>
              <input
                type="email"
                id="footer-newsletter-email"
                name="email"
                required
                placeholder="digite seu e-mail..."
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-price-old focus:outline-none"
              />
              <button
                type="submit"
                className="flex h-10 w-[85px] shrink-0 items-center justify-center rounded-r-md bg-primary text-lg font-bold text-ink transition-colors hover:bg-primary/90"
              >
                Enviar
              </button>
            </form>
          </div>
          <p className="text-[13px] leading-[22px] text-text-secondary">
            Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col items-start justify-center gap-1 bg-surface-dark p-8 lg:h-[88px] lg:flex-row lg:items-center lg:gap-[92px]">
        <div className="flex flex-1 items-center py-2">
          <p className="text-sm font-bold tracking-[1.4px] text-foreground">KURIO</p>
        </div>
        <div className="flex flex-1 items-center">
          <p className="text-sm leading-[22px] text-foreground">
            Feito para colecionadores,
            <br />
            criadores e cultura
          </p>
        </div>
        <div className="flex flex-1 items-center">
          <a
            href="mailto:contato@email.com"
            className="text-sm leading-[22px] text-foreground transition-colors hover:text-text-accent"
          >
            contato@email.com
          </a>
        </div>
        <div className="flex w-[228px] items-center">
          <p className="text-sm leading-[22px] text-foreground">+55 11 4002 8922</p>
        </div>
      </div>

      <div className="flex w-full flex-col gap-1.5 bg-surface-card">
        <div className="flex w-full flex-col gap-10 p-8 lg:h-[236px] lg:flex-row lg:gap-[124px]">
          <div className="flex flex-1 flex-col gap-2 text-foreground">
            <p className="text-lg leading-4 font-bold">Meu perfil</p>
            <ul className="text-sm">
              {profileLinks.map((label) => (
                <li key={label} className="leading-[30px]">
                  <Link to="/profile" className="transition-colors hover:text-text-accent">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-1 flex-col gap-2 text-foreground">
            <p className="text-lg leading-4 font-bold">Central de ajuda</p>
            <ul className="text-sm">
              {helpLinks.map((label) => (
                <li key={label} className="leading-[30px]">
                  <a href="#diario" className="transition-colors hover:text-text-accent">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-1 flex-col gap-2 text-foreground">
            <p className="text-lg leading-4 font-bold">Coleções</p>
            <ul className="text-sm">
              {collectionLinks.map((item) => (
                <li key={item.category} className="leading-[30px]">
                  <Link
                    to="/"
                    search={{ ...catalogSearchDefaults, categories: [item.category] }}
                    className="transition-colors hover:text-text-accent"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex w-full flex-col gap-8 lg:w-[228px]">
            <div className="flex flex-col gap-5">
              <p className="text-lg leading-4 font-bold text-foreground">Redes sociais</p>
              <ul className="flex items-center gap-2.5" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((index) => (
                  <li key={index} className="size-[30px]">
                    <img
                      src={`/design/social-0${index}.svg`}
                      alt=""
                      loading="lazy"
                      className="size-[30px]"
                    />
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-lg leading-4 font-bold text-foreground">Carteiras compatíveis</p>
              <p className="flex h-[26px] items-center justify-center rounded-md border border-border-soft bg-surface-dark pl-2 text-[9px] font-bold tracking-[0.1px] whitespace-pre text-text-accent">
                METAMASK • WALLETCONNECT • COINBASE
              </p>
            </div>
          </div>
        </div>

        <p className="w-full text-center text-sm leading-[30px] text-foreground">
          © 2026 Kurio. Propriedade digital para todos.
        </p>
      </div>
    </footer>
  )
}
