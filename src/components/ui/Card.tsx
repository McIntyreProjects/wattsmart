import { cn } from '@/lib/utils'

export function Card({
  className,
  children,
  shadow = false,
}: {
  className?: string
  children: React.ReactNode
  shadow?: boolean
}) {
  return (
    <div
      className={cn(
        'bg-ws-card rounded-card border border-ws-border p-5',
        shadow && 'shadow-float',
        className
      )}
    >
      {children}
    </div>
  )
}

export function MetricCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="bg-white rounded-card border border-ws-border p-4">
      <div
        className="text-[22px] font-bold text-ws-ink"
        style={{ fontFamily: 'var(--font-bricolage), sans-serif', letterSpacing: '-0.02em' }}
      >
        {value}
      </div>
      <div className="text-2xs text-ws-muted uppercase tracking-wide mt-1 font-medium">{label}</div>
      {sub && <div className="text-xs text-ws-muted mt-0.5">{sub}</div>}
    </div>
  )
}
