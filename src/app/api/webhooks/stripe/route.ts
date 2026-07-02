import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/lib/supabase/server'
import { claimAndSendDepositEmails } from '@/lib/depositEmails'
import { sendAdminAlert } from '@/lib/email'
import { formatCurrency } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = await createAdminClient()

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent
        await admin
          .from('payments')
          .update({ status: 'held', paid_at: new Date().toISOString() })
          .eq('stripe_payment_intent_id', pi.id)

        // Deposit payments: also move the enquiry forward and send the
        // confirmation emails — /api/payments/reveal may never run (customer
        // closed the tab), so the webhook must be able to complete the flow.
        const { data: payment } = await admin
          .from('payments')
          .select('id, type, enquiry_id')
          .eq('stripe_payment_intent_id', pi.id)
          .maybeSingle()

        if (payment?.type === 'deposit') {
          // Guarded so a webhook retry can't regress a later enquiry status.
          await admin
            .from('enquiries')
            .update({ status: 'deposit_paid' })
            .eq('id', payment.enquiry_id)
            .eq('status', 'installer_chosen')

          await claimAndSendDepositEmails(admin, payment.id)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent
        // A failed attempt is not a refund — the customer can retry, so the
        // payment record returns to 'pending' (valid statuses per 001:
        // pending/held/released/refunded).
        await admin
          .from('payments')
          .update({ status: 'pending' })
          .eq('stripe_payment_intent_id', pi.id)
          .neq('status', 'held')
          .neq('status', 'released')

        Sentry.captureMessage('Stripe payment_intent.payment_failed', {
          level: 'warning',
          extra: {
            paymentIntentId: pi.id,
            amount: pi.amount,
            lastPaymentError: pi.last_payment_error?.message ?? null,
          },
        })
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

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute
        const disputePi = (dispute.payment_intent as string | null) ?? 'unknown'

        Sentry.captureMessage('Stripe charge.dispute.created', {
          level: 'error',
          extra: { disputeId: dispute.id, amount: dispute.amount, paymentIntentId: disputePi },
        })

        const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_FROM
        if (adminEmail) {
          await sendAdminAlert(
            adminEmail,
            `Stripe dispute opened — ${dispute.id}`,
            `
            <p>A customer has opened a dispute (chargeback) on Stripe.</p>
            <p>
              Dispute ID: <strong>${dispute.id}</strong><br/>
              Amount: <strong>${formatCurrency(dispute.amount)}</strong><br/>
              Payment intent: <strong>${disputePi}</strong><br/>
              Reason: <strong>${dispute.reason}</strong>
            </p>
            <p>Respond in the Stripe dashboard before the evidence deadline.</p>
            `
          ).catch((err) => {
            console.error('Dispute admin alert failed:', err)
            Sentry.captureException(err)
          })
        }
        break
      }
    }
  } catch (err) {
    console.error('Stripe webhook handler error:', err)
    Sentry.captureException(err, { extra: { eventType: event.type, eventId: event.id } })
    // 500 so Stripe retries the event.
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
