import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
  try {
    const { jobId } = await req.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await createAdminClient()

    // Fetch job with enquiry (for ownership check) and installer (for Stripe Connect)
    const { data: job } = await admin
      .from('jobs')
      .select(`
        id,
        enquiry_id,
        installer_id,
        enquiries (
          id,
          total_price,
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
      total_price: number | null
      customers: { user_id: string }
    } | null

    if (!enquiry) return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 })

    // Verify customer owns this job
    if (enquiry.customers?.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!enquiry.total_price) {
      return NextResponse.json({ error: 'Total price not set' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const installer = (job.installers as any) as {
      stripe_connect_account_id: string | null
      stripe_connect_onboarded: boolean
    } | null

    // Fetch the deposit already paid
    const { data: depositPayment } = await admin
      .from('payments')
      .select('amount')
      .eq('enquiry_id', enquiry.id)
      .in('type', ['deposit'])
      .in('status', ['held', 'confirmed', 'captured'])
      .maybeSingle()

    const depositPaid = depositPayment?.amount ?? 0
    const totalPrice = enquiry.total_price

    // Fee formula: total_fee = max(total_price * 0.05, 75)
    const totalFee = Math.max(totalPrice * 0.05, 75)
    const depositFee = depositPaid * 0.05
    const balanceFee = totalFee - depositFee
    const balanceAmount = totalPrice - depositPaid
    const installerGets = balanceAmount - balanceFee

    if (balanceAmount <= 0) {
      return NextResponse.json({ error: 'No balance remaining' }, { status: 400 })
    }

    // Amounts in pence
    const balancePence = Math.round(balanceAmount * 100)
    const balanceFeePence = Math.round(balanceFee * 100)

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

    // Insert payment record
    await admin.from('payments').insert({
      enquiry_id: enquiry.id,
      installer_id: job.installer_id,
      type: 'balance',
      amount: balanceAmount,
      wattsmart_fee: balanceFee,
      installer_amount: installerGets,
      stripe_payment_intent_id: paymentIntent.id,
      status: 'pending',
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      balanceAmount,
      totalPrice,
      depositPaid,
    })
  } catch (err) {
    console.error('Create balance intent error:', err)
    return NextResponse.json({ error: 'Payment setup failed' }, { status: 500 })
  }
}
