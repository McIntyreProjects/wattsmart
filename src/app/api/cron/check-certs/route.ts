import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyCert } from '@/lib/cert-verification'
import { sendCertExpiring, sendCertExpired } from '@/lib/email'

export async function POST() {
  try {
    const admin = await createAdminClient()
    const now = new Date()
    const thirtyDays = new Date(Date.now() + 30 * 86400000)

    const { data: certs } = await admin
      .from('certifications')
      .select('id, installer_id, type, certification_number, expires_at, installers(company_name, contact_email, status)')
      .eq('status', 'verified')

    for (const cert of certs || []) {
      const installer = cert.installers as { company_name: string; contact_email: string; status: string }
      if (!installer) continue

      // Re-verify
      const result = await verifyCert(cert.type, cert.certification_number)

      if (!result.verified) {
        // Mark as expired/failed
        await admin.from('certifications').update({ status: 'expired', last_checked_at: now.toISOString() }).eq('id', cert.id)

        // Auto-pause installer
        if (installer.status === 'active') {
          await admin.from('installers').update({ status: 'paused' }).eq('id', cert.installer_id)
          await sendCertExpired(installer.contact_email, cert.type).catch(console.error)
          const adminEmail = process.env.ADMIN_EMAIL
          if (adminEmail) {
            await sendCertExpired(adminEmail, cert.type, installer.company_name).catch(console.error)
          }
        }
      } else {
        await admin.from('certifications').update({
          last_checked_at: now.toISOString(),
          expires_at: result.expiresAt || cert.expires_at,
        }).eq('id', cert.id)

        // Warn if expiring within 30 days
        if (cert.expires_at && new Date(cert.expires_at) < thirtyDays) {
          await sendCertExpiring(
            installer.contact_email,
            cert.type,
            new Date(cert.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
          ).catch(console.error)
        }
      }
    }

    return NextResponse.json({ ok: true, checked: certs?.length || 0 })
  } catch (err) {
    console.error('Cert check cron error:', err)
    return NextResponse.json({ error: 'Cert check failed' }, { status: 500 })
  }
}
