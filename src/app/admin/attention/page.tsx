import Link from 'next/link'

const ITEMS = [
  {
    category: 'action',
    icon: '!',
    iconBg: 'bg-ws-red-bg',
    iconColor: 'text-ws-red-text',
    title: 'Northside NICEIC lapsed — removed from matching',
    sub: '2 in-progress customers notified',
    href: '/admin/installers',
  },
  {
    category: 'action',
    icon: '£',
    iconBg: 'bg-ws-red-bg',
    iconColor: 'text-ws-red-text',
    title: 'Brightwatt fee £450 — 21 days overdue',
    sub: '2 reminders sent · suspend & escalate',
    href: '/admin/fees',
  },
  {
    category: 'auto',
    icon: '◐',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    title: 'Deposit refund £640 pending',
    sub: 'Auto-approves in 24h unless you intervene',
    href: '#',
  },
  {
    category: 'watching',
    icon: '◷',
    iconBg: 'bg-[#F2F6F3]',
    iconColor: 'text-ws-muted',
    title: 'Greenvolt insurance expires in 10 days',
    sub: 'Reminder sent · flag rule: 14 days',
    href: '/admin/installers',
  },
]

export default function AdminAttentionPage() {
  const action = ITEMS.filter(i => i.category === 'action')
  const auto = ITEMS.filter(i => i.category === 'auto')
  const watching = ITEMS.filter(i => i.category === 'watching')

  return (
    <div className="min-h-screen bg-ws-body/5" style={{ background: '#E7EAE7' }}>
      <nav className="flex items-center gap-8 px-6 py-4 bg-white border-b border-ws-border">
        <span className="font-display font-extrabold text-lg tracking-tight">WattSmart</span>
        <div className="flex gap-6 text-sm text-ws-muted">
          <Link href="/admin/dashboard" className="hover:text-ws-body">Overview</Link>
          <Link href="/admin/customers" className="hover:text-ws-body">Customers</Link>
          <Link href="/admin/installers" className="hover:text-ws-body">Installers</Link>
          <Link href="/admin/pipeline" className="hover:text-ws-body">Pipeline</Link>
          <Link href="/admin/fees" className="hover:text-ws-body">Fees</Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-baseline gap-3 mb-1">
          <h1 className="font-display font-extrabold text-2xl tracking-tight">Needs attention</h1>
          <span className="font-display font-bold text-2xl text-ws-green">{ITEMS.length}</span>
        </div>
        <p className="text-sm text-ws-muted mb-6">{action.length} need action · {auto.length} auto-resolving · {watching.length} watching</p>

        {action.length > 0 && (
          <>
            <p className="eyebrow mb-3">Action needed</p>
            <div className="flex flex-col gap-2 mb-5">
              {action.map(item => (
                <Link key={item.title} href={item.href} className="flex items-start gap-3 bg-white border border-ws-border rounded-tile px-4 py-4 hover:shadow-sm transition-shadow">
                  <span className={`w-8 h-8 rounded-full ${item.iconBg} flex items-center justify-center text-sm font-bold ${item.iconColor} flex-shrink-0 mt-0.5`}>{item.icon}</span>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-ws-muted mt-0.5">{item.sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {auto.length > 0 && (
          <>
            <p className="eyebrow mb-3">Auto-resolving</p>
            <div className="flex flex-col gap-2 mb-5">
              {auto.map(item => (
                <div key={item.title} className="flex items-start gap-3 bg-white border border-ws-amber-border rounded-tile px-4 py-4">
                  <span className={`w-8 h-8 rounded-full ${item.iconBg} flex items-center justify-center text-sm font-bold ${item.iconColor} flex-shrink-0 mt-0.5`}>{item.icon}</span>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-ws-muted mt-0.5">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {watching.length > 0 && (
          <>
            <p className="eyebrow mb-3">Watching</p>
            <div className="flex flex-col gap-2">
              {watching.map(item => (
                <Link key={item.title} href={item.href} className="flex items-start gap-3 bg-white border border-ws-border rounded-tile px-4 py-4 hover:shadow-sm transition-shadow">
                  <span className={`w-8 h-8 rounded-full ${item.iconBg} flex items-center justify-center text-sm font-bold ${item.iconColor} flex-shrink-0 mt-0.5`}>{item.icon}</span>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-ws-muted mt-0.5">{item.sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
