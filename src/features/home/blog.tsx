const posts = [
  {
    id: 'propriedade',
    meta: '12 de setembro  |  Leitura de 6 min',
    title: 'Como funciona a propriedade de NFTs',
    description: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    image: '/design/nft-ape-03.jpg',
  },
  {
    id: 'artistas',
    meta: '13 de setembro  |  Leitura de 2 min',
    title: '10 artistas digitais para acompanhar',
    description: 'Conheça criadores que moldam a cultura digital.',
    image: '/design/nft-ape-01.jpg',
  },
  {
    id: 'raridade',
    meta: '15 de setembro  |  Leitura de 3 min',
    title: 'Raridade, atributos e procedência',
    description: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    image: '/design/nft-ape-02.jpg',
  },
  {
    id: 'carteira',
    meta: '15 de setembro  |  Leitura de 2 min',
    title: 'Como proteger sua carteira',
    description: 'Proteja sua carteira, seus ativos e sua identidade.',
    image: '/design/nft-ape-04.jpg',
  },
]

export function Blog() {
  return (
    <section
      id="diario"
      aria-label="Diário da Cunhagem"
      className="flex w-full flex-col items-center gap-10"
    >
      <div className="flex w-full flex-col items-center gap-3 text-center">
        <h2 className="text-[28px] font-bold text-foreground">Diário da Cunhagem</h2>
        <p className="text-sm text-text-secondary">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </div>
      <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((post) => (
          <article
            key={post.id}
            className="flex w-full flex-col overflow-hidden rounded-lg bg-surface-card"
          >
            <img src={post.image} alt="" className="h-[195px] w-full object-cover" loading="lazy" />
            <div className="flex flex-col gap-2 px-4 pt-3 pb-4">
              <p className="text-xs leading-4 font-medium whitespace-pre-wrap text-text-secondary">
                {post.meta}
              </p>
              <h3 className="text-base font-bold text-foreground">{post.title}</h3>
              <p className="text-xs leading-4 font-medium text-text-secondary">
                {post.description}
              </p>
              <a
                href="#diario"
                className="flex items-center gap-1 text-xs leading-[14px] font-bold text-text-accent"
              >
                Ler mais
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
