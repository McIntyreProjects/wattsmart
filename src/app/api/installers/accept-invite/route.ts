import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const admin = await createAdminClient()
  const { data: invite } = await admin
    .from('installer_invites')
    .select('email, role, installer_id, installers(company_name, trading_name)')
    .eq('token', token)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invite) return NextResponse.json({ error: 'Invite not found or expired' }, { status: 404 })

  const installer = invite.installers as { company_name: string; trading_name: string | null }
  return NextResponse.json({
    email: invite.email,
    role: invite.role,
    companyName: installer.trading_name || installer.company_name,
  })
}

export async function POST(req: NextRequest) {
  try {
    const { token, name, password } = await req.json()
    if (!token || !name || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = await createAdminClient()

    // Look up the invite
    const { data: invite } = await admin
      .from('installer_invites')
      .select('email, role, installer_id')
      .eq('token', token)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single()

    if (!invite) return NextResponse.json({ error: 'Invite not found or expired' }, { status: 404 })

    // Create the auth user
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: invite.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, role: 'installer' },
    })

    if (authError) {
      if (authError.message.includes('already been registered')) {
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 400 })
      }
      throw authError
    }

    const userId = authData.user.id
    const rollback = async () => {
      await admin.auth.admin.deleteUser(userId).catch(console.error)
    }

    // Add to installer_users
    const { error: insertError } = await admin.from('installer_users').insert({
      installer_id: invite.installer_id,
      user_id: userId,
      role: invite.role,
      invited_by: null,
      status: 'active',
      joined_at: new Date().toISOString(),
    })

    if (insertError) {
      await rollback()
      throw insertError
    }

    // Mark invite as accepted
    await admin
      .from('installer_invites')
      .update({ status: 'accepted' })
      .eq('token', token)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Accept invite error:', err)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}
