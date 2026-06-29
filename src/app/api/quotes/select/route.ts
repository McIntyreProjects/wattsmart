import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

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
      .select('id, enquiry_id, installer_id, job_id, deposit_amount')
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

    // Create Stripe payment intent (authorise only — capture on release)
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
    const amountPence = Math.round(quote.deposit_amount * 100)
    const intent = await stripe.paymentIntents.create({
      amount: amountPence,
      currency: 'gbp',
      capture_method: 'manual',
      metadata: {
        enquiry_id: quote.enquiry_id,
        quote_id: quoteId,
        installer_id: quote.installer_id,
      },
    })

    // Store payment record (not yet confirmed)
    await admin.from('payments').insert({
      enquiry_id: quote.enquiry_id,
      installer_id: quote.installer_id,
      amount: quote.deposit_amount,
      installer_amount: quote.deposit_amount * 0.95,
      stripe_payment_intent_id: intent.id,
      status: 'pending',
    })

    // Return only what's needed for the payment form — NO installer details yet
    return NextResponse.json({
      clientSecret: intent.client_secret,
      depositAmount: quote.deposit_amount,
      reference: enquiry.reference,
    })
  } catch (err) {
    console.error('Quote select error:', err)
    return NextResponse.json({ error: 'Failed to select quote' }, { status: 500 })
  }
}
