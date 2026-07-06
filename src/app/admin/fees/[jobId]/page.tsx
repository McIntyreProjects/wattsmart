import Link from 'next/link'
import { redirect } from 'next/navigation'
import AdminNav from '@/components/ui/AdminNav'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'

// Fee model (mirrors /api/payments/report-final): total fee = max(5% of final
// job value, £75 floor); the deposit fee already collected at source via
// Stripe is deducted and the remainder is invoiced.
const MIN_FEE_PENCE = 7500

const INVOICE_CHIP: Record<string, string> = {
  paid:    'bg-[#F1FAF5] text-ws-dark-green border border-[#CDE6D7]',
  overdue: 'bg-ws-red-bg text-ws-red-text border border-[#ECBCB7]',
  issued:  'bg-amber-50 text-amber-700 border border-amber-200',
}

export default async function AdminFeeDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>
}) {
  const { jobId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?type=admin')

  const admin = await createAdminClient()
  const { data: { user: fullUser } } = await admin.auth.admin.getUserById(user.id)
  if (!fullUser || fullUser.app_metadata?.role !== 'admin') redirect('/auth/login?type=admin')

  const { data: job } = await admin
    .from('jobs')
    .select('id, enquiry_id, installer_id, status, created_at')
    .eq('id', jobId)
    .maybeSingle()

  if (!job) {
    return (
      <div className="min-h-screen bg-ws-bg font-body text-ws-ink">
        <AdminNav active="fees" />
        <div className="max-w-xl mx-auto px-6 py-16 text-center">
          <h1 className="font-display font-extrabold text-2xl tracking-tight mb-2">Job not found</h1>
          <p className="text-sm text-ws-muted mb-6">
            No job exists with this id — it may have been removed.
          </p>
          <Link
            href="/admin/fees"
            className="inline-block bg-ws-green text-white rounded-btn px-6 py-3 font-bold text-sm hover:bg-ws-dark-green transition-colors"
          >
            Back to fees
          </Link>
        </div>
      </div>
    )
  }

  const [
    { data: enquiry },
    { data: installer },
    { data: selectedQuote },
    { data: depositPayment },
    { data: finalPayment },
  ] = await Promise.all([
    admin.from('enquiries').select('reference, postcode, status').eq('id', job.enquiry_id).maybeSingle(),
    admin.from('installers').select('company_name, trading_name').eq('id', job.installer_id).maybeSingle(),
    admin
      .from('quotes')
      .select('total_price, deposit_amount')
      .eq('enquiry_id', job.enquiry_id)
      .eq('status', 'selected')
      .order('selected_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Only deposits whose fee was actually taken via Stripe: held or released
    admin
      .from('payments')
      .select('amount, wattsmart_fee, status, paid_at')
      .eq('enquiry_id', job.enquiry_id)
      .eq('type', 'deposit')
      .in('status', ['held', 'released'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('payments')
      .select('id, amount, wattsmart_fee, paid_at')
      .eq('enquiry_id', job.enquiry_id)
      .eq('installer_id', job.installer_id)
      .eq('type', 'final')
      .maybeSingle(),
  ])

  const { data: invoice } = finalPayment
    ? await admin
        .from('fee_invoices')
        .select('id, amount, status, due_at, paid_at, created_at')
        .eq('payment_id', finalPayment.id)
        .maybeSingle()
    : { data: null }

  const installerName = installer?.trading_name || installer?.company_name || 'Unknown installer'
  const depositFee = depositPayment?.wattsmart_fee ?? 0

  // Actual figures once the installer has reported the final value;
  // projection from the selected quote until then.
  const finalValue = finalPayment?.amount ?? selectedQuote?.total_price ?? null
  const totalFee = finalPayment
    ? finalPayment.wattsmart_fee
    : finalValue !== null
    ? Math.max(Math.round(finalValue * 0.05), MIN_FEE_PENCE)
    : null
  const remainder = totalFee !== null ? Math.max(totalFee - depositFee, 0) : null
  const isProjected = !finalPayment

  return (
    <div className="min-h-screen bg-ws-bg font-body text-ws-ink">
      <AdminNav active="fees" />

      <div className="max-w-xl mx-auto px-6 py-8">
        <Link href="/admin/fees" className="text-sm text-ws-muted hover:text-ws-ink mb-4 inline-block">← Fees</Link>

        <p className="eyebrow mb-1">Job fee</p>
        <h1 className="font-display font-extrabold text-2xl tracking-tight mb-1">
          {enquiry?.reference || 'Unknown enquiry'} · {installerName}
        </h1>
        <p className="text-sm text-ws-muted mb-5 capitalize">
          {[enquiry?.postcode, `job ${job.status.replace(/_/g, ' ')}`].filter(Boolean).join(' · ')}
        </p>

        <div className="border border-ws-amber-border bg-ws-amber-bg rounded-tile px-4 py-3 text-xs text-ws-amber-text mb-5 leading-relaxed">
          Read-only view. Final job values are reported by the installer from their dashboard,
          which creates the fee invoice automatically — this page just shows where the fee stands.
        </div>

        {/* Fee breakdown */}
        <div className="bg-white border border-ws-border rounded-tile p-5 mb-4">
          <p className="text-xs font-semibold text-ws-muted uppercase tracking-wider mb-3">
            Fee breakdown{isProjected ? ' · projected' : ''}
          </p>
          {finalValue !== null ? (
            <>
              {[
                {
                  label: finalPayment ? 'Final job value (installer-reported)' : 'Selected quote total',
                  value: formatCurrency(finalValue),
                },
                { label: 'WattSmart fee · max(5%, £75)', value: totalFee !== null ? formatCurrency(totalFee) : '—' },
                { label: 'Deposit fee already collected', value: `− ${formatCurrency(depositFee)}` },
              ].map((r) => (
                <div key={r.label} className="flex justify-between text-sm py-1.5 border-b border-[#EDF1EE]">
                  <span className="text-ws-muted">{r.label}</span>
                  <span className="font-semibold font-mono">{r.value}</span>
                </div>
              ))}
              <div className="flex justify-between items-baseline pt-3">
                <span className="text-sm font-semibold">
                  {isProjected ? 'Projected remainder to invoice' : 'Remainder invoiced'}
                </span>
                <span className="font-display font-extrabold text-2xl text-ws-green">
                  {remainder !== null ? formatCurrency(remainder) : '—'}
                </span>
              </div>
              {isProjected && (
                <p className="text-xs text-ws-muted mt-2 leading-relaxed">
                  Based on the selected quote — the actual fee is fixed when the installer reports
                  the final job value, or when the balance is paid through Stripe.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-ws-muted py-2">
              No quote has been selected for this enquiry yet, so there is no fee to calculate.
            </p>
          )}
        </div>

        {/* Deposit payment */}
        <div className="bg-white border border-ws-border rounded-tile p-5 mb-4">
          <p className="text-xs font-semibold text-ws-muted uppercase tracking-wider mb-3">Deposit payment</p>
          {depositPayment ? (
            [
              { label: 'Deposit amount', value: formatCurrency(depositPayment.amount) },
              { label: 'Fee taken at source', value: formatCurrency(depositPayment.wattsmart_fee) },
              { label: 'Status', value: depositPayment.status },
              ...(depositPayment.paid_at
                ? [{ label: 'Paid', value: new Date(depositPayment.paid_at).toLocaleDateString('en-GB') }]
                : []),
            ].map((r) => (
              <div key={r.label} className="flex justify-between text-sm py-1.5 border-b last:border-0 border-[#EDF1EE]">
                <span className="text-ws-muted">{r.label}</span>
                <span className="font-semibold capitalize">{r.value}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-ws-muted py-2">No deposit has been paid through Stripe yet.</p>
          )}
        </div>

        {/* Fee invoice */}
        <div className="bg-white border border-ws-border rounded-tile p-5 mb-5">
          <p className="text-xs font-semibold text-ws-muted uppercase tracking-wider mb-3">Fee invoice</p>
          {invoice ? (
            <>
              <div className="flex justify-between items-center text-sm py-1.5 border-b border-[#EDF1EE]">
                <span className="text-ws-muted">Amount</span>
                <span className="font-semibold font-mono text-ws-dark-green">{formatCurrency(invoice.amount)}</span>
              </div>
              <div className="flex justify-between items-center text-sm py-1.5 border-b border-[#EDF1EE]">
                <span className="text-ws-muted">Status</span>
                <span className={`text-xs rounded-lg px-2.5 py-1 font-semibold ${INVOICE_CHIP[invoice.status] || 'bg-[#F2F6F3] text-ws-muted border border-ws-border'}`}>
                  {invoice.status}
                </span>
              </div>
              <div className="flex justify-between text-sm py-1.5 border-b last:border-0 border-[#EDF1EE]">
                <span className="text-ws-muted">Due</span>
                <span className="font-semibold">{new Date(invoice.due_at).toLocaleDateString('en-GB')}</span>
              </div>
              {invoice.paid_at && (
                <div className="flex justify-between text-sm py-1.5">
                  <span className="text-ws-muted">Paid</span>
                  <span className="font-semibold">{new Date(invoice.paid_at).toLocaleDateString('en-GB')}</span>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-ws-muted py-2">
              {finalPayment
                ? 'Final value reported but no invoice found — check the fee_invoices table.'
                : 'No invoice yet — one is created when the installer reports the final job value.'}
            </p>
          )}
        </div>

        <p className="text-xs text-ws-muted leading-relaxed">
          Most fees never need attention here — 5% is taken at source through Stripe on the deposit
          and any on-platform balance. An invoice only appears when a balance is settled off-platform.
        </p>
      </div>
    </div>
  )
}
