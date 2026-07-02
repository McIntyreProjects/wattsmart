import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import * as Sentry from '@sentry/nextjs'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendJobCancelledInstaller } from '@/lib/email'

const COOLING_OFF_DAYS = 14

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
  try {
    // Auth check: caller must be logged in
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { paymentId } = await req.json()
    const admin = await createAdminClient()

    const { data: payment } = await admin
      .from('payments')
      .select('id, enquiry_id, installer_id, stripe_payment_intent_id, status, amount, wattsmart_fee, paid_at, created_at')
      .eq('id', paymentId)
      .single()

    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })

    // Ownership check: the authenticated user must own the enquiry
    const { data: enquiry } = await admin
      .from('enquiries')
      .select('reference, customers(user_id)')
      .eq('id', payment.enquiry_id)
      .single()
    const custRefund = Array.isArray(enquiry?.customers) ? enquiry.customers[0] : enquiry?.customers
    const ownerId = (custRefund as { user_id: string } | null)?.user_id
    if (ownerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (payment.status === 'released') {
      return NextResponse.json({ error: 'Cannot refund a released payment' }, { status: 400 })
    }
    if (payment.status === 'refunded') {
      return NextResponse.json({ error: 'Payment has already been refunded' }, { status: 400 })
    }

    // Cooling-off rule — computed server-side, never from client input.
    // Within 14 days of payment: full refund. After: deposit minus WattSmart's 5% fee.
    const paidDate = new Date(payment.paid_at || payment.created_at)
    const daysElapsed = (Date.now() - paidDate.getTime()) / (24 * 60 * 60 * 1000)
    const withinCoolingOff = daysElapsed <= COOLING_OFF_DAYS

    let refundedAmount = payment.amount // pence
    let feeRetained = 0 // pence

    if (payment.stripe_payment_intent_id) {
      // Cancel the payment intent (if not yet captured) or issue a refund.
      // Deposits are destination charges (95% transferred to the installer,
      // 5% platform application fee), so refunds must reverse the transfer —
      // otherwise the refund is paid from the platform balance while the
      // installer keeps their share.
      try {
        // Uncaptured intent: cancelling releases the full authorisation.
        // Nothing was captured or split, so the customer gets everything back.
        await stripe.paymentIntents.cancel(payment.stripe_payment_intent_id)
      } catch {
        // Non-Connect charges (installer not yet Stripe-onboarded) have no
        // transfer or application fee to reverse — passing those flags makes
        // Stripe throw. Inspect the intent's charge before choosing flags.
        const intent = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id, {
          expand: ['latest_charge'],
        })
        const charge = intent.latest_charge as Stripe.Charge | null
        const hasTransfer = Boolean(charge?.transfer_data || charge?.transfer)
        const hasAppFee = Boolean(charge?.application_fee_amount)

        if (withinCoolingOff) {
          // Full refund: pull the installer's share back and return the app fee.
          await stripe.refunds.create({
            payment_intent: payment.stripe_payment_intent_id,
            ...(hasTransfer && { reverse_transfer: true }),
            ...(hasAppFee && { refund_application_fee: true }),
          })
        } else {
          // Post cooling-off: refund the deposit minus WattSmart's
          // non-refundable 5% fee. The installer's transfer is reversed;
          // the platform keeps its application fee.
          refundedAmount = payment.amount - payment.wattsmart_fee
          feeRetained = payment.wattsmart_fee
          await stripe.refunds.create({
            payment_intent: payment.stripe_payment_intent_id,
            amount: refundedAmount,
            ...(hasTransfer && { reverse_transfer: true }),
            refund_application_fee: false,
          })
        }
      }
    }

    await admin.from('payments').update({ status: 'refunded' }).eq('id', payment.id)

    // Withdraw the related job ('withdrawn' is the closest valid jobs.status
    // per the 001_initial_schema check constraint).
    let jobQuery = admin.from('jobs').update({ status: 'withdrawn' }).eq('enquiry_id', payment.enquiry_id)
    if (payment.installer_id) jobQuery = jobQuery.eq('installer_id', payment.installer_id)
    await jobQuery

    await admin.from('enquiries').update({ status: 'cancelled' }).eq('id', payment.enquiry_id)

    // Notify the installer that the job is cancelled (job → installer → contact_email).
    try {
      let jobLookup = admin
        .from('jobs')
        .select('installer_id')
        .eq('enquiry_id', payment.enquiry_id)
      if (payment.installer_id) jobLookup = jobLookup.eq('installer_id', payment.installer_id)
      const { data: job } = await jobLookup.limit(1).maybeSingle()

      const installerId = job?.installer_id || payment.installer_id
      if (installerId) {
        const { data: installer } = await admin
          .from('installers')
          .select('contact_email')
          .eq('id', installerId)
          .single()
        if (installer?.contact_email) {
          await sendJobCancelledInstaller(installer.contact_email, enquiry?.reference || '')
        }
      }
    } catch (emailErr) {
      // The refund itself succeeded — log the notification failure but don't fail the request.
      Sentry.captureException(emailErr)
      console.error('Refund installer notification error:', emailErr)
    }

    return NextResponse.json({ ok: true, refundedAmount, feeRetained })
  } catch (err) {
    Sentry.captureException(err)
    console.error('Refund error:', err)
    return NextResponse.json({ error: 'Refund failed' }, { status: 500 })
  }
}
