import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { sendDepositReleased } from '@/lib/email'
import { formatCurrency } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' })
  try {
    const { paymentId } = await req.json()
    const admin = await createAdminClient()

    const { data: payment } = await admin
      .from('payments')
      .select('id, enquiry_id, installer_id, amount, installer_amount, stripe_payment_intent_id')
      .eq('id', paymentId)
      .eq('status', 'held')
      .single()

    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })

    // Capture and release via Stripe
    if (payment.stripe_payment_intent_id) {
      await stripe.paymentIntents.capture(payment.stripe_payment_intent_id)
    }

    await admin.from('payments').update({ status: 'released', released_at: new Date().toISOString() }).eq('id', payment.id)
    await admin.from('enquiries').update({ status: 'installation_confirmed' }).eq('id', payment.enquiry_id)

    const { data: installer } = await admin
      .from('installers')
      .select('contact_email')
      .eq('id', payment.installer_id)
      .single()

    const { data: enquiry } = await admin
      .from('enquiries')
      .select('reference')
      .eq('id', payment.enquiry_id)
      .single()

    if (installer?.contact_email) {
      await sendDepositReleased(
        installer.contact_email,
        enquiry?.reference || '',
        formatCurrency(payment.installer_amount)
      ).catch(console.error)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Release payment error:', err)
    return NextResponse.json({ error: 'Failed to release payment' }, { status: 500 })
  }
}
