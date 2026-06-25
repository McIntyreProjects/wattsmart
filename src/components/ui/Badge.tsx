import { cn } from '@/lib/utils'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const variants: Record<BadgeVariant, string> = {
  success: 'bg-ws-green-tint text-ws-green-deep border border-ws-green-tint',
  warning: 'bg-ws-amber-bg text-ws-amber-text border border-ws-amber-border',
  danger:  'bg-ws-red-bg text-ws-red-text border border-red-200',
  info:    'bg-blue-50 text-blue-700 border border-blue-100',
  neutral: 'bg-ws-green-tint2 text-ws-muted border border-ws-border',
}

export function Badge({
  variant = 'neutral',
  children,
  className,
}: {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-semibold',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export function CertStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    verified: 'success',
    pending:  'warning',
    failed:   'danger',
    expired:  'danger',
  }
  const labels: Record<string, string> = {
    verified: 'Verified ✓',
    pending:  'Pending',
    failed:   'Failed',
    expired:  'Lapsed',
  }
  return <Badge variant={map[status] ?? 'neutral'}>{labels[status] ?? status}</Badge>
}

export function ProductTag({ product }: { product: string }) {
  const labels: Record<string, string> = {
    solar:    'Solar',
    battery:  'Battery',
    heatpump: 'Heat pump',
    ev:       'EV charger',
  }
  return (
    <span
      className={`tag-${product} inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-semibold`}
    >
      {labels[product] ?? product}
    </span>
  )
}
