import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendApplicationRejected } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { installerId, reason } = await req.json()
    const admin = await createAdminClient()

    const { data: installer } = await admin
      .from('installers')
      .update({ status: 'rejected' })
      .eq('id', installerId)
      .select('company_name, contact_email')
      .single()

    if (!installer) return NextResponse.json({ error: 'Installer not found' }, { status: 404 })

    await sendApplicationRejected(installer.contact_email, installer.company_name, reason).catch(console.error)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Reject installer error:', err)
    return NextResponse.json({ error: 'Failed to reject installer' }, { status: 500 })
  }
}
