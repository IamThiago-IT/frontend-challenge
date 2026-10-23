import { useState } from 'react'

const PRICE_MIN = 0
const PRICE_MAX = 20
const PRICE_STEP = 0.01

function formatEth(value: number) {
  return value.toFixed(2).replace('.', ',')
}

type PriceRangeSliderProps = {
  minValue?: string
  maxValue?: string
  onApply: (minPrice?: string, maxPrice?: string) => void
}

export function PriceRangeSlider({ minValue, maxValue, onApply }: PriceRangeSliderProps) {
  const [min, setMin] = useState(() =>
    minValue ? Math.min(Number.parseFloat(minValue), PRICE_MAX) : PRICE_MIN,
  )
  const [max, setMax] = useState(() =>
    maxValue ? Math.max(Number.parseFloat(maxValue), PRICE_MIN) : PRICE_MAX,
  )

  const minPercent = ((min - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100
  const maxPercent = ((max - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100

  return (
    <div className="flex flex-col gap-3 pl-3">
      <div className="relative h-5 w-full">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary/25"
        />
        <div
          aria-hidden="true"
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary"
          style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
        />
        <span
          aria-hidden="true"
          className="absolute top-1/2 size-[15px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-ink bg-primary"
          style={{ left: `${minPercent}%` }}
        />
        <span
          aria-hidden="true"
          className="absolute top-1/2 size-[15px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-ink bg-primary"
          style={{ left: `${maxPercent}%` }}
        />
        <input
          type="range"
          aria-label="Preço mínimo"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={min}
          onChange={(event) => {
            const next = Math.min(Number(event.target.value), max - PRICE_STEP)
            setMin(Math.max(next, PRICE_MIN))
          }}
          className="pointer-events-none absolute inset-x-0 top-0 h-5 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-[15px] [&::-webkit-slider-thumb]:appearance-none"
        />
        <input
          type="range"
          aria-label="Preço máximo"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={max}
          onChange={(event) => {
            const next = Math.max(Number(event.target.value), min + PRICE_STEP)
            setMax(Math.min(next, PRICE_MAX))
          }}
          className="pointer-events-none absolute inset-x-0 top-0 h-5 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-[15px] [&::-webkit-slider-thumb]:appearance-none"
        />
      </div>
      <p className="text-sm text-foreground">
        Preço: {formatEth(min)} - {formatEth(max)} ETH
      </p>
      <button
        type="button"
        onClick={() =>
          onApply(
            min > PRICE_MIN ? min.toFixed(2) : undefined,
            max < PRICE_MAX ? max.toFixed(2) : undefined,
          )
        }
        className="flex h-9 w-fit items-center justify-center rounded-md bg-primary px-3 text-base leading-5 font-bold text-ink transition-colors hover:bg-primary/90"
      >
        Aplicar
      </button>
    </div>
  )
}
