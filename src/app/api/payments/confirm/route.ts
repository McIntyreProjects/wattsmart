import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendDepositConfirmedCustomer, sendDepositConfirmedInstaller } from '@/lib/email'
import { formatCurrency } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { paymentIntentId } = await req.json()
    const admin = await createAdminClient()

    const { data: payment } = await admin
      .from('payments')
      .select('id, enquiry_id, installer_id, amount')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single()

    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })

    await admin.from('payments').update({ status: 'held', paid_at: new Date().toISOString() }).eq('id', payment.id)
    await admin.from('enquiries').update({ status: 'deposit_paid' }).eq('id', payment.enquiry_id)

    const { data: enquiry } = await admin
      .from('enquiries')
      .select('reference, customers(user_id)')
      .eq('id', payment.enquiry_id)
      .single()

    const { data: installer } = await admin
      .from('installers')
      .select('contact_email, contact_name')
      .eq('id', payment.installer_id)
      .single()

    const { data: userList } = await admin.auth.admin.listUsers()
    const custUserId = (enquiry?.customers as { user_id: string })?.user_id
    const custUser = userList?.users.find(u => u.id === custUserId)

    const amountStr = formatCurrency(payment.amount)
    const ref = enquiry?.reference || ''

    if (custUser?.email) {
      await sendDepositConfirmedCustomer(custUser.email, ref, amountStr).catch(console.error)
    }
    if (installer?.contact_email) {
      await sendDepositConfirmedInstaller(installer.contact_email, ref).catch(console.error)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Confirm payment error:', err)
    return NextResponse.json({ error: 'Failed to confirm payment' }, { status: 500 })
  }
}
