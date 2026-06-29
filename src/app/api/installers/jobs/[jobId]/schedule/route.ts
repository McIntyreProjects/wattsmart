import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { proposedDate } = await req.json()
    if (!proposedDate) return NextResponse.json({ error: 'proposedDate is required' }, { status: 400 })

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

    // Verify the job belongs to this installer
    const admin = await createAdminClient()
    const { data: job, error: jobError } = await admin
      .from('jobs')
      .select('id, installer_id')
      .eq('id', jobId)
      .maybeSingle()

    if (jobError) throw jobError
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    if (job.installer_id !== installerId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Update the proposed date
    const { error: updateError } = await admin
      .from('jobs')
      .update({
        proposed_date: proposedDate,
        date_proposed_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    if (updateError) throw updateError

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST /api/installers/jobs/[jobId]/schedule error:', err)
    return NextResponse.json({ error: 'Failed to propose date' }, { status: 500 })
  }
}
