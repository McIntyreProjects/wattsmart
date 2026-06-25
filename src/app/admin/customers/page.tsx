import Link from 'next/link'

const customers = [
  { name: 'Sarah Mills', ref: '#WS-2041', product: 'solar + battery', status: 'Comparing quotes', statusStyle: 'bg-amber-50 text-amber-700 border border-amber-200', joined: '12 Jun', deposit: '—' },
  { name: 'James Okafor', ref: '#WS-2038', product: 'heat pump', status: 'Deposit held', statusStyle: 'bg-[#F1FAF5] text-ws-dark-green border border-[#CDE6D7]', joined: '9 Jun', deposit: '£250 held' },
  { name: 'Priya Kaur', ref: '#WS-2031', product: 'solar', status: 'Booked · fit 24 Jun', statusStyle: 'bg-[#F1FAF5] text-ws-dark-green border border-[#CDE6D7]', joined: '2 Jun', deposit: '£250 released' },
  { name: 'Tom Bayliss', ref: '#WS-2025', product: 'EV charger', status: 'Refunded', statusStyle: 'bg-[#F2F6F3] text-ws-muted border border-ws-border', joined: '28 May', deposit: '£250 refunded' },
  { name: 'Aisha Noor', ref: '#WS-2019', product: 'solar + battery', status: 'Enquiry sent', statusStyle: 'bg-[#F2F6F3] text-ws-muted border border-ws-border', joined: '21 May', deposit: '—' },
]

export default function AdminCustomersPage() {
  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink">
      <nav className="flex items-center gap-8 px-6 py-4 bg-white border-b border-ws-border">
        <span className="font-display font-extrabold text-lg tracking-tight">WattSmart</span>
        <div className="flex gap-6 text-sm text-ws-muted">
          <Link href="/admin/dashboard" className="hover:text-ws-ink">Overview</Link>
          <span className="text-ws-dark-green font-bold border-b-2 border-ws-green pb-1">Customers</span>
          <Link href="/admin/installers" className="hover:text-ws-ink">Installers</Link>
          <Link href="/admin/pipeline" className="hover:text-ws-ink">Pipeline</Link>
          <Link href="/admin/fees" className="hover:text-ws-ink">Fees</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-5">
          <h1 className="font-display font-extrabold text-2xl tracking-tight">Customer accounts</h1>
          <div className="border border-ws-border rounded-lg px-4 py-2.5 text-sm text-ws-subtle">
            🔍 Search name, email or #ref…
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {[
            { label: 'All · 214', active: true },
            { label: 'Comparing · 18' },
            { label: 'Deposit held · 12' },
            { label: 'Completed · 26' },
          ].map((tab) => (
            <button key={tab.label} className={`rounded-lg px-3 py-1.5 text-sm whitespace-nowrap ${
              tab.active ? 'border-2 border-ws-green bg-[#F1FAF5] text-ws-dark-green font-bold' : 'border border-ws-border text-ws-muted'
            }`}>{tab.label}</button>
          ))}
        </div>

        {/* Table */}
        <div className="border border-ws-border rounded-tile overflow-hidden">
          <div className="grid grid-cols-[1.6fr_1.2fr_.85fr_1.1fr_.5fr] bg-[#FAFBFA] border-b border-ws-border px-5 py-3 text-xs font-semibold text-ws-subtle uppercase tracking-wider">
            <span>Customer</span><span>Status</span><span>Joined</span><span>Deposit</span><span></span>
          </div>
          {customers.map((c, i) => (
            <div key={c.ref} className={`grid grid-cols-[1.6fr_1.2fr_.85fr_1.1fr_.5fr] items-center px-5 py-4 text-sm ${i < customers.length - 1 ? 'border-b border-[#EDF1EE]' : ''}`}>
              <div>
                <p className="font-bold">{c.name}</p>
                <p className="text-xs text-ws-subtle mt-0.5">{c.ref} · {c.product}</p>
              </div>
              <span className={`text-xs rounded-lg px-2.5 py-1 font-semibold inline-block w-fit ${c.statusStyle}`}>{c.status}</span>
              <span className="text-ws-muted whitespace-nowrap">{c.joined}</span>
              <span className={c.deposit === '—' ? 'text-ws-subtle' : 'text-ws-ink'}>{c.deposit}</span>
              <Link href="#" className="text-ws-dark-green font-semibold text-sm">View</Link>
            </div>
          ))}
        </div>
        <p className="text-xs text-ws-muted mt-3 leading-relaxed">
          Open an account to view detail, resend access, process a refund, or <strong>erase the account &amp; all data (GDPR)</strong>. Completed accounts auto-anonymise 12 months after install.
        </p>
      </div>
    </div>
  )
}
