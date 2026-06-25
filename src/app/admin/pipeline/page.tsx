import Link from 'next/link'

const columns = [
  {
    label: 'Quoting', count: 41,
    cards: [
      { title: 'Solar · DH1', sub: '2/3 quotes in', amber: false },
      { title: 'Heat pump · YO24', sub: '1 quote · auto-sent to 2 more', amber: true },
    ],
    more: 39,
  },
  {
    label: 'Chosen', count: 18,
    cards: [
      { title: 'Battery · NE12', sub: 'deposit held', amber: false },
      { title: 'EV · NE3', sub: 'deposit held', amber: false },
    ],
    more: 16,
  },
  {
    label: 'Booked', count: 12,
    cards: [
      { title: 'Solar · DL3', sub: 'fit 24 Jun', amber: false },
    ],
    more: 11,
  },
  {
    label: 'Done', count: 26,
    cards: [
      { title: 'Solar · SR2', sub: 'fee £412 ✓', done: true },
    ],
    more: 25,
  },
]

export default function AdminPipelinePage() {
  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink">
      <nav className="flex items-center gap-8 px-6 py-4 bg-white border-b border-ws-border">
        <span className="font-display font-extrabold text-lg tracking-tight">WattSmart</span>
        <div className="flex gap-6 text-sm text-ws-muted">
          <Link href="/admin/dashboard" className="hover:text-ws-ink">Overview</Link>
          <Link href="/admin/customers" className="hover:text-ws-ink">Customers</Link>
          <Link href="/admin/installers" className="hover:text-ws-ink">Installers</Link>
          <span className="text-ws-dark-green font-bold border-b-2 border-ws-green pb-1">Pipeline</span>
          <Link href="/admin/fees" className="hover:text-ws-ink">Fees</Link>
        </div>
      </nav>

      <div className="px-6 py-8">
        <h1 className="font-display font-extrabold text-2xl tracking-tight mb-6">Job pipeline</h1>

        <div className="grid grid-cols-4 gap-4">
          {columns.map((col) => (
            <div key={col.label}>
              <p className="eyebrow mb-3">{col.label} · {col.count}</p>
              <div className="flex flex-col gap-2">
                {col.cards.map((card) => (
                  <div key={card.title} className={`border rounded-xl p-3 text-sm cursor-pointer hover:shadow-sm transition-shadow ${
                    card.amber ? 'border-amber-200 bg-amber-50' :
                    (card as any).done ? 'border-[#CDE6D7] bg-[#F1FAF5]' :
                    'border-ws-border bg-white'
                  }`}>
                    <p className="font-semibold text-sm">{card.title}</p>
                    <p className={`text-xs mt-1 ${card.amber ? 'text-amber-700' : (card as any).done ? 'text-ws-dark-green' : 'text-ws-dark-green'}`}>{card.sub}</p>
                  </div>
                ))}
                <div className="border border-dashed border-ws-border rounded-xl p-3 text-xs text-ws-subtle">
                  + {col.more} more
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-ws-muted mt-6 leading-relaxed max-w-2xl">
          Read-only board. Amber = one quote received, auto-sent to more installers (nothing to action). Click a card to see the full job.
        </p>
      </div>
    </div>
  )
}
