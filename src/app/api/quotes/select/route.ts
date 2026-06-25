import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendInstallerChosen } from '@/lib/email'

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

    if (!enquiry || (enquiry.customers as { user_id: string })?.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Mark quote as selected
    await admin.from('quotes').update({ status: 'selected', selected_at: new Date().toISOString() }).eq('id', quoteId)

    // Reject other quotes
    await admin
      .from('quotes')
      .update({ status: 'rejected' })
      .eq('enquiry_id', quote.enquiry_id)
      .neq('id', quoteId)

    // Update job and enquiry status
    await admin.from('jobs').update({ status: 'quote_selected' }).eq('id', quote.job_id)
    await admin.from('enquiries').update({ status: 'installer_chosen' }).eq('id', quote.enquiry_id)

    // Fetch installer details for reveal
    const { data: installer } = await admin
      .from('installers')
      .select('id, company_name, contact_name, contact_email, contact_phone')
      .eq('id', quote.installer_id)
      .single()

    // Notify installer
    if (installer) {
      await sendInstallerChosen(
        installer.contact_email,
        enquiry.reference,
        `${process.env.NEXT_PUBLIC_SITE_URL || 'https://wattsmart.co.uk'}/installer/jobs/${quote.job_id}`
      ).catch(console.error)
    }

    return NextResponse.json({ installer })
  } catch (err) {
    console.error('Quote select error:', err)
    return NextResponse.json({ error: 'Failed to select quote' }, { status: 500 })
  }
}
