import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const admin = await createAdminClient()

    // Resolve installer record and check role — only managers can set up payouts
    let installerId: string | null = null

    const { data: membership } = await supabase
      .from('installer_users')
      .select('installer_id, role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (membership) {
      if (membership.role !== 'manager') {
        return NextResponse.json({ error: 'Only managers can set up payouts.' }, { status: 403 })
      }
      installerId = membership.installer_id
    } else {
      // Primary account holder (the user who registered) is always a manager
      const { data: ins } = await supabase
        .from('installers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!ins) return NextResponse.json({ error: 'Installer not found' }, { status: 404 })
      installerId = ins.id
    }

    const { data: installer, error: instError } = await admin
      .from('installers')
      .select('stripe_connect_account_id, contact_email')
      .eq('id', installerId)
      .single()

    if (instError || !installer) {
      return NextResponse.json({ error: 'Installer record not found' }, { status: 404 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })

    let accountId = installer.stripe_connect_account_id as string | null

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'GB',
        email: installer.contact_email,
        capabilities: { transfers: { requested: true } },
        business_type: 'company',
      })
      accountId = account.id

      await admin
        .from('installers')
        .update({ stripe_connect_account_id: accountId })
        .eq('id', installerId)

      console.log(`Created Stripe Connect account ${accountId} for installer ${installerId}`)
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wattsmart.co.uk'

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${siteUrl}/installer/profile?connect=refresh`,
      return_url: `${siteUrl}/installer/profile?connect=success`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (err) {
    console.error('Connect onboard error:', err)
    return NextResponse.json({ error: 'Failed to start Connect onboarding' }, { status: 500 })
  }
}
