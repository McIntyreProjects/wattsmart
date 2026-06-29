import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendInstallerInvite } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { email, role } = await req.json()
    if (!email || !role) return NextResponse.json({ error: 'Email and role are required' }, { status: 400 })

    // Find the installer this user belongs to and verify their role.
    // Primary owners have a row in `installers` but not in `installer_users`,
    // so we fall back to checking installers.user_id when no membership row exists.
    const admin = await createAdminClient()

    let installerId: string | null = null
    let callerRole: 'manager' | 'member' = 'member'
    let companyDisplay = ''

    const { data: membership } = await supabase
      .from('installer_users')
      .select('installer_id, role, installers(company_name, trading_name)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (membership) {
      installerId = membership.installer_id
      callerRole = membership.role as 'manager' | 'member'
      const inst = (Array.isArray(membership.installers) ? membership.installers[0] : membership.installers) as { company_name: string; trading_name: string | null } | null
      companyDisplay = inst?.trading_name || inst?.company_name || ''
    } else {
      // Primary owner path
      const { data: ownerRow } = await supabase
        .from('installers')
        .select('id, company_name, trading_name')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!ownerRow) return NextResponse.json({ error: 'Installer account not found' }, { status: 404 })

      installerId = ownerRow.id
      callerRole = 'manager' // primary owner is always a manager
      companyDisplay = ownerRow.trading_name || ownerRow.company_name
    }

    // Members can only invite other members
    if (callerRole === 'member' && role === 'manager') {
      return NextResponse.json({ error: 'Members can only invite other Members' }, { status: 403 })
    }

    // Create the invite token
    const { data: invite, error: inviteError } = await admin
      .from('installer_invites')
      .insert({
        installer_id: installerId,
        invited_by: user.id,
        email,
        role,
      })
      .select('token')
      .single()

    if (inviteError) throw inviteError

    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://wattsmart.co.uk'}/installer/accept-invite?token=${invite.token}`

    // Send the invite email
    await sendInstallerInvite(email, companyDisplay, inviteUrl)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Installer invite error:', err)
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 })
  }
}
