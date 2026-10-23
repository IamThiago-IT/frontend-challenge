import { useState } from 'react'
import { Link } from '@tanstack/react-router'

import type { NftSummary } from '@/features/catalog/contracts'

type NftCardProps = {
  nft: NftSummary
  priority?: boolean
}

export function NftCard({ nft, priority = false }: NftCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)

  return (
    <Link
      to="/nft/$nftId"
      params={{ nftId: nft.id }}
      data-testid="nft-card"
      className="group flex w-full flex-col gap-3"
    >
      <div className="relative h-[210px] w-full bg-surface-card lg:h-[300px]">
        <img
          src={nft.imageUrl}
          alt={nft.name}
          className="absolute top-[20px] left-1/2 size-[170px] -translate-x-1/2 rounded-[15px] object-cover transition-transform duration-300 group-hover:scale-[1.03] lg:top-[25px] lg:size-[250px]"
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
        />
        {nft.availability !== 'available' ? (
          <span className="absolute top-3 left-3 rounded-md bg-primary px-2 py-1 text-xs font-bold text-ink">
            {nft.availability === 'sold_out' ? 'Esgotado' : 'Indisponível'}
          </span>
        ) : null}
        {nft.featured ? (
          <span className="absolute top-3 left-3 rounded-md bg-primary px-2 py-1 text-xs font-bold text-ink lg:hidden">
            RARO
          </span>
        ) : null}
        <button
          type="button"
          aria-label={`Favoritar ${nft.name}`}
          aria-pressed={isFavorite}
          onClick={(event) => {
            event.preventDefault()
            setIsFavorite((previous) => !previous)
          }}
          className="absolute top-3 right-3 size-7 rounded-lg lg:hidden"
        >
          <img
            src={isFavorite ? '/design/mobile-card-action-2.svg' : '/design/mobile-card-action.svg'}
            alt=""
            className="size-7"
          />
        </button>
      </div>
      <p className="truncate text-base leading-4 text-foreground">{nft.name}</p>
      <p className="flex items-center gap-3">
        <span className="font-mono text-lg leading-4 font-bold text-text-accent">
          {nft.priceEth} ETH
        </span>
        {nft.availability === 'sold_out' ? (
          <span className="text-lg leading-4 text-price-old line-through">
            {(Number.parseFloat(nft.priceEth) * 1.2).toFixed(2)} ETH
          </span>
        ) : null}
      </p>
    </Link>
  )
}
