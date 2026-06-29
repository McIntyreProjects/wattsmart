import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
  try {
    const { quoteId } = await req.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await createAdminClient()

    const { data: quote } = await admin
      .from('quotes')
      .select('id, enquiry_id, installer_id, deposit_amount, total_price, job_id')
      .eq('id', quoteId)
      .eq('status', 'selected')
      .single()

    if (!quote) return NextResponse.json({ error: 'Quote not found or not selected' }, { status: 404 })

    const { data: enquiry } = await admin
      .from('enquiries')
      .select('reference, customers(user_id)')
      .eq('id', quote.enquiry_id)
      .single()

    const custRec = Array.isArray(enquiry?.customers) ? enquiry.customers[0] : enquiry?.customers
    if ((custRec as { user_id: string } | null)?.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: installer } = await admin
      .from('installers')
      .select('stripe_account_id')
      .eq('id', quote.installer_id)
      .single()

    const fee = Math.round(quote.deposit_amount * 0.05)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: quote.deposit_amount,
      currency: 'gbp',
      capture_method: 'manual',
      metadata: {
        quoteId,
        enquiryId: quote.enquiry_id,
        installerId: quote.installer_id,
        reference: enquiry?.reference || '',
      },
      ...(installer?.stripe_account_id && {
        transfer_data: { destination: installer.stripe_account_id },
        application_fee_amount: fee,
      }),
    })

    // Create payment record
    await admin.from('payments').insert({
      enquiry_id: quote.enquiry_id,
      quote_id: quoteId,
      installer_id: quote.installer_id,
      type: 'deposit',
      amount: quote.deposit_amount,
      wattsmart_fee: fee,
      installer_amount: quote.deposit_amount - fee,
      stripe_payment_intent_id: paymentIntent.id,
      status: 'pending',
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (err) {
    console.error('Create intent error:', err)
    return NextResponse.json({ error: 'Payment setup failed' }, { status: 500 })
  }
}
