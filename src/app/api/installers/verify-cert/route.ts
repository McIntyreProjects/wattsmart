import { NextRequest, NextResponse } from 'next/server'
import { verifyCert } from '@/lib/cert-verification'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { certId, type, number, installerId } = await req.json()

    if (!type || !number) {
      return NextResponse.json({ error: 'Missing cert type or number' }, { status: 400 })
    }

    const result = await verifyCert(type, number)

    if (certId) {
      const supabase = await createAdminClient()
      await supabase
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
      const supabase = await createAdminClient()
      await supabase
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
