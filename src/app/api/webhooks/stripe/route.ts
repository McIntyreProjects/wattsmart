import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' })

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = await createAdminClient()

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent
      await admin
        .from('payments')
        .update({ status: 'held', paid_at: new Date().toISOString() })
        .eq('stripe_payment_intent_id', pi.id)
      break
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent
      await admin
        .from('payments')
        .update({ status: 'refunded' })
        .eq('stripe_payment_intent_id', pi.id)
      break
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge
      if (charge.payment_intent) {
        await admin
          .from('payments')
          .update({ status: 'refunded' })
          .eq('stripe_payment_intent_id', charge.payment_intent as string)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
