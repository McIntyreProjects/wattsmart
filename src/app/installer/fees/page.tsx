import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { formatCurrency } from '@/lib/utils'

export default async function InstallerFeesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?type=installer')

  // Resolve installer ID — check installer_users first, then installers.user_id
  let installerId: string | null = null

  const { data: membership } = await supabase
    .from('installer_users')
    .select('installer_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (membership) {
    installerId = membership.installer_id
  } else {
    const { data: installer } = await supabase
      .from('installers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!installer) redirect('/installer/register')
    installerId = installer.id
  }

  const { data: fees } = await supabase
    .from('fee_invoices')
    .select('id, amount, status, created_at, due_at, invoice_number')
    .eq('installer_id', installerId)
    .order('created_at', { ascending: false })

  const hasOverdue = (fees || []).some(f => f.status === 'overdue')

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-ws-bg">
      <nav className="flex items-center gap-8 px-6 py-4 bg-white border-b border-ws-border">
        <Logo />
        <div className="flex gap-6 text-sm text-ws-muted">
          <Link href="/installer/dashboard" className="hover:text-ws-ink">Dashboard</Link>
          <Link href="/installer/profile" className="hover:text-ws-ink">Profile</Link>
          <Link href="/installer/team" className="hover:text-ws-ink">Team</Link>
          <span className="text-ws-dark-green font-bold border-b-2 border-ws-green pb-1">Fees</span>
          <Link href="/installer/performance" className="hover:text-ws-ink">Performance</Link>
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-5 py-8">
        <h1 className="font-display font-extrabold text-2xl tracking-tight mb-1">Fees owed</h1>
        <p className="text-sm text-ws-muted mb-6">5% of each payment — deposit and balance. Taken at source when your customer pays through WattSmart. Only appears here when paid off-platform.</p>

        {!fees || fees.length === 0 ? (
          <div className="border border-ws-border rounded-tile bg-white p-8 text-center text-sm text-ws-muted mb-5">
            No fee invoices yet. Fees are auto-collected at source — they only appear here for off-platform payments.
          </div>
        ) : (
          <div className="border border-ws-border rounded-tile overflow-hidden mb-5">
            {fees.map((fee, i) => {
              const ref = fee.invoice_number || `#FI-${fee.id.slice(0, 6).toUpperCase()}`
              const dateLabel = fee.status === 'overdue' || fee.status === 'issued'
                ? `Due ${formatDate(fee.due_at)}`
                : formatDate(fee.created_at)
              const isPaid = fee.status === 'paid'
              return (
                <Link href={`/installer/invoices/${fee.id}`} key={fee.id} className={`flex items-center justify-between px-4 py-4 text-sm hover:bg-[#FAFBFA] transition-colors ${i < fees.length - 1 ? 'border-b border-[#EDF1EE]' : ''}`}>
                  <div>
                    <p className="font-semibold">{ref}</p>
                    <p className="text-xs text-ws-muted mt-0.5">{dateLabel}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${fee.status === 'overdue' ? 'text-ws-red-text' : isPaid ? 'text-ws-green' : 'text-ws-ink'}`}>
                      {formatCurrency(fee.amount)}
                    </p>
                    <span className={`text-xs rounded-lg px-2 py-0.5 ${
                      isPaid
                        ? 'bg-[#EAF5EE] text-ws-green-deep'
                        : fee.status === 'overdue'
                        ? 'bg-ws-red-bg text-ws-red-text'
                        : 'bg-[#F2F6F3] text-ws-muted'
                    }`}>
                      {isPaid ? 'Paid ✓' : fee.status === 'overdue' ? 'Overdue' : 'Issued'}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {hasOverdue && (
          <div className="border border-ws-red-text/20 bg-ws-red-bg rounded-tile p-4 mb-5">
            <p className="font-semibold text-ws-red-text text-sm mb-1">You have an overdue fee</p>
            <p className="text-xs text-ws-red-text leading-relaxed mb-3">
              Please contact WattSmart to arrange payment. At day 60 past due, new-job matching is suspended — as agreed in your Installer Terms.
            </p>
            <a
              href="mailto:installers@wattsmart.co.uk?subject=Fee%20payment%20enquiry"
              className="inline-block bg-ws-red-text text-white rounded-btn px-4 py-2.5 font-bold text-sm"
            >
              Contact WattSmart to pay
            </a>
          </div>
        )}

        <div className="bg-[#F2F6F3] rounded-tile p-4 text-xs text-ws-muted leading-relaxed">
          Fees are nearly always auto-collected at source through Stripe — 5% of the deposit and 5% of the balance. Only off-platform payments need manual invoicing. Minimum fee per job: £75.
        </div>
      </div>
    </div>
  )
}
