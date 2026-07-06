import Link from 'next/link'
import AdminNav from '@/components/ui/AdminNav'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export default async function AdminCustomersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?type=admin')

  const admin = await createAdminClient()
  const { data: { user: fullUser } } = await admin.auth.admin.getUserById(user.id)
  if (!fullUser || fullUser.app_metadata?.role !== 'admin') redirect('/auth/login?type=admin')
  const { data: customers } = await admin
    .from('customers')
    .select('id, first_name, last_name, created_at, enquiries(id, reference, products, status)')
    .order('created_at', { ascending: false })
    .limit(50)

  const all = customers || []

  const statusLabel: Record<string, string> = {
    quotes_requested:        'Awaiting quotes',
    quotes_received:         'Quotes ready',
    client_deciding:         'Comparing quotes',
    installer_chosen:        'Installer chosen',
    deposit_paid:            'Deposit held',
    installation_confirmed:  'Booked',
    complete:                'Complete',
    cancelled:               'Cancelled',
  }

  const statusStyle = (status: string) => {
    if (status === 'complete') return 'bg-[#F1FAF5] text-ws-dark-green border border-[#CDE6D7]'
    if (status === 'deposit_paid' || status === 'installer_chosen') return 'bg-[#F1FAF5] text-ws-dark-green border border-[#CDE6D7]'
    if (status === 'quotes_received' || status === 'client_deciding') return 'bg-amber-50 text-amber-700 border border-amber-200'
    return 'bg-[#F2F6F3] text-ws-muted border border-ws-border'
  }

  return (
    <div className="min-h-screen bg-ws-bg font-body text-ws-ink">
      <AdminNav active="customers" />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-5">
          <h1 className="font-display font-extrabold text-2xl tracking-tight">Customer accounts</h1>
          <span className="text-sm text-ws-muted">{all.length} total</span>
        </div>

        <div className="border border-ws-border rounded-tile overflow-x-auto">
          <div className="grid min-w-[640px] grid-cols-[1.6fr_1.2fr_.85fr_1.1fr_.5fr] bg-[#FAFBFA] border-b border-ws-border px-5 py-3 text-xs font-semibold text-ws-subtle uppercase tracking-wider">
            <span>Customer</span><span>Status</span><span>Joined</span><span>Enquiries</span><span></span>
          </div>
          {all.map((c, i) => {
            const enqs = (c.enquiries as Array<{ id: string; reference: string; products: string[]; status: string }>) || []
            const latest = enqs[0]
            const name = `${c.first_name} ${c.last_name}`
            return (
              <div key={c.id} className={`grid min-w-[640px] grid-cols-[1.6fr_1.2fr_.85fr_1.1fr_.5fr] items-center px-5 py-4 text-sm ${i < all.length - 1 ? 'border-b border-[#EDF1EE]' : ''}`}>
                <div>
                  <p className="font-bold">{name}</p>
                  {latest && <p className="text-xs text-ws-subtle mt-0.5">{latest.reference} · {(latest.products as string[]).join(' + ')}</p>}
                </div>
                {latest ? (
                  <span className={`text-xs rounded-lg px-2.5 py-1 font-semibold inline-block w-fit ${statusStyle(latest.status)}`}>
                    {statusLabel[latest.status] || latest.status}
                  </span>
                ) : (
                  <span className="text-xs text-ws-muted">No enquiries</span>
                )}
                <span className="text-ws-muted whitespace-nowrap">{new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                <span className="text-ws-muted">{enqs.length} {enqs.length === 1 ? 'enquiry' : 'enquiries'}</span>
                <Link href={`/admin/customers/${c.id}`} className="text-ws-dark-green font-semibold text-sm">View</Link>
              </div>
            )
          })}
          {all.length === 0 && (
            <div className="px-5 py-8 text-center text-ws-muted text-sm">No customers found.</div>
          )}
        </div>
        <p className="text-xs text-ws-muted mt-3 leading-relaxed">
          Open an account to view detail, resend access, process a refund, or <strong>erase the account &amp; all data (GDPR)</strong>. Completed accounts auto-anonymise 12 months after install.
        </p>
      </div>
    </div>
  )
}
