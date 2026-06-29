import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/payments/paid-at?paymentId=<id>
 * Returns the real `created_at` timestamp for a payment, after verifying the
 * caller owns the underlying enquiry. Used by the cancel page to avoid deriving
 * cooling-off eligibility from a tamperable URL parameter.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const paymentId = req.nextUrl.searchParams.get('paymentId')
    if (!paymentId) return NextResponse.json({ error: 'paymentId required' }, { status: 400 })

    const admin = await createAdminClient()

    const { data: payment } = await admin
      .from('payments')
      .select('id, enquiry_id, created_at')
      .eq('id', paymentId)
      .single()

    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })

    // Ownership check: caller must own the enquiry
    const { data: enquiry } = await admin
      .from('enquiries')
      .select('customers(user_id)')
      .eq('id', payment.enquiry_id)
      .single()

    const custOwner = Array.isArray(enquiry?.customers) ? enquiry.customers[0] : enquiry?.customers
    const ownerId = (custOwner as { user_id: string } | null)?.user_id
    if (ownerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ paidAt: payment.created_at })
  } catch (err) {
    console.error('[/api/payments/paid-at] error:', err)
    return NextResponse.json({ error: 'Failed to fetch payment date' }, { status: 500 })
  }
}
