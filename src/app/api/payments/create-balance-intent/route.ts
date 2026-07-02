import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import * as Sentry from '@sentry/nextjs'

const MIN_FEE_PENCE = 7500 // £75 floor on the cumulative WattSmart fee

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
  try {
    const { jobId } = await req.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await createAdminClient()

    // Fetch job with enquiry (for ownership check) and installer (for Stripe Connect).
    // NOTE: enquiries has NO total_price column — the total comes from the selected quote.
    const { data: job } = await admin
      .from('jobs')
      .select(`
        id,
        enquiry_id,
        installer_id,
        enquiries (
          id,
          customers ( user_id )
        ),
        installers (
          stripe_connect_account_id,
          stripe_connect_onboarded
        )
      `)
      .eq('id', jobId)
      .single()

    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enquiry = (job.enquiries as any) as {
      id: string
      customers: { user_id: string }
    } | null

    if (!enquiry) return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 })

    // Verify customer owns this job
    if (enquiry.customers?.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Total job value comes from the SELECTED quote — stored in pence
    const { data: selectedQuote } = await admin
      .from('quotes')
      .select('total_price')
      .eq('enquiry_id', enquiry.id)
      .eq('status', 'selected')
      .maybeSingle()

    if (!selectedQuote?.total_price) {
      return NextResponse.json({ error: 'Total price not set' }, { status: 400 })
    }

    const totalPence = selectedQuote.total_price

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const installer = (job.installers as any) as {
      stripe_connect_account_id: string | null
      stripe_connect_onboarded: boolean
    } | null

    // Fetch the deposit already paid (payments.amount / wattsmart_fee are pence).
    // Successful payments are 'held' (set by webhook/reveal) then 'released'.
    const { data: depositPayment } = await admin
      .from('payments')
      .select('amount, wattsmart_fee')
      .eq('enquiry_id', enquiry.id)
      .eq('type', 'deposit')
      .in('status', ['held', 'released'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const depositPaidPence = depositPayment?.amount ?? 0
    // Fee already collected on the deposit (5% at source); fall back to 5% for legacy rows
    const depositFeePence = depositPayment?.wattsmart_fee ?? Math.round(depositPaidPence * 0.05)

    // All amounts in integer pence.
    // Cumulative fee: total_fee = max(5% of total, £75) → fee on this balance payment
    // is whatever remains after the deposit fee already taken.
    const balancePence = totalPence - depositPaidPence
    if (balancePence <= 0) {
      return NextResponse.json({ error: 'No balance remaining' }, { status: 400 })
    }

    const totalFeePence = Math.max(Math.round(totalPence * 0.05), MIN_FEE_PENCE)
    const balanceFeePence = Math.min(Math.max(totalFeePence - depositFeePence, 0), balancePence)
    const installerGetsPence = balancePence - balanceFeePence

    const isOnboarded =
      installer?.stripe_connect_onboarded && installer?.stripe_connect_account_id

    const paymentIntent = await stripe.paymentIntents.create({
      amount: balancePence,
      currency: 'gbp',
      metadata: {
        jobId,
        enquiryId: enquiry.id,
        installerId: job.installer_id ?? '',
        type: 'balance',
      },
      ...(isOnboarded && {
        application_fee_amount: balanceFeePence,
        transfer_data: { destination: installer!.stripe_connect_account_id! },
      }),
    })

    // Insert payment record — type must be 'deposit' or 'final' (check constraint);
    // the balance payment is the final one. All amounts integer pence.
    const { error: paymentInsertError } = await admin.from('payments').insert({
      enquiry_id: enquiry.id,
      installer_id: job.installer_id,
      type: 'final',
      amount: balancePence,
      wattsmart_fee: balanceFeePence,
      installer_amount: installerGetsPence,
      stripe_payment_intent_id: paymentIntent.id,
      status: 'pending',
    })

    if (paymentInsertError) {
      // The payment intent already exists in Stripe — don't strand the user.
      // Log the intent id so the payment can be reconciled manually.
      console.error(
        `Failed to insert balance payment record for payment_intent ${paymentIntent.id} (enquiry ${enquiry.id}):`,
        paymentInsertError
      )
      Sentry.captureException(new Error(`Balance payment record insert failed: ${paymentInsertError.message}`), {
        extra: {
          payment_intent_id: paymentIntent.id,
          enquiry_id: enquiry.id,
          job_id: jobId,
          supabase_error: paymentInsertError,
        },
      })
    }

    // All amounts returned in pence — the client formats pence -> pounds
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      balanceAmount: balancePence,
      totalPrice: totalPence,
      depositPaid: depositPaidPence,
    })
  } catch (err) {
    console.error('Create balance intent error:', err)
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Payment setup failed' }, { status: 500 })
  }
}
