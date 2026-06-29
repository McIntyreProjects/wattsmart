import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' })
  try {
    // Auth check: caller must be logged in
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { paymentId } = await req.json()
    const admin = await createAdminClient()

    const { data: payment } = await admin
      .from('payments')
      .select('id, enquiry_id, stripe_payment_intent_id, status')
      .eq('id', paymentId)
      .single()

    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })

    // Ownership check: the authenticated user must own the enquiry
    const { data: enquiry } = await admin
      .from('enquiries')
      .select('customers(user_id)')
      .eq('id', payment.enquiry_id)
      .single()
    const ownerId = (enquiry?.customers as { user_id: string } | null)?.user_id
    if (ownerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (payment.status === 'released') {
      return NextResponse.json({ error: 'Cannot refund a released payment' }, { status: 400 })
    }

    if (payment.stripe_payment_intent_id) {
      // Cancel the payment intent (if not yet captured) or issue refund
      try {
        await stripe.paymentIntents.cancel(payment.stripe_payment_intent_id)
      } catch {
        await stripe.refunds.create({ payment_intent: payment.stripe_payment_intent_id })
      }
    }

    await admin.from('payments').update({ status: 'refunded' }).eq('id', payment.id)
    await admin.from('enquiries').update({ status: 'cancelled' }).eq('id', payment.enquiry_id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Refund error:', err)
    return NextResponse.json({ error: 'Refund failed' }, { status: 500 })
  }
}
