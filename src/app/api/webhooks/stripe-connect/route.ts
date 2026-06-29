import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_CONNECT_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Connect webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account

    if (account.details_submitted && account.charges_enabled) {
      const admin = await createAdminClient()
      const { error } = await admin
        .from('installers')
        .update({ stripe_connect_onboarded: true })
        .eq('stripe_connect_account_id', account.id)

      if (error) {
        console.error(`Failed to mark installer onboarded for account ${account.id}:`, error)
      } else {
        console.log(`Installer with Stripe account ${account.id} marked as onboarded`)
      }
    }
  }

  return NextResponse.json({ received: true })
}
