import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Logo } from '@/components/ui/Logo'
import { MetricCard } from '@/components/ui/Card'
import { ProductTag } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import { AdminActions } from '@/components/dashboard/AdminActions'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') redirect('/auth/login?type=admin')

  const admin = await createAdminClient()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 86400000).toISOString()

  const [
    { count: activeEnquiries },
    { count: verifiedInstallers },
    feesData,
    pipelineData,
    { data: recentEnquiries },
    { data: pendingInstallers },
    { data: expiringCerts },
    { data: overdueFees },
    { data: installersList },
  ] = await Promise.all([
    admin.from('enquiries').select('*', { count: 'exact', head: true }).not('status', 'in', '(complete,cancelled)'),
    admin.from('installers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('payments').select('wattsmart_fee').eq('status', 'released').gte('released_at', startOfMonth),
    admin.from('quotes').select('total_price').eq('status', 'submitted'),
    admin.from('enquiries').select('id, reference, postcode, products, status, created_at').order('created_at', { ascending: false }).limit(10),
    admin.from('installers').select('id, company_name, contact_email, products, created_at, coverage_postcodes').eq('status', 'pending'),
    admin.from('certifications').select('id, installer_id, type, expires_at, status, installers(company_name, contact_email)').lte('expires_at', thirtyDaysFromNow).eq('status', 'verified'),
    admin.from('fee_invoices').select('id, amount, due_at, installer_id, installers(company_name)').eq('status', 'overdue'),
    admin.from('installers').select('id, company_name, products, coverage_postcodes, status, approved_at').order('created_at', { ascending: false }),
  ])

  const totalFees = (feesData.data || []).reduce((s: number, p: { wattsmart_fee: number }) => s + p.wattsmart_fee, 0)
  const pipeline = (pipelineData.data || []).reduce((s: number, q: { total_price: number }) => s + q.total_price, 0)

  const statusLabel: Record<string, string> = {
    quotes_requested:       'Awaiting quotes',
    quotes_received:        'Quotes ready',
    installer_chosen:       'Installer chosen',
    deposit_paid:           'Deposit paid',
    installation_confirmed: 'Confirmed',
    complete:               'Complete',
    cancelled:              'Cancelled',
  }

  const alerts = [
    ...(pendingInstallers || []).map(i => ({
      type: 'info' as const,
      message: `New installer application: ${i.company_name}`,
      id: i.id,
      action: 'installer',
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(expiringCerts || []).map((c: any) => ({
      type: 'warning' as const,
      message: `${(Array.isArray(c.installers) ? c.installers[0] : c.installers)?.company_name} — ${c.type.toUpperCase()} expires ${new Date(c.expires_at).toLocaleDateString('en-GB')}`,
      id: c.id,
      action: null,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(overdueFees || []).map((f: any) => ({
      type: 'danger' as const,
      message: `Overdue fee: ${(Array.isArray(f.installers) ? f.installers[0] : f.installers)?.company_name} — ${formatCurrency(f.amount)}`,
      id: f.id,
      action: null,
    })),
  ]

  const alertStyle = {
    info:    { bg: 'var(--ws-green-tint)',  border: 'rgba(21,160,90,0.2)', text: '#0E7A43' },
    warning: { bg: 'var(--ws-amber-bg)',    border: 'var(--ws-amber-border)', text: 'var(--ws-amber-text)' },
    danger:  { bg: 'var(--ws-red-bg)',      border: '#ECBCB7', text: 'var(--ws-red-text)' },
  }

  return (
    <div className="min-h-screen" style={{ background: '#E7EAE7' }}>
      <nav className="bg-ws-card border-b border-ws-border">
        <div className="max-w-content mx-auto px-5 py-4 flex items-center justify-between">
          <Logo />
          <span className="text-xs text-ws-muted font-semibold uppercase tracking-wider">Admin</span>
        </div>
      </nav>

      <main className="max-w-content mx-auto px-5 py-10">
        <p className="eyebrow mb-2">Platform overview</p>
        <h1
          className="text-3xl font-bold text-ws-ink mb-1"
          style={{ fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.02em' }}
        >
          Admin dashboard
        </h1>
        <p className="text-ws-muted mb-8">Live metrics and action items.</p>

        <div className="grid grid-cols-2 gap-3 mb-10">
          <MetricCard label="Active enquiries"  value={activeEnquiries || 0} />
          <MetricCard label="Verified installers" value={verifiedInstallers || 0} />
          <MetricCard label="Fees this month"   value={formatCurrency(totalFees)} />
          <MetricCard label="Pipeline value"    value={formatCurrency(pipeline)} />
        </div>

        {alerts.length > 0 && (
          <div className="mb-10">
            <h2 className="font-semibold text-ws-ink mb-3">Alerts</h2>
            <div className="space-y-2">
              {alerts.map((alert, i) => {
                const s = alertStyle[alert.type]
                return (
                  <div
                    key={i}
                    className="rounded-card px-4 py-3 flex items-center justify-between text-sm font-medium"
                    style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}
                  >
                    <span>{alert.message}</span>
                    {alert.action === 'installer' && <AdminActions installerId={alert.id} />}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="mb-10">
          <h2 className="font-semibold text-ws-ink mb-4">Recent enquiries</h2>
          <div className="bg-ws-card rounded-card border border-ws-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ws-border">
                  <th className="text-left px-4 py-3 text-xs text-ws-muted font-semibold">Ref</th>
                  <th className="text-left px-4 py-3 text-xs text-ws-muted font-semibold">Postcode</th>
                  <th className="text-left px-4 py-3 text-xs text-ws-muted font-semibold">Products</th>
                  <th className="text-left px-4 py-3 text-xs text-ws-muted font-semibold">Status</th>
                  <th className="text-left px-4 py-3 text-xs text-ws-muted font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {(recentEnquiries || []).map((enq, i) => (
                  <tr key={enq.id} className={i > 0 ? 'border-t border-ws-border' : ''}>
                    <td className="px-4 py-3 font-semibold text-ws-ink">{enq.reference}</td>
                    <td className="px-4 py-3 text-ws-muted">{enq.postcode}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(enq.products as string[]).map(p => <ProductTag key={p} product={p} />)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ws-muted">{statusLabel[enq.status] || enq.status}</td>
                    <td className="px-4 py-3 text-ws-muted">{new Date(enq.created_at).toLocaleDateString('en-GB')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-ws-ink mb-4">Installers</h2>
          <div className="bg-ws-card rounded-card border border-ws-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ws-border">
                  <th className="text-left px-4 py-3 text-xs text-ws-muted font-semibold">Company</th>
                  <th className="text-left px-4 py-3 text-xs text-ws-muted font-semibold">Products</th>
                  <th className="text-left px-4 py-3 text-xs text-ws-muted font-semibold">Coverage</th>
                  <th className="text-left px-4 py-3 text-xs text-ws-muted font-semibold">Status</th>
                  <th className="text-left px-4 py-3 text-xs text-ws-muted font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(installersList || []).map((inst, i) => (
                  <tr key={inst.id} className={i > 0 ? 'border-t border-ws-border' : ''}>
                    <td className="px-4 py-3 font-semibold text-ws-ink">{inst.company_name}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(inst.products as string[]).slice(0, 2).map(p => <ProductTag key={p} product={p} />)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ws-muted text-xs">{(inst.coverage_postcodes as string[]).join(', ')}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-semibold border ${
                        inst.status === 'active'  ? 'bg-ws-green-tint text-ws-green-deep border-ws-green/20' :
                        inst.status === 'pending' ? 'bg-ws-amber-bg text-ws-amber-text border-ws-amber-border' :
                        'bg-ws-card text-ws-muted border-ws-border'
                      }`}>{inst.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {inst.status === 'pending' && <AdminActions installerId={inst.id} compact />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
