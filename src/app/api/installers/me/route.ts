import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const admin = await createAdminClient()

    // Resolve installer id
    let installerId: string | null = null
    const { data: membership } = await supabase
      .from('installer_users')
      .select('installer_id, role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (membership) {
      installerId = membership.installer_id
    } else {
      const { data: installer } = await supabase
        .from('installers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!installer) return NextResponse.json({ error: 'Installer not found' }, { status: 404 })
      installerId = installer.id
    }

    const body = await request.json()
    const allowed = ['trading_name', 'contact_name', 'contact_phone', 'coverage_postcodes', 'products']
    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('installers')
      .update(updates)
      .eq('id', installerId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ installer: data })
  } catch (err) {
    console.error('PATCH /api/installers/me error:', err)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const admin = await createAdminClient()

    // Resolve installer and role
    let installerId: string | null = null
    let currentUserRole: 'manager' | 'member' = 'member'

    const { data: membership } = await supabase
      .from('installer_users')
      .select('installer_id, role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (membership) {
      installerId = membership.installer_id
      currentUserRole = membership.role as 'manager' | 'member'
    } else {
      const { data: installer } = await supabase
        .from('installers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!installer) return NextResponse.json({ error: 'Installer not found' }, { status: 404 })

      installerId = installer.id
      currentUserRole = 'manager'
    }

    // Fetch installer record
    const { data: installer, error: instError } = await admin
      .from('installers')
      .select('*')
      .eq('id', installerId)
      .single()

    if (instError) throw instError

    // Fetch certifications
    const { data: certs } = await admin
      .from('certifications')
      .select('type, certification_number, status')
      .eq('installer_id', installerId)

    // Fetch performance metrics from jobs + quotes tables (best-effort — tables may not exist yet)
    let metrics = { jobsReceived: 0, quotesSubmitted: 0, jobsWon: 0, avgQuoteValue: 0 }
    try {
      const { data: jobs } = await admin
        .from('jobs')
        .select('id, status')
        .eq('installer_id', installerId)

      const { data: quotes } = await admin
        .from('quotes')
        .select('id, status, amount')
        .eq('installer_id', installerId)

      if (jobs) {
        metrics.jobsReceived = jobs.length
        metrics.jobsWon = jobs.filter((j: { status: string }) => ['quote_selected', 'installation_confirmed', 'install_complete', 'complete'].includes(j.status)).length
      }
      if (quotes) {
        metrics.quotesSubmitted = quotes.length
        const totalValue = quotes.reduce((sum: number, q: { amount?: number }) => sum + (q.amount ?? 0), 0)
        metrics.avgQuoteValue = quotes.length > 0 ? Math.round(totalValue / quotes.length) : 0
      }
    } catch {
      // Tables may not exist yet — return zeros
    }

    return NextResponse.json({
      installer,
      certifications: certs ?? [],
      currentUserRole,
      metrics,
      stripeConnect: {
        accountId: installer.stripe_connect_account_id ?? null,
        onboarded: installer.stripe_connect_onboarded ?? false,
      },
    })
  } catch (err) {
    console.error('GET /api/installers/me error:', err)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}
