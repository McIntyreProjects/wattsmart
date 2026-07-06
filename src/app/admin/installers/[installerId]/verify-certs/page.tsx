import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminNav from '@/components/ui/AdminNav'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { CertCheckActions } from './CertActions'

// Cert types per 001_initial_schema.sql: mcs, recc, hies, niceic, napit, ozev, trustmark
const CERT_META: Record<string, { label: string; sub: string; registerUrl: string; registerName: string }> = {
  mcs: {
    label: 'MCS',
    sub: 'Microgeneration Certification Scheme',
    registerUrl: 'https://mcscertified.com/find-an-installer/',
    registerName: 'MCS installer search',
  },
  recc: {
    label: 'RECC',
    sub: 'Renewable Energy Consumer Code',
    registerUrl: 'https://www.recc.org.uk/consumers/find-a-member',
    registerName: 'RECC member search',
  },
  hies: {
    label: 'HIES',
    sub: 'Home Insulation & Energy Systems consumer code',
    registerUrl: 'https://www.hiesscheme.org.uk/',
    registerName: 'HIES member search',
  },
  niceic: {
    label: 'NICEIC',
    sub: 'Electrical contractor certification',
    registerUrl: 'https://www.niceic.com/find-a-contractor',
    registerName: 'NICEIC contractor search',
  },
  napit: {
    label: 'NAPIT',
    sub: 'Electrical & building services registration',
    registerUrl: 'https://www.napit.org.uk/find-an-installer',
    registerName: 'NAPIT installer search',
  },
  trustmark: {
    label: 'TrustMark',
    sub: 'Government-endorsed quality scheme',
    registerUrl: 'https://www.trustmark.org.uk/find-a-tradesperson',
    registerName: 'TrustMark tradesperson search',
  },
  ozev: {
    label: 'OZEV',
    sub: 'EV chargepoint authorised installer',
    registerUrl: 'https://www.gov.uk/guidance/residential-and-commercial-chargepoints-become-an-authorised-installer',
    registerName: 'OZEV authorised installer list (gov.uk)',
  },
}

// Status values per 001_initial_schema.sql: pending, verified, failed, expired
const STATUS_CHIP: Record<string, { style: string; label: string }> = {
  verified: { style: 'bg-[#F1FAF5] text-ws-dark-green border-[#CDE6D7]', label: '✓ Verified' },
  pending:  { style: 'bg-amber-50 text-amber-700 border-amber-200',      label: 'Needs check' },
  failed:   { style: 'bg-ws-red-bg text-ws-red-text border-[#ECBCB7]',   label: '✗ Check failed' },
  expired:  { style: 'bg-ws-red-bg text-ws-red-text border-[#ECBCB7]',   label: 'Expired' },
}

const CARD_STYLE: Record<string, string> = {
  verified: 'border-[#CDE6D7] bg-[#F1FAF5]',
  failed:   'border-[#ECBCB7] bg-ws-red-bg',
  expired:  'border-[#ECBCB7] bg-ws-red-bg',
}

export default async function VerifyCertsPage({
  params,
}: {
  params: Promise<{ installerId: string }>
}) {
  const { installerId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?type=admin')

  const admin = await createAdminClient()
  const { data: { user: fullUser } } = await admin.auth.admin.getUserById(user.id)
  if (!fullUser || fullUser.app_metadata?.role !== 'admin') redirect('/auth/login?type=admin')

  const [{ data: installer }, { data: certs }] = await Promise.all([
    admin
      .from('installers')
      .select('id, company_name, trading_name, status, created_at')
      .eq('id', installerId)
      .maybeSingle(),
    admin
      .from('certifications')
      .select('id, type, certification_number, status, expires_at, last_checked_at')
      .eq('installer_id', installerId)
      .order('type'),
  ])

  if (!installer) redirect('/admin/installers')

  const displayName = installer.trading_name || installer.company_name
  const now = Date.now()

  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink">
      <AdminNav active="installers" />

      <div className="max-w-2xl mx-auto px-6 py-8">
        <Link
          href={`/admin/installers/${installerId}`}
          className="text-sm text-ws-muted hover:text-ws-ink mb-4 inline-block"
        >
          ← Back to {displayName}
        </Link>

        <div className="mb-6">
          <h1 className="font-display font-extrabold text-2xl tracking-tight mb-1">Verify certificates</h1>
          <p className="text-sm text-ws-muted capitalize">
            {displayName} · {installer.status} · applied {new Date(installer.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>

        <div className="bg-[#F2F6F3] border border-ws-border rounded-tile px-4 py-3 text-xs text-ws-muted leading-relaxed mb-6">
          Run the automated register check for each certificate, or open the register link to
          check the number manually. A check marks the certificate verified when the register
          confirms it, or failed when it can&apos;t be confirmed.
        </div>

        {certs && certs.length > 0 ? (
          <div className="flex flex-col gap-4">
            {certs.map((cert) => {
              const meta = CERT_META[cert.type] || {
                label: cert.type.toUpperCase(),
                sub: 'Certification',
                registerUrl: '',
                registerName: '',
              }
              const chip = STATUS_CHIP[cert.status] || STATUS_CHIP.pending
              const isExpired = !!cert.expires_at && new Date(cert.expires_at).getTime() < now
              return (
                <div
                  key={cert.id}
                  className={`border rounded-tile p-5 ${CARD_STYLE[cert.status] || 'border-ws-border bg-white'}`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="font-bold text-sm">
                        {meta.label}
                        <span className="font-normal text-ws-muted ml-2">· {meta.sub}</span>
                      </p>
                      <p className="font-mono text-xs text-ws-ink mt-1">{cert.certification_number}</p>
                      {cert.expires_at && (
                        <p className={`text-xs mt-0.5 ${isExpired ? 'text-ws-red-text font-semibold' : 'text-ws-muted'}`}>
                          {isExpired ? 'Expired' : 'Expires'} {new Date(cert.expires_at).toLocaleDateString('en-GB')}
                        </p>
                      )}
                      {cert.last_checked_at && (
                        <p className="text-xs text-ws-subtle mt-0.5">
                          Last checked {new Date(cert.last_checked_at).toLocaleDateString('en-GB')}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs font-semibold border px-2 py-1 rounded-pill whitespace-nowrap ${chip.style}`}>
                      {chip.label}
                    </span>
                  </div>

                  {meta.registerUrl && (
                    <a
                      href={meta.registerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-xs font-semibold text-ws-dark-green hover:underline mb-3"
                    >
                      Open {meta.registerName} ↗
                    </a>
                  )}

                  <CertCheckActions
                    certId={cert.id}
                    type={cert.type}
                    number={cert.certification_number}
                  />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="border border-ws-border rounded-tile px-4 py-6 bg-white text-sm text-ws-muted text-center">
            No certificates on record for this installer.
          </div>
        )}
      </div>
    </div>
  )
}
