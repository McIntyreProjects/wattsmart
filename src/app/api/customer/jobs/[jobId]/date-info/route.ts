import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const admin = await createAdminClient()

    const { data: job } = await admin
      .from('jobs')
      .select(`
        id,
        proposed_date,
        enquiries (
          id,
          reference,
          customers ( user_id )
        ),
        installers (
          company_name,
          trading_name
        )
      `)
      .eq('id', jobId)
      .single()

    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enquiry = (job.enquiries as any) as { id: string; reference: string; customers: { user_id: string } } | null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const installer = (job.installers as any) as { company_name: string; trading_name: string | null } | null

    if (!enquiry || enquiry.customers?.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch deposit payment
    const { data: payment } = await admin
      .from('payments')
      .select('amount')
      .eq('enquiry_id', enquiry.id)
      .eq('status', 'captured')
      .maybeSingle()

    return NextResponse.json({
      reference: enquiry.reference,
      installerName: installer ? (installer.trading_name || installer.company_name) : 'Your installer',
      proposedDate: job.proposed_date ?? null,
      depositAmount: payment?.amount ?? null,
    })
  } catch (err) {
    console.error('GET /api/customer/jobs/[jobId]/date-info error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
