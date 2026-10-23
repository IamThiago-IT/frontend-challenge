export function Hero() {
  return (
    <section id="inicio" aria-label="Destaque" className="w-full">
      {/* Desktop */}
      <div className="relative hidden h-[450px] items-center pl-10 lg:flex">
        <div className="flex w-full items-center justify-between">
          <div className="flex w-[600px] flex-col gap-11">
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-1 text-foreground">
                <p className="text-sm leading-4 font-medium tracking-[1.4px]">Bem-vindo à Kurio</p>
                <h1 className="text-[43px] leading-[70px] font-bold">
                  SEJA DONO DO FUTURO <br />
                  DA ARTE DIGITAL
                </h1>
                <p className="max-w-[557px] text-sm leading-6 text-text-secondary">
                  Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte
                  digital rara, apoie artistas e tenha uma parte da cultura da internet.
                </p>
              </div>
              <a
                href="#catalogo"
                className="flex h-10 w-[140px] items-center justify-center rounded-md bg-primary text-base leading-5 font-bold text-ink transition-colors hover:bg-primary/90"
              >
                EXPLORAR
              </a>
            </div>
            <img src="/design/hero-dots.svg" alt="" className="h-2 w-10" />
          </div>
          <div className="size-[450px] shrink-0 overflow-hidden rounded-3xl">
            <img
              src="/design/nft-ape-01.jpg"
              alt="Emerald Ape em destaque"
              className="size-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="relative overflow-hidden rounded-[30px] lg:hidden">
        <img
          src="/design/mobile-hero-mask.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full"
        />
        <div className="relative flex items-start justify-between gap-2 p-5">
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <p className="text-[10px] leading-4 font-medium tracking-[1.4px] text-foreground">
              Bem-vindo à Kurio
            </p>
            <h1 className="text-[18px] leading-7 font-bold whitespace-nowrap text-foreground">
              SEJA DONO DA <br />
              CULTURA DIGITAL
            </h1>
            <p className="max-w-[155px] text-[11px] leading-[18px] text-text-secondary">
              Descubra NFTs selecionados de criadores do mundo todo.
            </p>
            <a
              href="#catalogo"
              className="flex items-center gap-1.5 text-xs font-bold text-primary"
            >
              EXPLORAR
              <img
                src="/design/icon-arrow-right-mobile.svg"
                alt=""
                className="h-3 w-2.5 -rotate-90"
              />
            </a>
          </div>
          <div className="relative shrink-0">
            <img
              src="/design/nft-ape-01.jpg"
              alt="Emerald Ape em destaque"
              className="w-[113px] rounded-xl object-cover"
              loading="lazy"
            />
            <img
              src="/design/nft-ape-03.jpg"
              alt=""
              className="absolute -bottom-3 -left-6 w-16 rounded-lg border-2 border-ink object-cover"
              loading="lazy"
            />
          </div>
        </div>
        <img
          src="/design/mobile-hero-dots.svg"
          alt=""
          aria-hidden="true"
          className="relative mx-auto mt-4 mb-3 h-[7px] w-[33px]"
        />
      </div>
    </section>
  )
}
