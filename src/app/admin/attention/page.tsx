import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'

export default async function AdminAttentionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') redirect('/auth/login?type=admin')

  const admin = await createAdminClient()
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()

  const [
    { data: pendingInstallers },
    { data: overdueInvoices },
    { data: staleEnquiries },
  ] = await Promise.all([
    admin.from('installers').select('id, company_name, created_at').eq('status', 'pending').order('created_at', { ascending: false }),
    admin.from('fee_invoices').select('id, amount, due_at, installers(company_name)').eq('status', 'overdue').order('due_at', { ascending: true }),
    admin.from('enquiries')
      .select('id, reference, postcode, products, created_at')
      .eq('status', 'quotes_requested')
      .lt('created_at', sevenDaysAgo)
      .order('created_at', { ascending: true })
      .limit(10),
  ])

  type ActionItem = {
    category: 'action' | 'watching'
    icon: string
    iconBg: string
    iconColor: string
    title: string
    sub: string
    href: string
  }

  const actionItems: ActionItem[] = [
    ...(pendingInstallers || []).map(inst => ({
      category: 'action' as const,
      icon: '✓',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      title: `New installer application: ${inst.company_name}`,
      sub: `Applied ${new Date(inst.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} — awaiting approval`,
      href: `/admin/installers/${inst.id}`,
    })),
    ...(overdueInvoices || []).map(inv => ({
      category: 'action' as const,
      icon: '£',
      iconBg: 'bg-ws-red-bg',
      iconColor: 'text-ws-red-text',
      title: `Overdue fee ${formatCurrency(inv.amount)} — ${(inv.installers as { company_name: string } | null)?.company_name || 'Unknown'}`,
      sub: `Due ${new Date(inv.due_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
      href: '/admin/fees',
    })),
    ...(staleEnquiries || []).map(enq => ({
      category: 'watching' as const,
      icon: '◷',
      iconBg: 'bg-[#F2F6F3]',
      iconColor: 'text-ws-muted',
      title: `${enq.reference} — no quotes after ${Math.floor((Date.now() - new Date(enq.created_at).getTime()) / 86400000)} days`,
      sub: `${enq.postcode} · ${(enq.products as string[]).join(' + ')}`,
      href: '/admin/pipeline',
    })),
  ]

  const action = actionItems.filter(i => i.category === 'action')
  const watching = actionItems.filter(i => i.category === 'watching')

  return (
    <div className="min-h-screen bg-ws-body/5" style={{ background: '#E7EAE7' }}>
      <nav className="flex items-center gap-8 px-6 py-4 bg-white border-b border-ws-border">
        <span className="font-display font-extrabold text-lg tracking-tight">WattSmart</span>
        <div className="flex gap-6 text-sm text-ws-muted">
          <Link href="/admin/dashboard" className="hover:text-ws-ink">Overview</Link>
          <Link href="/admin/customers" className="hover:text-ws-ink">Customers</Link>
          <Link href="/admin/installers" className="hover:text-ws-ink">Installers</Link>
          <Link href="/admin/pipeline" className="hover:text-ws-ink">Pipeline</Link>
          <Link href="/admin/fees" className="hover:text-ws-ink">Fees</Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-baseline gap-3 mb-1">
          <h1 className="font-display font-extrabold text-2xl tracking-tight">Needs attention</h1>
          <span className="font-display font-bold text-2xl text-ws-green">{actionItems.length}</span>
        </div>
        <p className="text-sm text-ws-muted mb-6">{action.length} need action · {watching.length} watching</p>

        {action.length > 0 && (
          <>
            <p className="eyebrow mb-3">Action needed</p>
            <div className="flex flex-col gap-2 mb-5">
              {action.map((item, idx) => (
                <Link key={idx} href={item.href} className="flex items-start gap-3 bg-white border border-ws-border rounded-tile px-4 py-4 hover:shadow-sm transition-shadow">
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

        {watching.length > 0 && (
          <>
            <p className="eyebrow mb-3">Watching</p>
            <div className="flex flex-col gap-2">
              {watching.map((item, idx) => (
                <Link key={idx} href={item.href} className="flex items-start gap-3 bg-white border border-ws-border rounded-tile px-4 py-4 hover:shadow-sm transition-shadow">
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

        {actionItems.length === 0 && (
          <div className="bg-white border border-ws-border rounded-tile px-6 py-10 text-center text-ws-muted text-sm">
            Nothing needs attention right now.
          </div>
        )}
      </div>
    </div>
  )
}
