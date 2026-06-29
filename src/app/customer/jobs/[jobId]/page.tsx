import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

export default async function JobProgressPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params
  const supabase = await createClient()

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = await createAdminClient()

  // Fetch job with enquiry and installer
  const { data: job } = await admin
    .from('jobs')
    .select(`
      id,
      status,
      enquiries (
        id,
        reference,
        products,
        total_price,
        status,
        created_at,
        customers ( user_id )
      ),
      installers (
        company_name,
        trading_name,
        contact_name,
        contact_email,
        contact_phone
      )
    `)
    .eq('id', jobId)
    .single()

  if (!job) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enquiry = (job.enquiries as any) as {
    id: string
    reference: string
    products: string[]
    total_price: number | null
    status: string
    created_at: string
    customers: { user_id: string }
  } | null

  if (!enquiry) notFound()

  // Verify customer owns this job
  if (enquiry.customers?.user_id !== user.id) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const installer = (job.installers as any) as {
    company_name: string
    trading_name: string | null
    contact_name: string | null
    contact_email: string | null
    contact_phone: string | null
  } | null

  // Only reveal installer details after deposit is paid
  const INSTALLER_VISIBLE_STATUSES = ['deposit_paid', 'survey_booked', 'installation_confirmed', 'install_scheduled', 'install_complete', 'complete']
  const showInstaller = INSTALLER_VISIBLE_STATUSES.includes(enquiry.status)

  // Timeline progress derived from job/enquiry status
  // Steps: 1=deposit paid, 2=survey/design, 3=balance+install, 4=installation day, 5=certs
  const s = enquiry.status
  const step1Done = ['deposit_paid','survey_booked','installation_confirmed','install_scheduled','install_complete','complete'].includes(s)
  const step2Done = ['survey_booked','installation_confirmed','install_scheduled','install_complete','complete'].includes(s)
  const step2InProgress = s === 'deposit_paid'
  const step3Done = ['installation_confirmed','install_scheduled','install_complete','complete'].includes(s)
  const step3InProgress = s === 'survey_booked'
  const step4Done = ['install_complete','complete'].includes(s)
  const step4InProgress = ['installation_confirmed','install_scheduled'].includes(s)
  const step5Done = s === 'complete'

  const installerName = installer
    ? (installer.trading_name || installer.company_name)
    : 'Your installer'

  // Fetch payment for this enquiry
  const { data: payment } = await admin
    .from('payments')
    .select('id, amount, status, paid_at')
    .eq('enquiry_id', enquiry.id)
    .eq('status', 'captured')
    .maybeSingle()

  const depositAmount = payment?.amount ?? null
  const totalPrice = enquiry.total_price ?? null
  const balance = (totalPrice !== null && depositAmount !== null)
    ? totalPrice - depositAmount
    : null

  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <Link href="/customer/dashboard" className="text-ws-muted text-lg leading-none">←</Link>
          <h1 className="font-display font-extrabold text-2xl tracking-tight">Your install</h1>
        </div>

        {/* Job summary card */}
        <div className="flex justify-between items-center border border-ws-border rounded-tile p-4 mb-5">
          <div>
            <p className="text-xs text-ws-subtle">
              {enquiry.reference} · {showInstaller ? installerName : 'Installer TBC'}
            </p>
            <p className="font-bold text-sm mt-0.5">{enquiry.products.join(' + ')}</p>
          </div>
          {totalPrice !== null && (
            <div className="text-right">
              <p className="text-xs text-ws-subtle">Total</p>
              <p className="font-display font-extrabold text-lg text-ws-dark-green">
                £{totalPrice.toLocaleString('en-GB')}
              </p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="flex flex-col">

          {/* Step 1 — Deposit paid */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              {step1Done
                ? <span className="w-6 h-6 rounded-full bg-ws-green text-white flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                : <span className="w-6 h-6 rounded-full bg-[#F2F6F3] text-ws-subtle flex items-center justify-center text-xs flex-shrink-0">1</span>
              }
              <span className={`flex-1 w-0.5 my-1 ${step1Done ? 'bg-ws-green' : 'bg-ws-border'}`} />
            </div>
            <div className="pb-5">
              <p className={`font-bold text-sm ${step1Done ? '' : 'text-ws-subtle'}`}>Deposit paid</p>
              <p className="text-xs text-ws-subtle mt-0.5">
                {step1Done ? (depositAmount !== null ? `£${depositAmount.toLocaleString('en-GB')} held securely` : 'Deposit held securely') : 'Pay deposit to get started'}
              </p>
            </div>
          </div>

          {/* Step 2 — Survey & design */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              {step2Done
                ? <span className="w-6 h-6 rounded-full bg-ws-green text-white flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                : step2InProgress
                  ? <span className="w-6 h-6 rounded-full border-2 border-amber-500 text-amber-500 flex items-center justify-center text-xs flex-shrink-0">◐</span>
                  : <span className="w-6 h-6 rounded-full bg-[#F2F6F3] text-ws-subtle flex items-center justify-center text-xs flex-shrink-0">2</span>
              }
              <span className={`flex-1 w-0.5 my-1 ${step2Done ? 'bg-ws-green' : 'bg-ws-border'}`} />
            </div>
            <div className="pb-5">
              <p className={`font-bold text-sm ${step2Done || step2InProgress ? '' : 'text-ws-subtle'}`}>Survey &amp; design</p>
              {step2Done
                ? <p className="text-xs text-ws-subtle mt-0.5">Survey complete, design approved</p>
                : step2InProgress
                  ? <>
                      <p className="text-sm text-ws-muted mt-1 leading-relaxed">
                        {showInstaller ? installerName : 'Your installer'} will be in touch to book a site survey.
                      </p>
                      <span className="inline-block mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1">In progress</span>
                    </>
                  : <p className="text-xs text-ws-subtle mt-0.5">Site survey &amp; system design</p>
              }
            </div>
          </div>

          {/* Step 3 — Balance & install date */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              {step3Done
                ? <span className="w-6 h-6 rounded-full bg-ws-green text-white flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                : step3InProgress
                  ? <span className="w-6 h-6 rounded-full border-2 border-amber-500 text-amber-500 flex items-center justify-center text-xs flex-shrink-0">◐</span>
                  : <span className="w-6 h-6 rounded-full bg-ws-green text-white flex items-center justify-center text-xs font-bold flex-shrink-0">£</span>
              }
              <span className={`flex-1 w-0.5 my-1 ${step3Done ? 'bg-ws-green' : 'bg-ws-border'}`} />
            </div>
            <div className="pb-5 flex-1">
              <p className={`font-bold text-sm ${step3Done || step3InProgress ? '' : 'text-ws-subtle'}`}>Balance due before install</p>
              {step3Done
                ? <p className="text-xs text-ws-subtle mt-0.5">Balance paid, install date confirmed</p>
                : balance !== null
                  ? (
                    <div className="border-2 border-ws-green bg-[#F1FAF5] rounded-tile p-3 mt-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-ws-muted">Balance</span>
                        <span className="font-display font-extrabold text-xl">£{balance.toLocaleString('en-GB')}</span>
                      </div>
                      {depositAmount !== null && (
                        <p className="text-xs text-ws-dark-green mt-1">Deposit paid: £{depositAmount.toLocaleString('en-GB')}</p>
                      )}
                      <Link
                        href={`/customer/jobs/${jobId}/balance`}
                        className="block bg-ws-green text-white rounded-btn p-3 text-center font-bold text-sm mt-3"
                      >
                        Pay balance →
                      </Link>
                    </div>
                  ) : (
                    <p className="text-sm text-ws-muted mt-1">Balance will be shown once your total is confirmed.</p>
                  )
              }
            </div>
          </div>

          {/* Step 4 — Installation day */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              {step4Done
                ? <span className="w-6 h-6 rounded-full bg-ws-green text-white flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                : step4InProgress
                  ? <span className="w-6 h-6 rounded-full border-2 border-amber-500 text-amber-500 flex items-center justify-center text-xs flex-shrink-0">◐</span>
                  : <span className="w-6 h-6 rounded-full bg-[#F2F6F3] text-ws-subtle flex items-center justify-center text-xs flex-shrink-0">4</span>
              }
              <span className={`flex-1 w-0.5 my-1 ${step4Done ? 'bg-ws-green' : 'bg-ws-border'}`} />
            </div>
            <div className="pb-5">
              <p className={`font-bold text-sm ${step4Done || step4InProgress ? '' : 'text-ws-subtle'}`}>Installation day</p>
              <p className="text-xs text-ws-subtle mt-0.5">
                {step4Done ? 'Installation complete' : step4InProgress ? 'Date confirmed — see details above' : '~1 day on site'}
              </p>
            </div>
          </div>

          {/* Step 5 — Certificates */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              {step5Done
                ? <span className="w-6 h-6 rounded-full bg-ws-green text-white flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                : <span className="w-6 h-6 rounded-full bg-[#F2F6F3] text-ws-subtle flex items-center justify-center text-xs flex-shrink-0">5</span>
              }
            </div>
            <div>
              <p className={`font-bold text-sm ${step5Done ? '' : 'text-ws-subtle'}`}>Certificates &amp; sign-off</p>
              <p className="text-xs text-ws-subtle mt-0.5">
                {step5Done ? 'All done — certificates in your Documents.' : 'MCS, electrical cert &amp; warranty land in your Documents.'}
              </p>
            </div>
          </div>

        </div>

        {/* Installer contact — only shown after deposit paid */}
        {showInstaller && installer ? (
          <div className="mt-6 border border-ws-border rounded-tile p-4 bg-white">
            <p className="text-sm font-semibold mb-2">Your installer</p>
            <p className="font-bold text-sm">{installerName}</p>
            {installer.contact_name && <p className="text-sm text-ws-muted mt-0.5">{installer.contact_name}</p>}
            {installer.contact_phone && <p className="text-sm text-ws-muted">✆ {installer.contact_phone}</p>}
            {installer.contact_email && <p className="text-sm text-ws-muted">✉ {installer.contact_email}</p>}
          </div>
        ) : (
          <div className="mt-6 border border-ws-border rounded-tile p-4 bg-[#F2F6F3]">
            <p className="text-sm text-ws-muted">Installer details will appear after deposit is paid.</p>
          </div>
        )}

        {/* Bottom links */}
        <div className="mt-6 flex gap-3">
          <Link href={`/customer/jobs/${jobId}/support`} className="text-xs text-ws-muted underline">Something&apos;s wrong?</Link>
          <Link href="/customer/dashboard" className="text-xs text-ws-dark-green font-semibold">← Dashboard</Link>
        </div>
      </div>
    </div>
  )
}
