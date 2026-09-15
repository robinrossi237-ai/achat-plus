import { useEffect, useState } from "react"

function pad(n: number) {
  return String(n).padStart(2, "0")
}

export default function CountdownTimer({ endDate }: { endDate?: string | null }) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!endDate) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [endDate])

  if (!endDate) return null

  const target = new Date(`${endDate}T23:59:59`).getTime()
  const delta = Math.max(0, target - now)
  if (delta <= 0) return null

  const days = Math.floor(delta / 86400000)
  const hours = Math.floor(delta / 3600000) % 24
  const minutes = Math.floor(delta / 60000) % 60
  const seconds = Math.floor(delta / 1000) % 60

  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive tabular-nums">
      <span className="text-muted-foreground font-normal">Se termine dans</span>
      {days > 0 && <span>{days}j</span>}
      <span>{pad(hours)}</span>:<span>{pad(minutes)}</span>:<span>{pad(seconds)}</span>
    </span>
  )
}
