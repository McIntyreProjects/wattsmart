'use client'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { useState } from 'react'

const CERTS = [
  {
    id: 'mcs',
    label: 'MCS',
    sub: 'Microgeneration Certification Scheme',
    number: 'NAP-1100-2284',
    checkUrl: 'https://mcscertified.com/find-an-installer/',
    instructions: 'Search the MCS installer register for this number. Check the company name matches and the certificate is current.',
  },
  {
    id: 'recc',
    label: 'RECC',
    sub: 'Renewable Energy Consumer Code',
    number: 'RECC-00821',
    checkUrl: 'https://www.recc.org.uk/consumers/find-a-member',
    instructions: 'Search the RECC member register. Confirm the business name and that membership is active.',
  },
  {
    id: 'companies_house',
    label: 'Companies House',
    sub: 'Company registration',
    number: '08842210',
    checkUrl: 'https://find-and-update.company-information.service.gov.uk/',
    instructions: 'Search Companies House for this registration number. Confirm the company is active and the name matches.',
  },
  {
    id: 'insurance',
    label: 'Public liability insurance',
    sub: 'Minimum £2m cover required',
    number: 'Submitted via document upload',
    checkUrl: null,
    instructions: 'Check the uploaded insurance certificate. Confirm it shows at least £2m public liability cover and has not expired.',
  },
]

type CertStatus = 'pending' | 'verified' | 'rejected'

