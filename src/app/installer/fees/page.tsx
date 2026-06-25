import Link from 'next/link'

const FEES = [
  { ref: '#WS-2031', product: 'Solar · Priya K.', amount: 412, status: 'paid', date: '14 Jun 2026' },
  { ref: '#WS-1987', product: 'Heat pump', amount: 450, status: 'overdue', date: 'Due 15 Aug 2026' },
]

export default function InstallerFeesPage() {
  return (
    <div className="min-h-screen" style={{ background: '#E7EAE7' }}>
      <nav className="bg-white border-b border-[#E4EAE6] px-6 py-4 flex items-center gap-6">
        <span className="font-display font-extrabold text-lg tracking-tight">WattSmart</span>
        <div className="flex gap-5 text-sm text-ws-muted">
          <Link href="/installer/dashboard" className="hover:text-ws-body">Dashboard</Link>
          <Link href="/installer/profile" className="hover:text-ws-body">Profile</Link>
          <Link href="/installer/performance" className="hover:text-ws-body">Performance</Link>
          <span className="text-ws-green-deep font-bold border-b-2 border-ws-green pb-1">Fees</span>
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-5 py-8">
        <h1 className="font-display font-extrabold text-2xl tracking-tight mb-1">Fees owed</h1>
        <p className="text-sm text-ws-muted mb-6">5% of each payment — deposit and balance. Taken at source when your customer pays through WattSmart. Only appears here when paid off-platform.</p>

        <div className="border border-ws-border rounded-tile overflow-hidden mb-5">
          {FEES.map((fee, i) => (
            <div key={fee.ref} className={`flex items-center justify-between px-4 py-4 text-sm ${i < FEES.length - 1 ? 'border-b border-[#EDF1EE]' : ''}`}>
              <div>
                <p className="font-semibold">{fee.ref} · {fee.product}</p>
                <p className="text-xs text-ws-muted mt-0.5">{fee.date}</p>
              </div>
              <div className="text-right">
                <p className={`font-bold ${fee.status === 'overdue' ? 'text-ws-red-text' : 'text-ws-green'}`}>£{fee.amount}</p>
                <span className={`text-xs rounded-lg px-2 py-0.5 ${
                  fee.status === 'paid' ? 'bg-[#EAF5EE] text-ws-green-deep' : 'bg-ws-red-bg text-ws-red-text'
                }`}>{fee.status === 'paid' ? 'Paid ✓' : 'Overdue'}</span>
              </div>
            </div>
          ))}
        </div>

        {FEES.some(f => f.status === 'overdue') && (
          <div className="border border-ws-red-text/20 bg-ws-red-bg rounded-tile p-4 mb-5">
            <p className="font-semibold text-ws-red-text text-sm mb-1">You have an overdue fee</p>
            <p className="text-xs text-ws-red-text leading-relaxed mb-3">
              Invoice #F-1987 · £450 · due 15 Aug 2026. Day 30 reminders have been sent. At day 45 a final notice is issued; at day 60 new-job matching is suspended — as agreed in your Installer Terms.
            </p>
            <button className="bg-ws-red-text text-white rounded-btn px-4 py-2.5 font-bold text-sm">
              Pay £450 now
            </button>
          </div>
        )}

        <div className="bg-[#F2F6F3] rounded-tile p-4 text-xs text-ws-muted leading-relaxed">
          Fees are nearly always auto-collected at source through Stripe — 5% of the deposit and 5% of the balance. Only off-platform payments need manual invoicing. Minimum fee per job: £75.
        </div>
      </div>
    </div>
  )
}
