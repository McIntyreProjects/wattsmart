import { NextRequest, NextResponse } from 'next/server'
import { verifyCert } from '@/lib/cert-verification'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    // Auth check: must be logged in and have admin role (via app_metadata)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const adminClient = await createAdminClient()
    const { data: { user: fullUser } } = await adminClient.auth.admin.getUserById(user.id)
    if (fullUser?.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { certId, type, number, installerId } = await req.json()

    if (!type || !number) {
      return NextResponse.json({ error: 'Missing cert type or number' }, { status: 400 })
    }

    const result = await verifyCert(type, number)

    if (certId) {
      await adminClient
        .from('certifications')
        .update({
          status: result.verified ? 'verified' : 'failed',
          verified_at: result.verified ? new Date().toISOString() : null,
          expires_at: result.expiresAt || null,
          last_checked_at: new Date().toISOString(),
          register_source: result.source,
        })
        .eq('id', certId)
    } else if (installerId) {
      await adminClient
        .from('certifications')
        .upsert({
          installer_id: installerId,
          type,
          certification_number: number,
          status: result.verified ? 'verified' : 'failed',
          verified_at: result.verified ? new Date().toISOString() : null,
          expires_at: result.expiresAt || null,
          last_checked_at: new Date().toISOString(),
          register_source: result.source,
        })
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Cert verification error:', err)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
