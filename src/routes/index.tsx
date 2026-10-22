import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <span className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        Desafio Frontend
      </span>
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Marketplace de NFTs
      </h1>
      <p className="max-w-xl text-base text-pretty text-muted-foreground sm:text-lg">
        Base configurada com React, TypeScript, TanStack Router, TanStack Query, Axios, Tailwind
        CSS, shadcn/ui, MSW, Socket.IO e Playwright.
      </p>
    </section>
  )
}
