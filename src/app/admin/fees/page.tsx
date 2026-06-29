import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'

export default async function AdminFeesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') redirect('/auth/login?type=admin')

  const admin = await createAdminClient()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { data: allInvoices },
    { data: monthInvoices },
    { data: recentInvoices },
  ] = await Promise.all([
    admin.from('fee_invoices').select('amount, status'),
    admin.from('fee_invoices').select('amount, status').gte('created_at', startOfMonth),
    admin.from('fee_invoices')
      .select('id, amount, status, created_at, due_at, installers(company_name)')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const lifetimeTotal = (allInvoices || []).reduce((s, inv) => s + (inv.amount || 0), 0)
  const monthTotal = (monthInvoices || []).reduce((s, inv) => s + (inv.amount || 0), 0)
  const monthCount = (monthInvoices || []).length

  const statusStyle = (status: string) => {
    if (status === 'paid') return 'bg-[#F1FAF5] text-ws-dark-green border border-[#CDE6D7]'
    if (status === 'overdue') return 'bg-ws-red-bg text-ws-red-text border border-[#ECBCB7]'
    if (status === 'pending') return 'bg-amber-50 text-amber-700 border border-amber-200'
    return 'bg-[#F2F6F3] text-ws-muted border border-ws-border'
  }

  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink">
      <nav className="flex items-center gap-8 px-6 py-4 bg-white border-b border-ws-border">
        <span className="font-display font-extrabold text-lg tracking-tight">WattSmart</span>
        <div className="flex gap-6 text-sm text-ws-muted">
          <Link href="/admin/dashboard" className="hover:text-ws-ink">Overview</Link>
          <Link href="/admin/customers" className="hover:text-ws-ink">Customers</Link>
          <Link href="/admin/installers" className="hover:text-ws-ink">Installers</Link>
          <Link href="/admin/pipeline" className="hover:text-ws-ink">Pipeline</Link>
          <span className="text-ws-dark-green font-bold border-b-2 border-ws-green pb-1">Fees</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="font-display font-extrabold text-2xl tracking-tight mb-6">Fee income</h1>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="border border-ws-border rounded-tile p-5 bg-white">
            <p className="text-xs text-ws-subtle mb-1">This month</p>
            <p className="font-display font-extrabold text-3xl text-ws-green">{formatCurrency(monthTotal)}</p>
            <p className="text-xs text-ws-muted mt-1">{monthCount} invoice{monthCount !== 1 ? 's' : ''}</p>
          </div>
          <div className="border border-ws-border rounded-tile p-5 bg-white">
            <p className="text-xs text-ws-subtle mb-1">Lifetime total</p>
            <p className="font-display font-extrabold text-3xl text-ws-ink">{formatCurrency(lifetimeTotal)}</p>
            <p className="text-xs text-ws-muted mt-1">{(allInvoices || []).length} invoices</p>
          </div>
        </div>

        {/* Recent invoices table */}
        <p className="eyebrow mb-3">Recent invoices</p>
        <div className="border border-ws-border rounded-tile overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] bg-[#FAFBFA] border-b border-ws-border px-4 py-3 text-xs font-semibold text-ws-subtle uppercase tracking-wider">
            <span>Installer</span><span>Amount</span><span>Status</span><span>Date</span>
          </div>
          {(recentInvoices || []).map((inv, i) => {
            const installer = inv.installers as { company_name: string } | null
            return (
              <div key={inv.id} className={`grid grid-cols-[2fr_1fr_1fr_1fr] items-center px-4 py-3.5 text-sm ${i < (recentInvoices || []).length - 1 ? 'border-b border-[#EDF1EE]' : ''}`}>
                <span className="font-medium text-ws-ink">{installer?.company_name || '—'}</span>
                <span className="font-mono text-ws-dark-green font-semibold">{formatCurrency(inv.amount)}</span>
                <span className={`text-xs rounded-lg px-2.5 py-1 font-semibold inline-block w-fit ${statusStyle(inv.status)}`}>{inv.status}</span>
                <span className="text-ws-muted">{new Date(inv.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
              </div>
            )
          })}
          {(recentInvoices || []).length === 0 && (
            <div className="px-4 py-8 text-center text-ws-muted text-sm">No invoices yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}
