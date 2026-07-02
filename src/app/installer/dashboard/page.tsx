import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Logo } from '@/components/ui/Logo'
import { MetricCard } from '@/components/ui/Card'
import { Badge, ProductTag } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export default async function InstallerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?type=installer')

  // Resolve installer: team members have a row in installer_users but not in installers,
  // so check installer_users first, then fall back to installers.user_id (primary owner).
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
    const { data: ownerRow } = await supabase
      .from('installers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!ownerRow) redirect('/installer/register')
    installerId = ownerRow!.id
  }

  const { data: installer } = await supabase
    .from('installers')
    .select('id, company_name, status')
    .eq('id', installerId)
    .single()

  if (!installer) redirect('/installer/register')

  const { data: jobs } = await supabase
    .from('jobs')
    .select(`
      id, status, brief_sent_at, quote_deadline_at,
      enquiries (reference, products, property_type, property_age, monthly_elec_kwh, goal),
      quotes (id, total_price, status)
    `)
    .eq('installer_id', installer.id)
    .order('brief_sent_at', { ascending: false })

  const { data: fees } = await supabase
    .from('fee_invoices')
    .select('amount, status')
    .eq('installer_id', installer.id)
    .eq('status', 'issued')

  const metrics = {
    newBriefs:   (jobs || []).filter(j => j.status === 'brief_sent').length,
    quotePending: (jobs || []).filter(j => j.status === 'quote_submitted').length,
    inProgress:  (jobs || []).filter(j => ['quote_selected', 'revealed', 'installation_confirmed'].includes(j.status)).length,
    feesDue:     (fees || []).reduce((s, f) => s + f.amount, 0),
  }

  const statusLabel: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'neutral' }> = {
    brief_sent:             { label: 'Quote needed',      variant: 'warning' },
    quote_submitted:        { label: 'Quoted',            variant: 'info' },
    quote_selected:         { label: 'Selected',          variant: 'success' },
    revealed:               { label: 'Revealed',          variant: 'success' },
    survey_booked:          { label: 'Survey booked',     variant: 'success' },
    installation_confirmed: { label: 'Install confirmed', variant: 'success' },
    complete:               { label: 'Complete',          variant: 'neutral' },
    withdrawn:              { label: 'Withdrawn',         variant: 'neutral' },
  }

  if (installer.status === 'rejected') {
    return (
      <div className="min-h-screen bg-ws-bg">
        <nav className="bg-ws-card border-b border-ws-border">
          <div className="max-w-content mx-auto px-5 py-4"><Logo /></div>
        </nav>
        <div className="max-w-content mx-auto px-5 py-20 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-6" style={{ background: '#FEE2E2' }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1
            className="text-2xl font-bold text-ws-ink mb-3 font-display tracking-tight"
          >
            Application unsuccessful.
          </h1>
          <p className="text-ws-muted text-sm leading-relaxed max-w-xs mx-auto mb-4">
            Unfortunately we were unable to approve your installer application at this time.
          </p>
          <p className="text-ws-muted text-sm leading-relaxed max-w-xs mx-auto">
            If you believe this is an error or your circumstances have changed, please contact{' '}
            <a href="mailto:hello@wattsmart.co.uk" className="text-ws-green hover:underline">hello@wattsmart.co.uk</a>.
          </p>
        </div>
      </div>
    )
  }

  if (installer.status === 'pending') {
    return (
      <div className="min-h-screen bg-ws-bg">
        <nav className="bg-ws-card border-b border-ws-border">
          <div className="max-w-content mx-auto px-5 py-4"><Logo /></div>
        </nav>
        <div className="max-w-content mx-auto px-5 py-20 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-6" style={{ background: '#EAF5EE' }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#15A05A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1
            className="text-2xl font-bold text-ws-ink mb-3 font-display tracking-tight"
          >
            Application under review.
          </h1>
          <p className="text-ws-muted text-sm leading-relaxed max-w-xs mx-auto">
            We&apos;ll email you once your account has been approved — usually within 48 hours.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ws-bg">
      <nav className="flex items-center gap-8 px-6 py-4 bg-white border-b border-ws-border">
        <Logo />
        <div className="flex gap-6 text-sm text-ws-muted">
          <span className="text-ws-dark-green font-bold border-b-2 border-ws-green pb-1">Dashboard</span>
          <Link href="/installer/profile" className="hover:text-ws-ink">Profile</Link>
          <Link href="/installer/team" className="hover:text-ws-ink">Team</Link>
          <Link href="/installer/fees" className="hover:text-ws-ink">Fees</Link>
          <Link href="/installer/performance" className="hover:text-ws-ink">Performance</Link>
        </div>
      </nav>

      <main className="max-w-content mx-auto px-5 py-10">
        <p className="eyebrow mb-2">Installer portal</p>
        <h1
          className="text-3xl font-bold text-ws-ink mb-1 font-display tracking-tight"
        >
          Dashboard
        </h1>
        <p className="text-ws-muted mb-8">Your jobs and quotes at a glance.</p>

        <div className="grid grid-cols-2 gap-3 mb-10">
          <MetricCard label="New job briefs" value={metrics.newBriefs} />
          <MetricCard label="Quotes pending" value={metrics.quotePending} />
          <MetricCard label="Jobs in progress" value={metrics.inProgress} />
          <MetricCard label="Fees due" value={formatCurrency(metrics.feesDue)} />
        </div>

        <h2 className="font-semibold text-ws-ink mb-4">Job briefs</h2>

        {!jobs?.length ? (
          <div className="bg-ws-card rounded-card border border-ws-border p-8 text-center text-sm text-ws-muted">
            No job briefs yet. They&apos;ll appear here when a customer match is found in your area.
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map(job => {
              const enq = (Array.isArray(job.enquiries) ? job.enquiries[0] : job.enquiries) as { reference: string; products: string[]; property_type: string; property_age: string; monthly_elec_kwh: number; goal: string } | null
              const st = statusLabel[job.status] || { label: job.status, variant: 'neutral' as const }
              const deadlinePast = new Date(job.quote_deadline_at) < new Date()
              return (
                <div key={job.id} className="bg-ws-card rounded-card border border-ws-border p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-ws-ink text-[15px]">{enq?.reference || job.id.slice(0, 8)}</div>
                      <div className="text-xs text-ws-muted mt-0.5">{enq?.property_type}, {enq?.property_age}</div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(enq?.products || []).map((p: string) => <ProductTag key={p} product={p} />)}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <Badge variant={st.variant}>{st.label}</Badge>
                      {job.status === 'brief_sent' && !deadlinePast && (
                        <div className="mt-2">
                          <Link href={`/installer/jobs/${job.id}`} className="text-sm font-semibold text-ws-green hover:text-ws-green-deep">
                            Submit quote →
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  {enq && (
                    <div className="mt-3 pt-3 border-t border-ws-border grid grid-cols-2 gap-2 text-xs text-ws-muted">
                      <div>Usage: ~{enq.monthly_elec_kwh} kWh/month</div>
                      <div>Goal: {enq.goal === 'export' ? 'Cover & earn' : 'Cover use'}</div>
                    </div>
                  )}

                  {job.status === 'brief_sent' && (
                    <div className="mt-2 text-xs text-ws-muted">
                      Deadline: {new Date(job.quote_deadline_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      {deadlinePast && <span className="text-ws-red-text ml-1">(expired)</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
