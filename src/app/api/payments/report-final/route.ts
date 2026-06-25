import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendFeeInvoice } from '@/lib/email'
import { formatCurrency } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { enquiryId, finalAmount } = await req.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await createAdminClient()

    const { data: installer } = await admin
      .from('installers')
      .select('id, contact_email')
      .eq('user_id', user.id)
      .single()

    if (!installer) return NextResponse.json({ error: 'Installer not found' }, { status: 404 })

    const amountPence = Math.round(parseFloat(finalAmount) * 100)
    const fee = Math.round(amountPence * 0.05)

    const { data: payment } = await admin
      .from('payments')
      .insert({
        enquiry_id: enquiryId,
        installer_id: installer.id,
        type: 'final',
        amount: amountPence,
        wattsmart_fee: fee,
        installer_amount: amountPence - fee,
        status: 'held',
        paid_at: new Date().toISOString(),
      })
      .select()
      .single()

    // Create fee invoice (due in 30 days)
    const dueAt = new Date(Date.now() + 30 * 86400000).toISOString()
    const { data: invoice } = await admin
      .from('fee_invoices')
      .insert({
        payment_id: payment.id,
        installer_id: installer.id,
        amount: fee,
        status: 'issued',
        due_at: dueAt,
      })
      .select()
      .single()

    const { data: enquiry } = await admin
      .from('enquiries')
      .select('reference')
      .eq('id', enquiryId)
      .single()

    await sendFeeInvoice(
      installer.contact_email,
      enquiry?.reference || '',
      formatCurrency(fee),
      new Date(dueAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      `${process.env.NEXT_PUBLIC_SITE_URL || 'https://wattsmart.co.uk'}/installer/invoices/${invoice.id}`
    ).catch(console.error)

    return NextResponse.json({ invoiceId: invoice.id })
  } catch (err) {
    console.error('Report final payment error:', err)
    return NextResponse.json({ error: 'Failed to report payment' }, { status: 500 })
  }
}
