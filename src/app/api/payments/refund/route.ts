import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' })

export async function POST(req: NextRequest) {
  try {
    const { paymentId } = await req.json()
    const admin = await createAdminClient()

    const { data: payment } = await admin
      .from('payments')
      .select('id, enquiry_id, stripe_payment_intent_id, status')
      .eq('id', paymentId)
      .single()

    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
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
