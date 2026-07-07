import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { claimAndSendDepositEmails } from '@/lib/depositEmails'

// Called by the customer after Stripe confirms payment client-side.
// Verifies the payment intent succeeded, marks it held, and reveals the installer.
export async function POST(req: NextRequest) {
  try {
    const { paymentIntentId } = await req.json()
    if (!paymentIntentId) return NextResponse.json({ error: 'Missing paymentIntentId' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await createAdminClient()

    // Verify payment intent succeeded via Stripe
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (intent.status !== 'requires_capture' && intent.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment not confirmed' }, { status: 400 })
    }

    const { data: payment } = await admin
      .from('payments')
      .select('id, enquiry_id, quote_id, installer_id, amount, status')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single()

    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })

    // Verify this customer owns the enquiry
    const { data: enquiry } = await admin
      .from('enquiries')
      .select('id, reference, customers(user_id)')
      .eq('id', payment.enquiry_id)
      .single()

    const custRecord = Array.isArray(enquiry?.customers) ? enquiry.customers[0] : enquiry?.customers
    if (!enquiry || (custRecord as { user_id: string } | null)?.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Idempotent — only update if not already held (the Stripe webhook may
    // have got there first)
    if (payment.status !== 'held') {
      await admin.from('payments').update({ status: 'held', paid_at: new Date().toISOString() }).eq('id', payment.id)
      await admin.from('enquiries').update({ status: 'deposit_paid' }).eq('id', payment.enquiry_id)
    }

    // Deposit paid — now reject the other quotes on this enquiry. This
    // deliberately happens on payment success rather than at selection, so
    // an abandoned disclosure/payment step never kills the other quotes.
    // Idempotent (status filter) and harmless if the webhook ran first.
    if (payment.quote_id) {
      await admin
        .from('quotes')
        .update({ status: 'rejected' })
        .eq('enquiry_id', payment.enquiry_id)
        .neq('id', payment.quote_id)
        .eq('status', 'submitted')
    }

    // Send confirmation emails exactly once, regardless of whether this route
    // or the webhook confirmed the payment — claimAndSendDepositEmails claims
    // the send atomically via payments.emails_sent_at.
    await claimAndSendDepositEmails(admin, payment.id)

    // Reveal installer — only after confirmed payment
    const { data: installer } = await admin
      .from('installers')
      .select('id, company_name, trading_name, contact_name, contact_email, contact_phone')
      .eq('id', payment.installer_id)
      .single()

    // Only certifications an admin has actually verified — the badges shown
    // to the customer must reflect what this installer really holds.
    const { data: verifiedCerts } = await admin
      .from('certifications')
      .select('type')
      .eq('installer_id', payment.installer_id)
      .eq('status', 'verified')

    return NextResponse.json({
      ok: true,
      installer: installer ? {
        id: installer.id,
        company_name: installer.trading_name || installer.company_name,
        contact_name: installer.contact_name,
        contact_email: installer.contact_email,
        contact_phone: installer.contact_phone,
        verified_certifications: (verifiedCerts || []).map(c => c.type),
      } : null,
    })
  } catch (err) {
    console.error('Payment reveal error:', err)
    return NextResponse.json({ error: 'Failed to confirm payment' }, { status: 500 })
  }
}
