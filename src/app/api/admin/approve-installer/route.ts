import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendApplicationApproved } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { installerId } = await req.json()
    const admin = await createAdminClient()

    const { data: installer } = await admin
      .from('installers')
      .update({ status: 'active', approved_at: new Date().toISOString() })
      .eq('id', installerId)
      .select('company_name, contact_email')
      .single()

    if (!installer) return NextResponse.json({ error: 'Installer not found' }, { status: 404 })

    await sendApplicationApproved(
      installer.contact_email,
      installer.company_name,
      `${process.env.NEXT_PUBLIC_SITE_URL || 'https://wattsmart.co.uk'}/installer/dashboard`
    ).catch(console.error)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Approve installer error:', err)
    return NextResponse.json({ error: 'Failed to approve installer' }, { status: 500 })
  }
}
