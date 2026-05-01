import { cn } from "@/lib/utils"

export function ChakraIcon({ className, spinning }: { className?: string; spinning?: boolean }) {
  const spokes = Array.from({ length: 12 }, (_, i) => {
    const a = ((i * 30 - 90) * Math.PI) / 180
    return {
      x1: parseFloat((12 + 4.3 * Math.cos(a)).toFixed(3)),
      y1: parseFloat((12 + 4.3 * Math.sin(a)).toFixed(3)),
      x2: parseFloat((12 + 9.8 * Math.cos(a)).toFixed(3)),
      y2: parseFloat((12 + 9.8 * Math.sin(a)).toFixed(3)),
    }
  })
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn(className, spinning && "[animation:chakra-spin_10s_linear_infinite]")}
    >
      <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />
      {spokes.map((s, i) => (
        <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="currentColor" strokeWidth="0.85" />
      ))}
    </svg>
  )
}

