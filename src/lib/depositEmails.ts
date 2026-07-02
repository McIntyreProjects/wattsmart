import type { SupabaseClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'
import { sendDepositConfirmedCustomer, sendDepositConfirmedInstaller, sendInstallerChosen } from '@/lib/email'
import { formatCurrency } from '@/lib/utils'

// Sends the deposit-confirmation emails (customer + installer) exactly once
// per payment, whichever path gets there first — the Stripe webhook
// (payment_intent.succeeded) or /api/payments/reveal.
//
// Idempotency: a single UPDATE ... WHERE emails_sent_at IS NULL claims the
// send (column added in migration 010). Only the path that wins the claim
// sends; the other sees zero rows returned and skips.
export async function claimAndSendDepositEmails(admin: SupabaseClient, paymentId: string): Promise<void> {
  const { data: claimed, error: claimError } = await admin
    .from('payments')
    .update({ emails_sent_at: new Date().toISOString() })
    .eq('id', paymentId)
    .eq('type', 'deposit')
    .is('emails_sent_at', null)
    .select('id, enquiry_id, installer_id, amount')
    .maybeSingle()

  if (claimError) {
    // A failed claim (e.g. emails_sent_at column missing pre-migration, or a
    // DB error) must be loud — otherwise deposit emails vanish untraceably.
    Sentry.captureException(new Error(`Deposit email claim failed for payment ${paymentId}: ${claimError.message}`))
    console.error('Deposit email claim error:', claimError)
    return
  }

  if (!claimed) return // already claimed (or not a deposit payment)

  const { data: enquiry } = await admin
    .from('enquiries')
    .select('reference, customers(user_id)')
    .eq('id', claimed.enquiry_id)
    .single()

  if (!enquiry) {
    Sentry.captureException(new Error(`Deposit emails claimed but enquiry ${claimed.enquiry_id} not found (payment ${paymentId})`))
    return
  }
  const ref = enquiry.reference as string
  const custRecord = Array.isArray(enquiry.customers) ? enquiry.customers[0] : enquiry.customers
  const customerUserId = (custRecord as { user_id: string } | null)?.user_id

  const { data: installer } = await admin
    .from('installers')
    .select('contact_email')
    .eq('id', claimed.installer_id)
    .single()

  const { data: job } = await admin
    .from('jobs')
    .select('id')
    .eq('enquiry_id', claimed.enquiry_id)
    .eq('installer_id', claimed.installer_id)
    .maybeSingle()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wattsmart.co.uk'

  if (customerUserId) {
    const { data: { user: custUser } } = await admin.auth.admin.getUserById(customerUserId)
    if (custUser?.email) {
      await sendDepositConfirmedCustomer(custUser.email, ref, formatCurrency(claimed.amount)).catch((e) => { Sentry.captureException(e); console.error(e) })
    }
  }

  if (installer?.contact_email) {
    await sendInstallerChosen(
      installer.contact_email,
      ref,
      `${siteUrl}/installer/jobs/${job?.id}`
    ).catch((e) => { Sentry.captureException(e); console.error(e) })
    await sendDepositConfirmedInstaller(installer.contact_email, ref).catch((e) => { Sentry.captureException(e); console.error(e) })
  }
}
