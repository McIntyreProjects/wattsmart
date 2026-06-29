import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // Fetch customer record
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (customerError || !customer) {
    return NextResponse.json({ error: 'Customer record not found' }, { status: 404 })
  }

  // Fetch enquiries
  const { data: enquiries } = await supabase
    .from('enquiries')
    .select('*')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })

  // Fetch jobs (with quotes) for those enquiries
  const enquiryIds = (enquiries ?? []).map((e) => e.id)

  const { data: jobs } = enquiryIds.length
    ? await supabase
        .from('jobs')
        .select('*, quotes(*)')
        .in('enquiry_id', enquiryIds)
    : { data: [] }

  // Fetch payments
  const { data: payments } = enquiryIds.length
    ? await supabase
        .from('payments')
        .select('*')
        .in('enquiry_id', enquiryIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  // Reviews are installer-level; we include any written for jobs the customer was involved in
  const jobIds = (jobs ?? []).map((j) => j.id)
  const { data: jobReviews } = jobIds.length
    ? await supabase
        .from('job_reviews')
        .select('*')
        .in('job_id', jobIds)
    : { data: [] }

  const payload = {
    exported_at: new Date().toISOString(),
    account: {
      email: user.email,
      created_at: user.created_at,
    },
    customer,
    enquiries: enquiries ?? [],
    jobs: jobs ?? [],
    payments: payments ?? [],
    reviews: jobReviews ?? [],
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="my-wattsmart-data.json"',
    },
  })
}
