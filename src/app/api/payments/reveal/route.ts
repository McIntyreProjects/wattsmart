import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendDepositConfirmedCustomer, sendDepositConfirmedInstaller, sendInstallerChosen } from '@/lib/email'
import { formatCurrency } from '@/lib/utils'

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
      .select('id, enquiry_id, installer_id, amount, status')
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

    // Idempotent — only update if not already held
    if (payment.status !== 'held') {
      await admin.from('payments').update({ status: 'held', paid_at: new Date().toISOString() }).eq('id', payment.id)
      await admin.from('enquiries').update({ status: 'deposit_paid' }).eq('id', payment.enquiry_id)

      const { data: installer } = await admin
        .from('installers')
        .select('contact_email')
        .eq('id', payment.installer_id)
        .single()

      const { data: job } = await admin
        .from('jobs')
        .select('id')
        .eq('enquiry_id', payment.enquiry_id)
        .eq('installer_id', payment.installer_id)
        .single()

      const { data: userList } = await admin.auth.admin.listUsers()
      const custUser = userList?.users.find(u => u.id === user.id)
      const ref = enquiry.reference
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wattsmart.co.uk'

      if (custUser?.email) {
        await sendDepositConfirmedCustomer(custUser.email, ref, formatCurrency(payment.amount)).catch(console.error)
      }
      if (installer?.contact_email) {
        await sendInstallerChosen(
          installer.contact_email,
          ref,
          `${siteUrl}/installer/jobs/${job?.id}`
        ).catch(console.error)
        await sendDepositConfirmedInstaller(installer.contact_email, ref).catch(console.error)
      }
    }

    // Reveal installer — only after confirmed payment
    const { data: installer } = await admin
      .from('installers')
      .select('id, company_name, trading_name, contact_name, contact_email, contact_phone')
      .eq('id', payment.installer_id)
      .single()

    return NextResponse.json({
      ok: true,
      installer: installer ? {
        id: installer.id,
        company_name: installer.trading_name || installer.company_name,
        contact_name: installer.contact_name,
        contact_email: installer.contact_email,
        contact_phone: installer.contact_phone,
      } : null,
    })
  } catch (err) {
    console.error('Payment reveal error:', err)
    return NextResponse.json({ error: 'Failed to confirm payment' }, { status: 500 })
  }
}
