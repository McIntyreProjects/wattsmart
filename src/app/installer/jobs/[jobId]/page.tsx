import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { QuoteSubmitForm } from '@/components/forms/QuoteSubmitForm'
import { JobCompleteForm } from '@/components/forms/JobCompleteForm'
import { Logo } from '@/components/ui/Logo'
import { ProductTag } from '@/components/ui/Badge'
import { azimuthToCompass } from '@/lib/utils'
import Link from 'next/link'

type RoofSegment = {
  azimuth_degrees: number | null
  pitch_degrees: number | null
  area_m2: number | null
  panels_count: number | null
}

function segmentLabel(s: RoofSegment): string {
  return [
    s.azimuth_degrees != null ? `${azimuthToCompass(s.azimuth_degrees)}-facing` : null,
    s.pitch_degrees != null ? `${Math.round(s.pitch_degrees)}° pitch` : null,
    s.panels_count != null ? `${s.panels_count} ${s.panels_count === 1 ? 'panel' : 'panels'}` : null,
  ].filter(Boolean).join(' · ')
}

export default async function JobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?type=installer')

  const { data: installer } = await supabase.from('installers').select('id').eq('user_id', user.id).single()
  if (!installer) redirect('/installer/register')

  const { data: job } = await supabase
    .from('jobs')
    .select(`
      id, status, quote_deadline_at, enquiry_id,
      enquiries (
        reference, products, property_type, property_age, ownership,
        roof_type, roof_orientation, shading,
        monthly_elec_kwh, monthly_bill, goal,
        recommended_panels, recommended_system_kwp, recommended_battery_kwh
      )
    `)
    .eq('id', jobId)
    .eq('installer_id', installer.id)
    .single()

  if (!job) redirect('/installer/dashboard')

  const enq = (Array.isArray(job.enquiries) ? job.enquiries[0] : job.enquiries) as {
    reference: string; products: string[]; property_type: string; property_age: string;
    ownership: string; roof_type?: string; roof_orientation?: string; shading?: string;
    monthly_elec_kwh: number; monthly_bill: number; goal: string;
    recommended_panels?: number; recommended_system_kwp?: number; recommended_battery_kwh?: number;
  } | null

  // Roof-layout Phase 1c: fetch the roof design via the installer's own
  // session client — RLS ("installers_assigned_roof_designs") only returns a
  // row for enquiries this installer has a job on. The table holds no address
  // or coordinate data, so everything in it is safe to show installers.
  const { data: design } = await supabase
    .from('roof_designs')
    .select('status, panel_count, system_kwp, est_annual_kwh, roof_segments, image_path')
    .eq('enquiry_id', job.enquiry_id)
    .maybeSingle()

  // Signed URL (5 min) issued only after the RLS-backed ownership check above.
  let designImageUrl: string | null = null
  if (design?.status === 'ready' && design.image_path) {
    const admin = await createAdminClient()
    const { data: signed } = await admin.storage
      .from('roof-designs')
      .createSignedUrl(design.image_path, 300)
    designImageUrl = signed?.signedUrl ?? null
  }
  const roofSegments: RoofSegment[] = Array.isArray(design?.roof_segments)
    ? (design.roof_segments as RoofSegment[])
    : []

  const deadline = new Date(job.quote_deadline_at)
  const deadlinePast = deadline < new Date()

  return (
    <div className="min-h-screen bg-ws-bg">
      <nav className="bg-ws-card border-b border-ws-border">
        <div className="max-w-content mx-auto px-5 py-4 flex items-center gap-4">
          <Logo />
          <Link href="/installer/dashboard" className="text-sm text-ws-muted hover:text-ws-body font-medium">← Dashboard</Link>
        </div>
      </nav>

      <main className="max-w-content mx-auto px-5 py-10">
        <p className="eyebrow mb-2">Job brief</p>
        <h1
          className="text-2xl font-bold text-ws-ink mb-6 font-display tracking-tight"
        >
          {enq?.reference}
        </h1>

        <div className="bg-ws-card rounded-card border border-ws-border p-5 mb-6">
          <h2 className="font-semibold text-ws-ink mb-4">Property details</h2>
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
            <div><span className="text-ws-muted">Type: </span><span className="text-ws-body">{enq?.property_type}</span></div>
            <div><span className="text-ws-muted">Age: </span><span className="text-ws-body">{enq?.property_age}</span></div>
            {enq?.roof_type && <div><span className="text-ws-muted">Roof: </span><span className="text-ws-body">{enq.roof_type}</span></div>}
            {enq?.roof_orientation && <div><span className="text-ws-muted">Orientation: </span><span className="text-ws-body">{enq.roof_orientation}</span></div>}
            {enq?.shading && <div><span className="text-ws-muted">Shading: </span><span className="text-ws-body">{enq.shading}</span></div>}
            <div><span className="text-ws-muted">Usage: </span><span className="text-ws-body">~{enq?.monthly_elec_kwh} kWh/mo</span></div>
            <div><span className="text-ws-muted">Bill: </span><span className="text-ws-body">~£{enq?.monthly_bill}/mo</span></div>
            <div><span className="text-ws-muted">Goal: </span><span className="text-ws-body">{enq?.goal === 'export' ? 'Cover & earn' : 'Cover use'}</span></div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-ws-border">
            {(enq?.products || []).map((p: string) => <ProductTag key={p} product={p} />)}
          </div>
          {enq?.recommended_panels && (
            <div className="mt-3 pt-3 border-t border-ws-border text-xs text-ws-muted">
              WattSmart recommendation: {enq.recommended_panels} panels · {enq.recommended_system_kwp} kWp
              {enq.recommended_battery_kwh ? ` · ${enq.recommended_battery_kwh} kWh battery` : ''}
            </div>
          )}
        </div>

        <div className="bg-ws-card rounded-card border border-ws-border p-5 mb-6">
          <h2 className="font-semibold text-ws-ink mb-4">Proposed roof layout</h2>
          {design?.status === 'ready' ? (
            <>
              {designImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL; next/image caching would outlive it
                <img
                  src={designImageUrl}
                  alt="Satellite view of the roof with the proposed panel layout"
                  className="w-full max-w-md rounded-card border border-ws-border mb-4"
                />
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 text-sm">
                {design.panel_count != null && (
                  <div><span className="text-ws-muted">Panels: </span><span className="text-ws-body">{design.panel_count}</span></div>
                )}
                {design.system_kwp != null && (
                  <div><span className="text-ws-muted">System: </span><span className="text-ws-body">{design.system_kwp} kWp</span></div>
                )}
                {design.est_annual_kwh != null && (
                  <div><span className="text-ws-muted">Est. output: </span><span className="text-ws-body">~{design.est_annual_kwh.toLocaleString('en-GB')} kWh/yr</span></div>
                )}
              </div>
              {roofSegments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-ws-border">
                  {roofSegments.map((s, i) => {
                    const label = segmentLabel(s)
                    return label ? (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-semibold bg-ws-green-tint2 text-ws-muted border border-ws-border"
                      >
                        {label}
                      </span>
                    ) : null
                  })}
                </div>
              )}
              <p className="mt-3 pt-3 border-t border-ws-border text-xs text-ws-muted">
                Generated from satellite imagery to help you quote accurately — a site survey is still essential.
              </p>
            </>
          ) : design?.status === 'pending' ? (
            <p className="text-sm text-ws-muted">Roof analysis in progress — check back soon.</p>
          ) : (
            <p className="text-sm text-ws-muted">No automated roof analysis available for this property.</p>
          )}
        </div>

        <div className="bg-ws-green-tint border border-ws-green/20 rounded-card p-4 mb-8 text-sm text-ws-green-deep">
          WattSmart&apos;s 5% referral fee is deducted from the deposit automatically via Stripe.
          <div className="mt-1 text-xs text-ws-muted">
            Quote deadline: {deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            {deadlinePast && <span className="text-ws-red-text ml-2">(expired)</span>}
          </div>
        </div>

        {job.status === 'brief_sent' && !deadlinePast ? (
          <QuoteSubmitForm jobId={jobId} products={enq?.products || []} />
        ) : job.status === 'install_complete' ? (
          <div className="bg-ws-green-tint border border-ws-green/30 rounded-card p-5">
            <p className="font-semibold text-ws-green-deep mb-1">Job complete</p>
            <p className="text-sm text-ws-muted">This job has been marked as complete.</p>
          </div>
        ) : ['quote_selected', 'revealed'].includes(job.status) ? (
          <div className="bg-ws-green-tint border border-ws-green/30 rounded-card p-5">
            <p className="font-semibold text-ws-green-deep mb-1">Your quote was selected — now propose an installation date.</p>
            <p className="text-sm text-ws-muted mb-4">The customer has chosen you. Book a date to confirm the job and trigger the deposit payment.</p>
            <Link
              href={`/installer/jobs/${jobId}/schedule`}
              className="inline-block bg-ws-green text-white font-semibold text-sm px-4 py-2.5 rounded-btn hover:bg-ws-green-deep transition-colors"
            >
              Book an install date →
            </Link>
          </div>
        ) : (
          <p className="text-ws-muted text-sm">
            {deadlinePast && job.status === 'brief_sent' ? 'The quote deadline has passed.' : 'Quote already submitted for this job.'}
          </p>
        )}

        {['install_scheduled', 'install_confirmed', 'install_complete'].includes(job.status) &&
          job.status !== 'install_complete' &&
          job.enquiry_id && (
          <div className="mt-8">
            <JobCompleteForm jobId={jobId} enquiryId={job.enquiry_id} />
          </div>
        )}
      </main>
    </div>
  )
}
