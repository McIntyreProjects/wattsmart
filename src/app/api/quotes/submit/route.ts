import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { jobId, panelCount, systemKwp, batteryKwh, panelBrand, inverterBrand, totalPrice, depositAmount, estimatedInstallTimeframe, additionalNotes } = body

    if (!jobId || !totalPrice || !depositAmount || !estimatedInstallTimeframe) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: installer } = await supabase
      .from('installers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!installer) return NextResponse.json({ error: 'Installer not found' }, { status: 404 })

    const { data: job } = await supabase
      .from('jobs')
      .select('id, enquiry_id, status')
      .eq('id', jobId)
      .eq('installer_id', installer.id)
      .single()

    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    if (job.status !== 'brief_sent') {
      return NextResponse.json({ error: 'Quote already submitted for this job' }, { status: 400 })
    }

    const admin = await createAdminClient()

    // Count existing quotes to assign label
    const { count } = await admin
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('enquiry_id', job.enquiry_id)

    const labels = ['A', 'B', 'C']
    const label = labels[count ?? 0] || 'A'

    const { data: quote, error } = await admin
      .from('quotes')
      .insert({
        job_id: jobId,
        enquiry_id: job.enquiry_id,
        installer_id: installer.id,
        panel_count: panelCount || null,
        system_kwp: systemKwp || null,
        battery_kwh: batteryKwh || null,
        panel_brand: panelBrand || null,
        inverter_brand: inverterBrand || null,
        total_price: Math.round(parseFloat(totalPrice) * 100),
        deposit_amount: Math.round(parseFloat(depositAmount) * 100),
        estimated_install_timeframe: estimatedInstallTimeframe,
        additional_notes: additionalNotes || null,
        label,
        status: 'submitted',
      })
      .select()
      .single()

    if (error) throw error

    // Update job status
    await admin.from('jobs').update({ status: 'quote_submitted' }).eq('id', jobId)

    // Check if all 3 quotes are in — notify customer
    const { count: quoteCount } = await admin
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('enquiry_id', job.enquiry_id)
      .eq('status', 'submitted')

    if ((quoteCount ?? 0) >= 3) {
      await admin.from('enquiries').update({ status: 'quotes_received' }).eq('id', job.enquiry_id)

      // Fetch customer email and notify
      const { data: enq } = await admin
        .from('enquiries')
        .select('reference, customers(user_id)')
        .eq('id', job.enquiry_id)
        .single()

      if (enq) {
        const { data: userList } = await admin.auth.admin.listUsers()
        const custSubmit = Array.isArray(enq.customers) ? enq.customers[0] : enq.customers
        const custUserId = (custSubmit as { user_id: string } | null)?.user_id
        const custUser = userList?.users.find(u => u.id === custUserId)
        if (custUser?.email) {
          const { sendQuotesReady } = await import('@/lib/email')
          await sendQuotesReady(
            custUser.email,
            enq.reference,
            `${process.env.NEXT_PUBLIC_SITE_URL || 'https://wattsmart.co.uk'}/customer/quotes/${job.enquiry_id}`
          ).catch(console.error)
        }
      }
    }

    return NextResponse.json({ id: quote.id })
  } catch (err) {
    console.error('Quote submit error:', err)
    return NextResponse.json({ error: 'Failed to submit quote' }, { status: 500 })
  }
}
