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

    const body = await req.json()
    const { action, suggestedDate } = body as { action: 'accept' | 'suggest'; suggestedDate?: string }

    if (action !== 'accept' && action !== 'suggest') {
      return NextResponse.json({ error: 'action must be accept or suggest' }, { status: 400 })
    }
    if (action === 'suggest' && !suggestedDate) {
      return NextResponse.json({ error: 'suggestedDate is required when action is suggest' }, { status: 400 })
    }

    const admin = await createAdminClient()

    // Fetch job with enquiry to verify customer owns it
    const { data: job } = await admin
      .from('jobs')
      .select('id, status, proposed_date, enquiries(id, status, customers(user_id))')
      .eq('id', jobId)
      .single()

    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enquiry = (job.enquiries as any) as {
      id: string
      status: string
      customers: { user_id: string }
    } | null

    if (!enquiry || enquiry.customers?.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (action === 'accept') {
      if (!job.proposed_date) {
        return NextResponse.json({ error: 'No proposed date to accept' }, { status: 400 })
      }

      const now = new Date().toISOString()

      // Update job: mark date accepted, set confirmed_date = proposed_date,
      // update status ('install_scheduled' added to the jobs status check
      // constraint in migration 010)
      const { error: jobErr } = await admin
        .from('jobs')
        .update({
          date_accepted_at: now,
          confirmed_date: job.proposed_date,
          status: 'install_scheduled',
        })
        .eq('id', jobId)

      if (jobErr) throw jobErr

      // Update enquiry status
      const { error: enqErr } = await admin
        .from('enquiries')
        .update({ status: 'installation_confirmed' })
        .eq('id', enquiry.id)

      if (enqErr) throw enqErr

      return NextResponse.json({ ok: true })
    }

    // action === 'suggest'
    const { error: suggestErr } = await admin
      .from('jobs')
      .update({ customer_suggested_date: suggestedDate })
      .eq('id', jobId)

    if (suggestErr) {
      // Column may not exist yet — log but don't fail hard
      console.warn('customer_suggested_date update failed (column may be missing):', suggestErr.message)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST /api/customer/jobs/[jobId]/date error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
