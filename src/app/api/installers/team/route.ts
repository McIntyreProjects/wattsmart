import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const admin = await createAdminClient()

    // Find which installer this user belongs to.
    // Primary path: they have an installer_users row.
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
      // Fallback: they are the primary account holder (installers.user_id = auth uid)
      const { data: installer } = await supabase
        .from('installers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!installer) return NextResponse.json({ error: 'Installer not found' }, { status: 404 })

      installerId = installer.id
      currentUserRole = 'manager'
    }

    // Fetch all active/pending installer_users rows for this installer
    const { data: rows, error: rowsError } = await admin
      .from('installer_users')
      .select('id, user_id, role, status, joined_at')
      .eq('installer_id', installerId)
      .order('joined_at', { ascending: true })

    if (rowsError) throw rowsError

    // Also include the primary account holder if they aren't already in installer_users
    const { data: primaryInstaller } = await admin
      .from('installers')
      .select('id, user_id, company_name, trading_name')
      .eq('id', installerId)
      .single()

    const memberUserIds = (rows ?? []).map((r: { user_id: string }) => r.user_id)
    const includesPrimary = primaryInstaller && memberUserIds.includes(primaryInstaller.user_id)

    // Bulk-fetch auth user details for all relevant user_ids
    const allUserIds = [...memberUserIds]
    if (primaryInstaller && !includesPrimary) allUserIds.unshift(primaryInstaller.user_id)

    const authUserMap: Record<string, { email: string; name: string }> = {}
    for (const uid of allUserIds) {
      const { data: authUser } = await admin.auth.admin.getUserById(uid)
      if (authUser?.user) {
        const meta = authUser.user.user_metadata ?? {}
        authUserMap[uid] = {
          email: authUser.user.email ?? '',
          name: meta.full_name || meta.name || '',
        }
      }
    }

    // Build the member list — primary holder first (synthetic row)
    type MemberRow = {
      id: string
      user_id: string
      name: string
      email: string
      role: 'manager' | 'member'
      status: 'active' | 'pending'
      joinedAt: string
      you: boolean
    }

    const members: MemberRow[] = []

    if (primaryInstaller && !includesPrimary) {
      const info = authUserMap[primaryInstaller.user_id] ?? { email: '', name: '' }
      members.push({
        id: `primary-${primaryInstaller.user_id}`,
        user_id: primaryInstaller.user_id,
        name: info.name,
        email: info.email,
        role: 'manager',
        status: 'active',
        joinedAt: '',
        you: primaryInstaller.user_id === user.id,
      })
    }

    for (const row of rows ?? []) {
      const info = authUserMap[row.user_id] ?? { email: '', name: '' }
      members.push({
        id: row.id,
        user_id: row.user_id,
        name: info.name,
        email: info.email,
        role: row.role as 'manager' | 'member',
        status: row.status as 'active' | 'pending',
        joinedAt: row.joined_at
          ? new Date(row.joined_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
          : '',
        you: row.user_id === user.id,
      })
    }

    return NextResponse.json({
      members,
      currentUserRole,
      companyName: primaryInstaller?.trading_name || primaryInstaller?.company_name || '',
    })
  } catch (err) {
    console.error('GET /api/installers/team error:', err)
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 })
  }
}

// Helper: get installer_id and verify caller is a manager
async function getManagerContext(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: membership } = await supabase
    .from('installer_users')
    .select('installer_id, role')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (membership) {
    if (membership.role !== 'manager') return { error: 'Forbidden', installerId: null }
    return { error: null, installerId: membership.installer_id as string }
  }

  // Fallback: primary account holder
  const { data: installer } = await supabase
    .from('installers')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!installer) return { error: 'Installer not found', installerId: null }
  return { error: null, installerId: installer.id as string }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { userId, role } = await request.json()
    if (!userId || !role || !['manager', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { error: ctxError, installerId } = await getManagerContext(supabase, user.id)
    if (ctxError || !installerId) {
      return NextResponse.json({ error: ctxError ?? 'Forbidden' }, { status: 403 })
    }

    const admin = await createAdminClient()
    const { error } = await admin
      .from('installer_users')
      .update({ role })
      .eq('user_id', userId)
      .eq('installer_id', installerId)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('PATCH /api/installers/team error:', err)
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { userId } = await request.json()
    if (!userId) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    const { error: ctxError, installerId } = await getManagerContext(supabase, user.id)
    if (ctxError || !installerId) {
      return NextResponse.json({ error: ctxError ?? 'Forbidden' }, { status: 403 })
    }

    // Prevent a manager from removing themselves
    if (userId === user.id) {
      return NextResponse.json({ error: 'You cannot remove yourself' }, { status: 400 })
    }

    const admin = await createAdminClient()
    const { error } = await admin
      .from('installer_users')
      .update({ status: 'removed' })
      .eq('user_id', userId)
      .eq('installer_id', installerId)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/installers/team error:', err)
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}
