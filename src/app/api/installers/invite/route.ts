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

    // Find the installer this user belongs to and verify their role
    const { data: membership } = await supabase
      .from('installer_users')
      .select('installer_id, role, installers(company_name, trading_name)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership) return NextResponse.json({ error: 'Installer account not found' }, { status: 404 })

    // Members can only invite other members
    if (membership.role === 'member' && role === 'manager') {
      return NextResponse.json({ error: 'Members can only invite other Members' }, { status: 403 })
    }

    const installer = membership.installers as { company_name: string; trading_name: string | null }
    const companyDisplay = installer.trading_name || installer.company_name

    // Create the invite token
    const admin = await createAdminClient()
    const { data: invite, error: inviteError } = await admin
      .from('installer_invites')
      .insert({
        installer_id: membership.installer_id,
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
