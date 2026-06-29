import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import SupportTopicPicker from './SupportTopicPicker'

export default async function SupportPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = await createAdminClient()

  const { data: job } = await admin
    .from('jobs')
    .select(`
      id,
      status,
      enquiries (
        id,
        status,
        customers ( user_id )
      ),
      installers (
        trading_name,
        company_name,
        contact_email
      )
    `)
    .eq('id', jobId)
    .single()

  if (!job) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enquiry = (job.enquiries as any) as {
    id: string
    status: string
    customers: { user_id: string }
  } | null

  if (!enquiry) notFound()
  if (enquiry.customers?.user_id !== user.id) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const installer = (job.installers as any) as {
    trading_name: string | null
    company_name: string
    contact_email: string | null
  } | null

  const INSTALLER_VISIBLE_STATUSES = ['deposit_paid', 'survey_booked', 'installation_confirmed', 'install_scheduled', 'install_complete', 'complete']
  const depositPaid = INSTALLER_VISIBLE_STATUSES.includes(enquiry.status)

  const installerName = installer
    ? (installer.trading_name || installer.company_name)
    : 'Your installer'
  const installerEmail = installer?.contact_email ?? null

  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/customer/jobs/${jobId}`} className="text-ws-muted text-lg">←</Link>
          <h1 className="font-display font-extrabold text-2xl tracking-tight">Something&apos;s wrong</h1>
        </div>

        <p className="text-sm text-ws-muted leading-relaxed mb-5">
          Tell us what&apos;s happened and we&apos;ll point you to the right place — or handle it ourselves.
        </p>

        <SupportTopicPicker
          jobId={jobId}
          installerName={installerName}
          installerEmail={depositPaid ? installerEmail : null}
        />
      </div>
    </div>
  )
}
