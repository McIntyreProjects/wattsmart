import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { QuoteComparison } from '@/components/dashboard/QuoteComparison'
import { Logo } from '@/components/ui/Logo'
import Link from 'next/link'

export default async function QuotesPage({ params }: { params: Promise<{ enquiryId: string }> }) {
  const { enquiryId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?type=customer`)

  // Roof-layout Phase 1c: fetch via the customer's own session client — RLS
  // ("customers_own_roof_designs") only returns a row for the customer's own
  // enquiry. Rendered only when the analysis is ready; skipped silently
  // otherwise.
  const { data: design } = await supabase
    .from('roof_designs')
    .select('status, panel_count, est_annual_kwh, image_path')
    .eq('enquiry_id', enquiryId)
    .maybeSingle()

  let designImageUrl: string | null = null
  if (design?.status === 'ready' && design.image_path) {
    const admin = await createAdminClient()
    const { data: signed } = await admin.storage
      .from('roof-designs')
      .createSignedUrl(design.image_path, 300)
    designImageUrl = signed?.signedUrl ?? null
  }

  return (
    <div className="min-h-screen bg-ws-bg">
      <nav className="bg-ws-card border-b border-ws-border">
        <div className="max-w-content mx-auto px-5 py-4 flex items-center gap-4">
          <Logo />
          <Link href="/customer/dashboard" className="text-sm text-ws-muted hover:text-ws-body font-medium">
            ← Dashboard
          </Link>
        </div>
      </nav>
      <main className="max-w-content mx-auto px-5 py-10">
        {design?.status === 'ready' && (
          <div className="bg-ws-card rounded-card border border-ws-border p-5 mb-8">
            <h2 className="font-semibold text-ws-ink mb-3">Your roof, analysed</h2>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {designImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL; next/image caching would outlive it
                <img
                  src={designImageUrl}
                  alt="Satellite view of your roof with the proposed panel layout"
                  className="w-full sm:w-56 rounded-card border border-ws-border"
                />
              )}
              <div className="text-sm">
                <p className="text-ws-body">
                  {design.panel_count != null && (
                    <><span className="font-semibold text-ws-ink">{design.panel_count} panels</span>{design.est_annual_kwh != null ? ' · ' : ''}</>
                  )}
                  {design.est_annual_kwh != null && (
                    <>est. <span className="font-semibold text-ws-ink">{design.est_annual_kwh.toLocaleString('en-GB')} kWh</span> a year</>
                  )}
                </p>
                <p className="text-xs text-ws-muted mt-2">
                  We shared this analysis (never your address) with the installers quoting for you.
                </p>
              </div>
            </div>
          </div>
        )}
        <QuoteComparison enquiryId={enquiryId} />
      </main>
    </div>
  )
}
