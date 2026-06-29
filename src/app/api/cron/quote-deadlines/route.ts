import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const admin = await createAdminClient()
    const now = new Date().toISOString()

    // Find jobs past their quote deadline with no quote submitted
    const { data: expiredJobs } = await admin
      .from('jobs')
      .select('id, enquiry_id, installer_id')
      .eq('status', 'brief_sent')
      .lt('quote_deadline_at', now)

    let reassigned = 0

    for (const job of expiredJobs || []) {
      // Get enquiry details
      const { data: enquiry } = await admin
        .from('enquiries')
        .select('products, postcode, status')
        .eq('id', job.enquiry_id)
        .single()

      if (!enquiry || enquiry.status !== 'quotes_requested') continue

      // Count existing quotes for this enquiry
      const { count: quoteCount } = await admin
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('enquiry_id', job.enquiry_id)

      if ((quoteCount || 0) >= 3) continue

      // Find next best installer not already assigned
      const { data: assignedInstallers } = await admin
        .from('jobs')
        .select('installer_id')
        .eq('enquiry_id', job.enquiry_id)

      const excludeIds = (assignedInstallers || []).map(j => j.installer_id)

      const postcodeArea = enquiry.postcode.split(' ')[0].replace(/\d+$/, '')

      const { data: candidates } = await admin
        .from('installers')
        .select('id, contact_email, coverage_postcodes, products')
        .eq('status', 'active')
        .not('id', 'in', `(${excludeIds.join(',')})`)

      const next = (candidates || []).find(inst => {
        const covers = inst.coverage_postcodes.some((p: string) => postcodeArea.startsWith(p.trim().toUpperCase()))
        const hasProducts = (enquiry.products as string[]).every(pr => inst.products.includes(pr))
        return covers && hasProducts
      })

      if (next) {
        await admin.from('jobs').insert({
          enquiry_id: job.enquiry_id,
          installer_id: next.id,
          status: 'brief_sent',
        })
        reassigned++
      }

      // Mark expired job as withdrawn
      await admin.from('jobs').update({ status: 'withdrawn' }).eq('id', job.id)
    }

    return NextResponse.json({ ok: true, reassigned })
  } catch (err) {
    console.error('Quote deadline cron error:', err)
    return NextResponse.json({ error: 'Deadline check failed' }, { status: 500 })
  }
}
