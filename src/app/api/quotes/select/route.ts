import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import * as Sentry from '@sentry/nextjs'

export async function POST(req: NextRequest) {
  try {
    const { quoteId } = await req.json()
    if (!quoteId) return NextResponse.json({ error: 'Missing quoteId' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await createAdminClient()

    const { data: quote } = await admin
      .from('quotes')
      .select('id, enquiry_id, installer_id, job_id, deposit_amount, installers(stripe_connect_account_id, stripe_connect_onboarded)')
      .eq('id', quoteId)
      .single()

    if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 })

    // Verify customer owns enquiry
    const { data: enquiry } = await admin
      .from('enquiries')
      .select('id, reference, customers(user_id)')
      .eq('id', quote.enquiry_id)
      .single()

    const custRecord = Array.isArray(enquiry?.customers) ? enquiry.customers[0] : enquiry?.customers
    if (!enquiry || (custRecord as { user_id: string } | null)?.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Mark quote as selected, reject others
    await admin.from('quotes').update({ status: 'selected', selected_at: new Date().toISOString() }).eq('id', quoteId)
    await admin.from('quotes').update({ status: 'rejected' }).eq('enquiry_id', quote.enquiry_id).neq('id', quoteId)
    await admin.from('jobs').update({ status: 'quote_selected' }).eq('id', quote.job_id)
    await admin.from('enquiries').update({ status: 'installer_chosen' }).eq('id', quote.enquiry_id)

    // Create Stripe payment intent — use Connect if installer is onboarded
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
    // quotes.deposit_amount is ALREADY stored in pence (see quotes/submit) — do NOT multiply by 100
    const depositPence = quote.deposit_amount
    // WattSmart fee on the deposit: 5% of the deposit, in pence
    const wattsmartFeePence = Math.round(depositPence * 0.05)

    const installerRecord = Array.isArray(quote.installers) ? quote.installers[0] : quote.installers
    const connectAccountId = (installerRecord as { stripe_connect_account_id?: string; stripe_connect_onboarded?: boolean } | null)?.stripe_connect_account_id
    const connectOnboarded = (installerRecord as { stripe_connect_account_id?: string; stripe_connect_onboarded?: boolean } | null)?.stripe_connect_onboarded

    const intentParams: Stripe.PaymentIntentCreateParams = {
      amount: depositPence,
      currency: 'gbp',
      metadata: {
        enquiry_id: quote.enquiry_id,
        quote_id: quoteId,
        installer_id: quote.installer_id,
      },
    }

    if (connectAccountId && connectOnboarded) {
      intentParams.application_fee_amount = wattsmartFeePence
      intentParams.transfer_data = { destination: connectAccountId }
    } else {
      console.warn(`Installer ${quote.installer_id} does not have Stripe Connect set up — manual split required`)
    }

    const intent = await stripe.paymentIntents.create(intentParams)

    // Store payment record (not yet confirmed) — all amounts in integer pence
    const { error: paymentInsertError } = await admin.from('payments').insert({
      enquiry_id: quote.enquiry_id,
      quote_id: quoteId,
      installer_id: quote.installer_id,
      type: 'deposit',
      amount: depositPence,
      wattsmart_fee: wattsmartFeePence,
      installer_amount: depositPence - wattsmartFeePence,
      stripe_payment_intent_id: intent.id,
      status: 'pending',
    })

    if (paymentInsertError) {
      // The payment intent already exists in Stripe — do NOT strand the user.
      // Log the intent id so the payment can be reconciled manually.
      console.error(
        `Failed to insert payment record for payment_intent ${intent.id} (enquiry ${quote.enquiry_id}):`,
        paymentInsertError
      )
      Sentry.captureException(new Error(`Payment record insert failed: ${paymentInsertError.message}`), {
        extra: {
          payment_intent_id: intent.id,
          enquiry_id: quote.enquiry_id,
          quote_id: quoteId,
          installer_id: quote.installer_id,
          supabase_error: paymentInsertError,
        },
      })
    }

    // Return only what's needed for the payment form — NO installer details yet
    // depositAmount is in pence; the client formats it with formatCurrency (pence -> pounds)
    return NextResponse.json({
      clientSecret: intent.client_secret,
      depositAmount: depositPence,
      reference: enquiry.reference,
    })
  } catch (err) {
    console.error('Quote select error:', err)
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Failed to select quote' }, { status: 500 })
  }
}