export default function VerifyCertsPage() {
  const [statuses, setStatuses] = useState<Record<string, CertStatus>>(
    Object.fromEntries(CERTS.map(c => [c.id, 'pending']))
  )
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const allChecked = CERTS.every(c => statuses[c.id] !== 'pending')
  const anyRejected = CERTS.some(c => statuses[c.id] === 'rejected')

  const setStatus = (id: string, status: CertStatus) => {
    setStatuses(prev => ({ ...prev, [id]: status }))
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-ws-body font-body text-ws-ink flex items-center justify-center">
        <div className="max-w-sm text-center px-6">
          <div className="w-14 h-14 rounded-full bg-[#EAF5EE] flex items-center justify-center mx-auto mb-5">
            <span className="text-2xl">{anyRejected ? '⚠' : '✓'}</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl tracking-tight mb-2">
            {anyRejected ? 'Installer flagged' : 'Installer approved'}
          </h1>
          <p className="text-sm text-ws-muted leading-relaxed mb-6">
            {anyRejected
              ? 'The installer has been notified of the issues found. They cannot receive jobs until all certs are resolved.'
              : 'All certificates verified. The installer is now active and will start receiving job briefs.'}
          </p>
          <Link href="/admin/installers" className="inline-block bg-ws-green text-white rounded-btn px-6 py-3 font-bold text-sm hover:bg-ws-dark-green transition-colors">
            Back to installers
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink">
      <nav className="flex items-center gap-8 px-6 py-4 bg-white border-b border-ws-border">
        <Logo />
        <div className="flex gap-6 text-sm text-ws-muted">
          <Link href="/admin/dashboard" className="hover:text-ws-ink">Overview</Link>
          <Link href="/admin/customers" className="hover:text-ws-ink">Customers</Link>
          <Link href="/admin/installers" className="text-ws-dark-green font-bold border-b-2 border-ws-green pb-1">Installers</Link>
          <Link href="/admin/pipeline" className="hover:text-ws-ink">Pipeline</Link>
          <Link href="/admin/fees" className="hover:text-ws-ink">Fees</Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <Link href="/admin/installers" className="text-sm text-ws-muted hover:text-ws-ink mb-4 inline-block">← Back to installers</Link>

        <div className="mb-6">
          <h1 className="font-display font-extrabold text-2xl tracking-tight mb-1">Verify certificates</h1>
          <p className="text-sm text-ws-muted">Greenfield Renewables Ltd · Applied 2 days ago · York</p>
        </div>

        <div className="bg-[#F2F6F3] border border-ws-border rounded-tile px-4 py-3 text-xs text-ws-muted leading-relaxed mb-6">
          Check each certificate number on the relevant register using the links below. Mark each one as verified or flag any issues before approving the installer.
        </div>

        <div className="flex flex-col gap-4 mb-8">
          {CERTS.map((cert) => {
            const status = statuses[cert.id]
            return (
              <div key={cert.id} className={`border rounded-tile p-5 transition-colors ${
                status === 'verified' ? 'border-[#CDE6D7] bg-[#F1FAF5]' :
                status === 'rejected' ? 'border-[#ECC9BE] bg-[#FBEFEA]' :
                'border-ws-border bg-white'
              }`}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-bold text-sm">{cert.label}
                      <span className="font-normal text-ws-muted ml-2">· {cert.sub}</span>
                    </p>
                    <p className="font-mono text-xs text-ws-muted mt-1">{cert.number}</p>
                  </div>
                  {status === 'verified' && <span className="text-xs font-semibold text-ws-dark-green bg-[#EAF5EE] px-2 py-1 rounded-pill whitespace-nowrap">✓ Verified</span>}
                  {status === 'rejected' && <span className="text-xs font-semibold text-[#C2603F] bg-[#FBEFEA] px-2 py-1 rounded-pill whitespace-nowrap">✗ Issue found</span>}
                  {status === 'pending' && <span className="text-xs text-ws-muted px-2 py-1 rounded-pill border border-ws-border whitespace-nowrap">Needs check</span>}
                </div>

                <p className="text-xs text-ws-muted leading-relaxed mb-3">{cert.instructions}</p>

                {cert.checkUrl && (
                  <a
                    href={cert.checkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs font-semibold text-ws-dark-green hover:underline mb-3"
                  >
                    Open {cert.label} register ↗
                  </a>
                )}

                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setStatus(cert.id, 'verified')}
                    className={`flex-1 rounded-btn py-2.5 text-sm font-bold transition-colors ${
                      status === 'verified'
                        ? 'bg-ws-green text-white'
                        : 'border-2 border-ws-green text-ws-dark-green hover:bg-[#F1FAF5]'
                    }`}
                  >
                    ✓ Verified
                  </button>
                  <button
                    onClick={() => setStatus(cert.id, 'rejected')}
                    className={`flex-1 rounded-btn py-2.5 text-sm font-bold transition-colors ${
                      status === 'rejected'
                        ? 'bg-[#C2603F] text-white'
                        : 'border-2 border-[#ECC9BE] text-[#C2603F] hover:bg-[#FBEFEA]'
                    }`}
                  >
                    ✗ Issue found
                  </button>
                </div>

                {status === 'rejected' && (
                  <textarea
                    placeholder="Describe the issue (e.g. cert not found, expired, name mismatch)…"
                    value={notes[cert.id] || ''}
                    onChange={e => setNotes(prev => ({ ...prev, [cert.id]: e.target.value }))}
                    className="w-full border border-[#ECC9BE] rounded-btn px-3 py-2 text-xs text-ws-ink placeholder:text-ws-muted focus:outline-none resize-none"
                    rows={2}
                  />
                )}
              </div>
            )
          })}
        </div>

        <div className={`rounded-tile p-4 mb-6 text-sm ${allChecked ? 'bg-[#F1FAF5] border border-[#CDE6D7]' : 'bg-[#F2F6F3] border border-ws-border'}`}>
          {allChecked
            ? anyRejected
              ? <p className="text-[#C2603F] font-semibold">⚠ One or more certificates have issues — the installer will be flagged and notified.</p>
              : <p className="text-ws-dark-green font-semibold">✓ All certificates checked — ready to approve.</p>
            : <p className="text-ws-muted">Check all certificates above before submitting.</p>
          }
        </div>

        <button
          disabled={!allChecked}
          onClick={() => setSubmitted(true)}
          className={`w-full rounded-btn py-3.5 font-bold text-sm transition-colors ${
            allChecked
              ? anyRejected
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-ws-green text-white hover:bg-ws-dark-green'
              : 'bg-ws-border text-ws-muted cursor-not-allowed'
          }`}
        >
          {!allChecked ? 'Check all certificates first' : anyRejected ? 'Flag installer & notify them' : 'Approve installer'}
        </button>
      </div>
    </div>
  )
}
