import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import * as Sentry from '@sentry/nextjs'
import { sendAdminAlert } from '@/lib/email'

// Step 1 of the payment flow (UK Consumer Contracts Regulations).
//
// Selecting a quote returns the installer's identity, geographical address,
// terms link and cancellation-rights context so the customer can read them
// BEFORE paying. No PaymentIntent is created here — that happens only in
// /api/quotes/acknowledge, after the customer's acknowledgement is recorded.
// Other quotes are NOT rejected here either — that happens only once the
// deposit payment actually succeeds (reveal route / Stripe webhook).
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
      .select('id, enquiry_id, installer_id, job_id, deposit_amount, status')
      .eq('id', quoteId)
      .single()

    if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 })

    // A rejected quote can never be selected. Re-selecting an already
    // 'selected' quote is allowed so the customer can re-open the disclosure
    // step after navigating away without paying.
    if (quote.status === 'rejected') {
      return NextResponse.json({ error: 'Quote is no longer available' }, { status: 400 })
    }

    // Once a deposit has actually been paid on this enquiry, no quote can be
    // (re)selected — prevents double deposits and status regressions.
    const { data: paidDeposit } = await admin
      .from('payments')
      .select('id')
      .eq('enquiry_id', quote.enquiry_id)
      .eq('type', 'deposit')
      .in('status', ['held', 'released'])
      .limit(1)
      .maybeSingle()
    if (paidDeposit) {
      return NextResponse.json({ error: 'A deposit has already been paid for this enquiry' }, { status: 400 })
    }

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

    // ── CCR completeness gate — BEFORE any state changes ──────────────
    const { data: installer } = await admin
      .from('installers')
      .select('id, company_name, business_address, contact_name, contact_email, contact_phone, companies_house_number, terms_url, terms_storage_path')
      .eq('id', quote.installer_id)
      .single()

    const businessAddress = installer?.business_address?.trim() || ''
    const hasTermsRef = Boolean(installer?.terms_url || installer?.terms_storage_path)

    if (!installer || !businessAddress || !hasTermsRef) {
      // Alert the team — this installer is blocking a customer payment.
      const alertEmail = process.env.ADMIN_EMAIL || process.env.SMTP_FROM
      const installerName = installer?.company_name ?? quote.installer_id
      if (alertEmail) {
        const missing = [
          !businessAddress ? 'business address' : null,
          !hasTermsRef ? 'terms & conditions' : null,
        ].filter(Boolean).join(' and ')
        await sendAdminAlert(
          alertEmail,
          `Installer details incomplete — ${installerName} blocked quote ${quoteId}`,
          `
          <p>A customer tried to choose a quote from <strong>${installerName}</strong> (enquiry <strong>${enquiry.reference}</strong>, quote <strong>${quoteId}</strong>), but the installer is missing their <strong>${missing || 'disclosure details'}</strong>.</p>
          <p>UK Consumer Contracts Regulations require these to be shown before payment, so the payment is blocked until the installer's record is completed.</p>
          `
        ).catch((err) => {
          console.error('Installer-details-incomplete admin alert failed:', err)
          Sentry.captureException(err)
        })
      }
      return NextResponse.json({ error: 'installer_details_incomplete' }, { status: 409 })
    }

    // Resolve the terms link before touching any state — if we can't show
    // the terms, the quote must not move forward.
    let termsHref: string | null = installer.terms_url || null
    if (!termsHref && installer.terms_storage_path) {
      const { data: signed } = await admin.storage
        .from('installer-terms')
        .createSignedUrl(installer.terms_storage_path, 600) // 10 minutes
      termsHref = signed?.signedUrl ?? null
    }
    if (!termsHref) {
      Sentry.captureMessage('Failed to create signed URL for installer terms', {
        level: 'error',
        extra: { installer_id: installer.id, terms_storage_path: installer.terms_storage_path, quote_id: quoteId },
      })
      return NextResponse.json({ error: 'Failed to load installer terms' }, { status: 500 })
    }

    // Mark quote selected (other quotes stay 'submitted' until payment
    // succeeds). If the customer previously selected a different quote and
    // changed their mind before paying, demote it back to 'submitted' so
    // there is at most one selected quote per enquiry.
    // Demote any previously selected quote AND its job first, so an installer
    // the customer moved away from doesn't keep seeing "you've been chosen".
    const { data: previouslySelected } = await admin
      .from('quotes')
      .select('id, job_id')
      .eq('enquiry_id', quote.enquiry_id)
      .neq('id', quoteId)
      .eq('status', 'selected')
    for (const prev of previouslySelected || []) {
      await admin.from('quotes').update({ status: 'submitted' }).eq('id', prev.id)
      if (prev.job_id) {
        await admin.from('jobs').update({ status: 'quote_submitted' }).eq('id', prev.job_id).eq('status', 'quote_selected')
      }
    }

    await admin.from('quotes').update({ status: 'selected', selected_at: new Date().toISOString() }).eq('id', quoteId)
    await admin.from('jobs').update({ status: 'quote_selected' }).eq('id', quote.job_id)
    await admin.from('enquiries').update({ status: 'installer_chosen' }).eq('id', quote.enquiry_id)

    // Only certifications an admin has actually verified — badges shown to
    // the customer must reflect what this installer really holds.
    const { data: verifiedCerts } = await admin
      .from('certifications')
      .select('type')
      .eq('installer_id', quote.installer_id)
      .eq('status', 'verified')

    // The pre-payment disclosure payload (CCR): identity, address, contact
    // details, terms link. depositAmount is in pence for display only — the
    // authoritative amount is re-read server-side in /api/quotes/acknowledge.
    return NextResponse.json({
      quoteId,
      installer: {
        company_name: installer.company_name,
        business_address: installer.business_address,
        contact_name: installer.contact_name,
        contact_email: installer.contact_email,
        contact_phone: installer.contact_phone,
        companies_house_number: installer.companies_house_number,
        verified_certifications: (verifiedCerts || []).map(c => c.type),
      },
      termsHref,
      depositAmount: quote.deposit_amount,
    })
  } catch (err) {
    console.error('Quote select error:', err)
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Failed to select quote' }, { status: 500 })
  }
}
