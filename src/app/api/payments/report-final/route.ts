import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendFeeInvoice } from '@/lib/email'
import { formatCurrency } from '@/lib/utils'
import * as Sentry from '@sentry/nextjs'

const MIN_FEE_PENCE = 7500 // £75 floor

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

    // Ownership check: installer must have a job for this enquiry
    const { data: job } = await admin.from('jobs')
      .select('id')
      .eq('enquiry_id', enquiryId)
      .eq('installer_id', installer.id)
      .maybeSingle()
    if (!job) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Idempotency: return existing final payment if already reported
    const { data: existing } = await admin.from('payments')
      .select('id')
      .eq('enquiry_id', enquiryId)
      .eq('installer_id', installer.id)
      .eq('type', 'final')
      .maybeSingle()
    if (existing) {
      const { data: existingInvoice } = await admin.from('fee_invoices')
        .select('id')
        .eq('payment_id', existing.id)
        .maybeSingle()
      return NextResponse.json({ invoiceId: existingInvoice?.id })
    }

    // finalAmount arrives in POUNDS from the installer form — convert to pence once here
    const amountPence = Math.round(parseFloat(finalAmount) * 100)

    // Look up the deposit payment already collected for this enquiry.
    // Only count deposits whose fee was actually taken (paid via Stripe): 'held' or 'released'.
    // Valid payment statuses are: pending, held, released, refunded (001_initial_schema.sql).
    const { data: depositPayment } = await admin
      .from('payments')
      .select('amount, wattsmart_fee')
      .eq('enquiry_id', enquiryId)
      .eq('type', 'deposit')
      .in('status', ['held', 'released'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const depositFeePence = depositPayment?.wattsmart_fee ?? 0

    // Fee formula (all pence): total_fee = max(5% of final job value, £75 floor);
    // invoice the remainder after the deposit fee already collected at source.
    const totalFeePence = Math.max(Math.round(amountPence * 0.05), MIN_FEE_PENCE)
    const invoiceAmountPence = Math.max(totalFeePence - depositFeePence, 0)

    const { data: payment, error: paymentError } = await admin
      .from('payments')
      .insert({
        enquiry_id: enquiryId,
        installer_id: installer.id,
        type: 'final',
        amount: amountPence,
        wattsmart_fee: totalFeePence,
        installer_amount: amountPence - totalFeePence,
        status: 'held',
        paid_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (paymentError || !payment) {
      throw new Error(`Final payment insert failed: ${paymentError?.message ?? 'no row returned'}`)
    }

    // Create fee invoice for the remaining amount due (total fee minus deposit fee collected)
    const dueAt = new Date(Date.now() + 30 * 86400000).toISOString()
    const { data: invoice, error: invoiceError } = await admin
      .from('fee_invoices')
      .insert({
        payment_id: payment.id,
        installer_id: installer.id,
        amount: invoiceAmountPence,
        status: 'issued',
        due_at: dueAt,
      })
      .select()
      .single()

    if (invoiceError || !invoice) {
      throw new Error(`Fee invoice insert failed: ${invoiceError?.message ?? 'no row returned'}`)
    }

    const { data: enquiry } = await admin
      .from('enquiries')
      .select('reference')
      .eq('id', enquiryId)
      .single()

    await sendFeeInvoice(
      installer.contact_email,
      enquiry?.reference || '',
      formatCurrency(invoiceAmountPence),
      new Date(dueAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      `${process.env.NEXT_PUBLIC_SITE_URL || 'https://wattsmart.co.uk'}/installer/invoices/${invoice.id}`,
      {
        totalInstallFee: formatCurrency(amountPence),
        wattsmartTotalFee: formatCurrency(totalFeePence),
        depositFeeCollected: formatCurrency(depositFeePence),
        amountNowDue: formatCurrency(invoiceAmountPence),
      }
    ).catch(console.error)

    return NextResponse.json({ invoiceId: invoice.id })
  } catch (err) {
    console.error('Report final payment error:', err)
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Failed to report payment' }, { status: 500 })
  }
}
