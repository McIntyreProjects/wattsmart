import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    // Resolve installer_id for this user
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

      installerId = installer?.id ?? null
    }

    if (!installerId) return NextResponse.json({ error: 'Installer not found' }, { status: 404 })

    const admin = await createAdminClient()

    // Verify the job belongs to this installer
    const { data: job, error: jobError } = await admin
      .from('jobs')
      .select('id, installer_id, enquiry_id, status')
      .eq('id', jobId)
      .maybeSingle()

    if (jobError) throw jobError
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    if (job.installer_id !== installerId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Mark job as install_complete
    const { error: jobUpdateError } = await admin
      .from('jobs')
      .update({ status: 'install_complete' })
      .eq('id', jobId)

    if (jobUpdateError) throw jobUpdateError

    // Mark enquiry as complete
    if (job.enquiry_id) {
      await admin
        .from('enquiries')
        .update({ status: 'complete' })
        .eq('id', job.enquiry_id)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST /api/installers/jobs/[jobId]/complete error:', err)
    return NextResponse.json({ error: 'Failed to mark job complete' }, { status: 500 })
  }
}
