import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendDepositConfirmedCustomer, sendDepositConfirmedInstaller, sendInstallerChosen } from '@/lib/email'
import { formatCurrency } from '@/lib/utils'

export async function POST(req: NextRequest) {
  // Only callable from internal server (Stripe webhook or post-payment client call with secret)
  const secret = req.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { paymentIntentId } = await req.json()
    const admin = await createAdminClient()

    const { data: payment } = await admin
      .from('payments')
      .select('id, enquiry_id, installer_id, amount')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single()

    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })

    // Update payment and enquiry status
    await admin.from('payments').update({ status: 'held', paid_at: new Date().toISOString() }).eq('id', payment.id)
    await admin.from('enquiries').update({ status: 'deposit_paid' }).eq('id', payment.enquiry_id)

    const { data: enquiry } = await admin
      .from('enquiries')
      .select('reference, customers(user_id)')
      .eq('id', payment.enquiry_id)
      .single()

    const { data: installer } = await admin
      .from('installers')
      .select('id, company_name, trading_name, contact_name, contact_email, contact_phone')
      .eq('id', payment.installer_id)
      .single()

    // Get the job for the installer portal link
    const { data: job } = await admin
      .from('jobs')
      .select('id')
      .eq('enquiry_id', payment.enquiry_id)
      .eq('installer_id', payment.installer_id)
      .single()

    const { data: userList } = await admin.auth.admin.listUsers()
    const custRec = Array.isArray(enquiry?.customers) ? enquiry?.customers[0] : enquiry?.customers
    const custUserId = (custRec as { user_id: string } | null)?.user_id
    const custUser = userList?.users.find(u => u.id === custUserId)

    const amountStr = formatCurrency(payment.amount)
    const ref = enquiry?.reference || ''
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wattsmart.co.uk'

    // Notify customer
    if (custUser?.email) {
      await sendDepositConfirmedCustomer(custUser.email, ref, amountStr).catch(console.error)
    }

    // Notify installer — NOW is the right time (deposit is confirmed)
    if (installer?.contact_email) {
      await sendInstallerChosen(
        installer.contact_email,
        ref,
        `${siteUrl}/installer/jobs/${job?.id}`
      ).catch(console.error)
      await sendDepositConfirmedInstaller(installer.contact_email, ref).catch(console.error)
    }

    // Return installer details now that payment is confirmed — this is the reveal moment
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
    console.error('Confirm payment error:', err)
    return NextResponse.json({ error: 'Failed to confirm payment' }, { status: 500 })
  }
}
