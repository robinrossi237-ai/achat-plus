import { useEffect, useState } from "react"

interface RangeSliderProps {
  min: number
  max: number
  value: [number, number]
  onChange: (value: [number, number]) => void
  step?: number
}

export function RangeSlider({ min, max, value, onChange, step = 1000 }: RangeSliderProps) {
  const [low, setLow] = useState(value[0])
  const [high, setHigh] = useState(value[1])

  useEffect(() => {
    setLow(value[0])
    setHigh(value[1])
  }, [value[0], value[1]])

  const range = max - min || 1
  const lowPct = ((low - min) / range) * 100
  const highPct = ((high - min) / range) * 100

  const handleLow = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.min(Number(e.target.value), high - step)
    setLow(v)
  }
  const handleHigh = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(Number(e.target.value), low + step)
    setHigh(v)
  }
  const commit = () => onChange([low, high])

  return (
    <div className="w-full select-none">
      <div className="relative h-6">
        <div className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 rounded-full bg-muted" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary"
          style={{ left: `${lowPct}%`, width: `${highPct - lowPct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={low}
          onChange={handleLow}
          onMouseUp={commit}
          onTouchEnd={commit}
          aria-label="Prix minimum"
          className="range-slider-input pointer-events-none absolute top-1/2 left-0 h-1.5 w-full -translate-y-1/2 appearance-none bg-transparent"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={high}
          onChange={handleHigh}
          onMouseUp={commit}
          onTouchEnd={commit}
          aria-label="Prix maximum"
          className="range-slider-input pointer-events-none absolute top-1/2 left-0 h-1.5 w-full -translate-y-1/2 appearance-none bg-transparent"
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>{low.toLocaleString("fr-FR")} F</span>
        <span>{high.toLocaleString("fr-FR")} F</span>
      </div>
    </div>
  )
}
