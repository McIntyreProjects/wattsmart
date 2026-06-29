import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendCertExpiring } from '@/lib/email'

export async function POST(req: NextRequest) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const admin = await createAdminClient()
    const thirtyDays = new Date(Date.now() + 30 * 86400000)

    const { data: certs } = await admin
      .from('certifications')
      .select('id, installer_id, type, expires_at, installers(contact_email)')
      .eq('status', 'verified')

    let warned = 0
    for (const cert of certs || []) {
      const installer = cert.installers as { contact_email: string }
      if (!installer || !cert.expires_at) continue

      if (new Date(cert.expires_at) < thirtyDays) {
        await sendCertExpiring(
          installer.contact_email,
          cert.type,
          new Date(cert.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        ).catch(console.error)
        warned++
      }
    }

    return NextResponse.json({ ok: true, warned })
  } catch (err) {
    console.error('Cert check cron error:', err)
    return NextResponse.json({ error: 'Cert check failed' }, { status: 500 })
  }
}
