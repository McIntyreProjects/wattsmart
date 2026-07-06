import { redirect, notFound } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import PayInvoiceButton from './PayInvoiceButton'

export default async function InstallerInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ invoiceId: string }>
  searchParams: Promise<{ paid?: string }>
}) {
  const { invoiceId } = await params
  const { paid } = await searchParams

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

  // Admin client: RLS on fee_invoices only covers installers.user_id, not team
  // members via installer_users — ownership is verified explicitly below.
  const admin = await createAdminClient()
  const { data: invoice } = await admin
    .from('fee_invoices')
    .select('id, payment_id, installer_id, amount, status, due_at, paid_at, created_at, invoice_number')
    .eq('id', invoiceId)
    .maybeSingle()

  if (!invoice || invoice.installer_id !== installerId) notFound()

  // Linked payment → job/enquiry reference + fee breakdown
  let jobReference: string | null = null
  let breakdown: { totalInstall: number; totalFee: number; depositFee: number } | null = null

  if (invoice.payment_id) {
    const { data: payment } = await admin
      .from('payments')
      .select('type, amount, wattsmart_fee, enquiry_id')
      .eq('id', invoice.payment_id)
      .maybeSingle()

    if (payment) {
      if (payment.type === 'final' && payment.wattsmart_fee != null) {
        breakdown = {
          totalInstall: payment.amount,
          totalFee: payment.wattsmart_fee,
          depositFee: Math.max(payment.wattsmart_fee - invoice.amount, 0),
        }
      }
      if (payment.enquiry_id) {
        const { data: enquiry } = await admin
          .from('enquiries')
          .select('reference')
          .eq('id', payment.enquiry_id)
          .maybeSingle()
        jobReference = enquiry?.reference || null
      }
    }
  }

  const ref = invoice.invoice_number || `FI-${invoice.id.slice(0, 6).toUpperCase()}`
  const isPaid = invoice.status === 'paid'

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const statusStyle =
    invoice.status === 'paid'
      ? 'bg-[#F1FAF5] text-ws-dark-green border border-[#CDE6D7]'
      : invoice.status === 'overdue'
      ? 'bg-ws-red-bg text-ws-red-text border border-[#ECBCB7]'
      : 'bg-[#F2F6F3] text-ws-muted border border-ws-border'

  const statusLabel = isPaid ? 'Paid ✓' : invoice.status === 'overdue' ? 'Overdue' : 'Issued'

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
        <Link href="/installer/fees" className="text-sm text-ws-muted hover:text-ws-ink">← All fees</Link>

        {paid === '1' && (
          <div className="mt-4 border border-[#CDE6D7] bg-[#F1FAF5] rounded-tile p-4">
            <p className="font-semibold text-ws-dark-green text-sm mb-1">Payment received — thank you</p>
            <p className="text-xs text-ws-muted leading-relaxed">
              Status updates within a few minutes.
            </p>
          </div>
        )}

        <div className="flex items-start justify-between mt-5 mb-1">
          <h1 className="font-display font-extrabold text-2xl tracking-tight">Invoice {ref}</h1>
          <span className={`text-xs rounded-lg px-2.5 py-1 font-semibold ${statusStyle}`}>{statusLabel}</span>
        </div>
        <p className="text-sm text-ws-muted mb-6">
          WattSmart referral fee{jobReference ? <> — job <span className="font-semibold">{jobReference}</span></> : null}
        </p>

        <div className="border border-ws-border rounded-tile bg-white overflow-hidden mb-5">
          <div className="px-5 py-5 border-b border-[#EDF1EE]">
            <p className="text-xs text-ws-subtle mb-1">Amount due</p>
            <p className={`font-display font-extrabold text-3xl ${isPaid ? 'text-ws-green' : 'text-ws-ink'}`}>
              {formatCurrency(invoice.amount)}
            </p>
          </div>
          <div className="grid grid-cols-2 text-sm">
            <div className="px-5 py-4 border-b border-[#EDF1EE] border-r">
              <p className="text-xs text-ws-subtle mb-0.5">Issued</p>
              <p className="font-medium">{formatDate(invoice.created_at)}</p>
            </div>
            <div className="px-5 py-4 border-b border-[#EDF1EE]">
              <p className="text-xs text-ws-subtle mb-0.5">{isPaid ? 'Paid' : 'Due'}</p>
              <p className="font-medium">{isPaid ? formatDate(invoice.paid_at) : formatDate(invoice.due_at)}</p>
            </div>
          </div>

          {breakdown && (
            <div className="px-5 py-4 text-sm">
              <p className="text-xs font-semibold text-ws-subtle uppercase tracking-wider mb-3">Fee breakdown</p>
              <div className="flex justify-between py-1.5">
                <span className="text-ws-muted">Total installation value</span>
                <span>{formatCurrency(breakdown.totalInstall)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-ws-muted">WattSmart referral fee (5%, min £75)</span>
                <span>{formatCurrency(breakdown.totalFee)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-ws-muted">Deposit fee already collected</span>
                <span>−{formatCurrency(breakdown.depositFee)}</span>
              </div>
              <div className="flex justify-between py-2 mt-1 border-t border-ws-border font-bold text-ws-dark-green">
                <span>Amount now due</span>
                <span>{formatCurrency(invoice.amount)}</span>
              </div>
            </div>
          )}
        </div>

        {!isPaid && invoice.amount > 0 && (
          <PayInvoiceButton invoiceId={invoice.id} amountLabel={formatCurrency(invoice.amount)} />
        )}

        <div className="bg-[#F2F6F3] rounded-tile p-4 text-xs text-ws-muted leading-relaxed mt-5">
          Payment is taken securely by card through Stripe. Questions about this invoice? Contact{' '}
          <a href="mailto:installers@wattsmart.co.uk" className="underline">installers@wattsmart.co.uk</a>.
        </div>
      </div>
    </div>
  )
}
