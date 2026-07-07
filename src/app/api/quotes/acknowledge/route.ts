import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import * as Sentry from '@sentry/nextjs'

// Step 2 of the payment flow (UK Consumer Contracts Regulations).
//
// Records the customer's acknowledgement that they were shown the
// installer's identity, address, terms and cancellation rights — then, and
// ONLY then, creates the Stripe PaymentIntent. If the acknowledgement row
// cannot be written, no PaymentIntent is created and payment cannot proceed.
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
      .select('id, enquiry_id, installer_id, job_id, deposit_amount, status')
      .eq('id', quoteId)
      .single()

    if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 })

    // The disclosure step (/api/quotes/select) must have run first.
    if (quote.status !== 'selected') {
      return NextResponse.json({ error: 'quote_not_selected' }, { status: 409 })
    }

    // A paid deposit on the enquiry means no further payment can be started —
    // prevents a second deposit via re-selecting the same quote.
    const { data: paidDeposit } = await admin
      .from('payments')
      .select('id')
      .eq('enquiry_id', quote.enquiry_id)
      .eq('type', 'deposit')
      .in('status', ['held', 'released'])
      .limit(1)
      .maybeSingle()
    if (paidDeposit) {
      return NextResponse.json({ error: 'A deposit has already been paid for this enquiry' }, { status: 400 })
    }

    // Verify customer owns enquiry — same chain as /api/quotes/select
    const { data: enquiry } = await admin
      .from('enquiries')
      .select('id, reference, customers(user_id)')
      .eq('id', quote.enquiry_id)
      .single()

    const custRecord = Array.isArray(enquiry?.customers) ? enquiry.customers[0] : enquiry?.customers
    if (!enquiry || (custRecord as { user_id: string } | null)?.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Re-verify installer completeness — the disclosure shown at select time
    // must still be available to snapshot here.
    const { data: installer } = await admin
      .from('installers')
      .select('id, company_name, business_address, terms_url, terms_storage_path, stripe_connect_account_id, stripe_connect_onboarded')
      .eq('id', quote.installer_id)
      .single()

    const businessAddress = installer?.business_address?.trim() || ''
    // The terms reference actually shown: the https URL when set, otherwise
    // the storage path behind the signed URL the customer was given.
    const termsRef = installer?.terms_url || installer?.terms_storage_path || ''

    if (!installer || !businessAddress || !termsRef) {
      return NextResponse.json({ error: 'installer_details_incomplete' }, { status: 409 })
    }

    // Idempotent: one acknowledgement per quote (unique quote_id). If a row
    // already exists — e.g. the customer retried after a network blip — keep
    // the original snapshot and skip the insert.
    const { data: existingAck } = await admin
      .from('disclosure_acknowledgements')
      .select('id')
      .eq('quote_id', quoteId)
      .maybeSingle()

    if (!existingAck) {
      const { error: ackError } = await admin.from('disclosure_acknowledgements').insert({
        quote_id: quoteId,
        enquiry_id: quote.enquiry_id,
        installer_id: quote.installer_id,
        customer_user_id: user.id,
        installer_name_shown: installer.company_name,
        installer_address_shown: installer.business_address,
        installer_terms_ref: termsRef,
      })

      // 23505 = unique violation: a concurrent request recorded the
      // acknowledgement first, which still satisfies the requirement.
      if (ackError && ackError.code !== '23505') {
        console.error(`Disclosure acknowledgement insert failed for quote ${quoteId}:`, ackError)
        Sentry.captureException(new Error(`Disclosure acknowledgement insert failed: ${ackError.message}`), {
          extra: {
            quote_id: quoteId,
            enquiry_id: quote.enquiry_id,
            installer_id: quote.installer_id,
            supabase_error: ackError,
          },
        })
        // Payment must NOT proceed without a recorded acknowledgement.
        return NextResponse.json({ error: 'Failed to record acknowledgement' }, { status: 500 })
      }
    }

    // ── Acknowledgement recorded — now create the payment ─────────────
    // Create Stripe payment intent — use Connect if installer is onboarded
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
    // quotes.deposit_amount is ALREADY stored in pence (see quotes/submit) — do NOT multiply by 100
    const depositPence = quote.deposit_amount
    // WattSmart fee on the deposit: 5% of the deposit, in pence
    const wattsmartFeePence = Math.round(depositPence * 0.05)

    const connectAccountId = installer.stripe_connect_account_id as string | null
    const connectOnboarded = installer.stripe_connect_onboarded as boolean | null

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

    // depositAmount is in pence; the client formats it with formatCurrency (pence -> pounds)
    return NextResponse.json({
      clientSecret: intent.client_secret,
      depositAmount: depositPence,
    })
  } catch (err) {
    console.error('Quote acknowledge error:', err)
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Failed to record acknowledgement' }, { status: 500 })
  }
}
