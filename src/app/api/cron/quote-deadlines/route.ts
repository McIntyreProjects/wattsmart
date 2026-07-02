import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/lib/supabase/server'
import { sendQuotesReady, sendNoQuotesYet, sendAdminAlert } from '@/lib/email'

// Vercel invokes crons with GET and `Authorization: Bearer $CRON_SECRET`.
// POST + x-cron-secret is kept for manual/backward-compatible invocation.
function isAuthorised(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  if (req.headers.get('authorization') === `Bearer ${secret}`) return true
  if (req.headers.get('x-cron-secret') === secret) return true
  return false
}

export async function GET(req: NextRequest) {
  return handle(req)
}

export async function POST(req: NextRequest) {
  return handle(req)
}

async function handle(req: NextRequest) {
  if (!isAuthorised(req)) {
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

    // -----------------------------------------------------------------------
    // Transition enquiries that are older than 5 days with at least 1 quote
    // submitted but still in quotes_requested status — no need to wait for 3.
    // -----------------------------------------------------------------------
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()

    const { data: stalledEnquiries, error: stalledError } = await admin
      .from('enquiries')
      .select(`
        id,
        reference,
        created_at,
        customers (
          user_id
        )
      `)
      .eq('status', 'quotes_requested')
      .lt('created_at', fiveDaysAgo)

    if (stalledError) {
      Sentry.captureException(new Error(`quote-deadlines stalled-enquiries query failed: ${stalledError.message}`))
      console.error('Stalled enquiries query error:', stalledError)
    }

    let transitioned = 0
    let noQuoteNotified = 0

    // Only notify zero-quote customers once: the cron runs daily, so an
    // enquiry aged between 5 and 6 days is in the notification window exactly
    // one run.
    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wattsmart.co.uk'

    for (const enq of stalledEnquiries || []) {
      // Check if there's at least 1 submitted quote
      const { count: qCount } = await admin
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('enquiry_id', enq.id)
        .eq('status', 'submitted')

      if (!qCount || qCount < 1) {
        // Zero quotes after 5 days — tell the customer honestly and alert
        // admin so the search can be widened manually. No status change:
        // the enquiry stays in quotes_requested so late quotes still land.
        if (enq.created_at >= sixDaysAgo) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const customer = (enq.customers as any) as { user_id: string } | null
            if (customer?.user_id) {
              const { data: authUser } = await admin.auth.admin.getUserById(customer.user_id)
              if (authUser?.user?.email) {
                await sendNoQuotesYet(authUser.user.email, enq.reference, `${siteUrl}/customer/dashboard`).catch(console.error)
              }
            }
          } catch (emailErr) {
            console.error('Failed to send no-quotes email for enquiry', enq.id, emailErr)
          }

          const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_FROM
          if (adminEmail) {
            await sendAdminAlert(
              adminEmail,
              `Zero quotes after 5 days — enquiry ${enq.reference}`,
              `
              <p>Enquiry <strong>${enq.reference}</strong> has had no quotes submitted 5 days after matching.</p>
              <p>The customer has been emailed that we're widening the search. Please review the enquiry and match more installers manually.</p>
              <p><a href="${siteUrl}/admin" style="color:#1B3A2D;">Open admin dashboard →</a></p>
              `
            ).catch(console.error)
          }

          noQuoteNotified++
        }
        continue
      }

      // Transition to quotes_received
      await admin
        .from('enquiries')
        .update({ status: 'quotes_received' })
        .eq('id', enq.id)

      transitioned++

      // Email the customer
      try {
        // Get customer email via auth admin
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const customer = (enq.customers as any) as { user_id: string } | null
        if (customer?.user_id) {
          const { data: authUser } = await admin.auth.admin.getUserById(customer.user_id)
          if (authUser?.user?.email) {
            const loginUrl = `${siteUrl}/auth/login`
            await sendQuotesReady(authUser.user.email, enq.reference, loginUrl).catch(console.error)
          }
        }
      } catch (emailErr) {
        console.error('Failed to email customer for enquiry', enq.id, emailErr)
      }
    }

    return NextResponse.json({ ok: true, reassigned, transitioned, noQuoteNotified })
  } catch (err) {
    console.error('Quote deadline cron error:', err)
    return NextResponse.json({ error: 'Deadline check failed' }, { status: 500 })
  }
}
