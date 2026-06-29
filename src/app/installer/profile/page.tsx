'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

type Cert = {
  type: string
  certification_number: string
  status: string
}

type InstallerData = {
  company_name: string
  trading_name: string | null
  contact_name: string
  contact_email: string
  contact_phone: string | null
  products: string[]
  coverage_postcodes: string[]
  years_trading: number | null
  base_postcode: string | null
  status: string
}

function Toggle({ on, locked }: { on: boolean; locked?: boolean }) {
  const [val, setVal] = useState(on)
  return (
    <button
      onClick={() => !locked && setVal(!val)}
      disabled={locked}
      className={`w-11 h-6 rounded-full flex items-center px-0.5 flex-shrink-0 transition-colors ${
        locked ? 'bg-[#E3DABE] cursor-not-allowed' : val ? 'bg-ws-green' : 'bg-[#D9E1DC]'
      }`}
    >
      <span className={`w-5 h-5 rounded-full bg-white transition-transform flex items-center justify-center ${val && !locked ? 'translate-x-5' : ''}`}>
        {locked && <span className="text-[9px]">🔒</span>}
      </span>
    </button>
  )
}

const ALL_SERVICES = [
  { label: 'Solar PV',        sub: 'Requires MCS + RECC',         products: ['solar_pv', 'solar'] },
  { label: 'Battery storage', sub: 'Requires MCS',                products: ['battery', 'battery_storage'] },
  { label: 'EV chargers',     sub: 'Requires OZEV + NICEIC',      products: ['ev_charger', 'ev_chargers'] },
  { label: 'Heat pumps',      sub: 'Requires MCS + NAPIT',        products: ['heat_pump', 'heat_pumps'] },
]

export default function InstallerProfilePage() {
  const [installer, setInstaller] = useState<InstallerData | null>(null)
  const [certs, setCerts] = useState<Cert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/installers/me')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return }
        setInstaller(data.installer)
        setCerts(data.certifications ?? [])
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [])

  const displayName = installer?.trading_name || installer?.company_name || '—'
  const coverageText = installer
    ? [
        ...(installer.coverage_postcodes ?? []).slice(0, 6).join(', '),
        installer.base_postcode ? `near ${installer.base_postcode}` : '',
      ].filter(Boolean).join(' · ')
    : '—'

  const estText = [
    installer?.base_postcode ? installer.base_postcode.split(' ')[0] : null,
    installer?.years_trading ? `est. ${new Date().getFullYear() - installer.years_trading}` : null,
  ].filter(Boolean).join(' · ')

  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <Link href="/installer/dashboard" className="text-ws-muted text-sm">← Dashboard</Link>
          <h1 className="font-display font-extrabold text-2xl tracking-tight">Profile</h1>
          <div className="w-16" />
        </div>

        {loading && (
          <p className="text-sm text-ws-muted py-10 text-center">Loading…</p>
        )}

        {error && (
          <p className="text-sm text-[#C2603F] py-4 text-center">{error}</p>
        )}

        {!loading && !error && installer && (
          <>
            {/* Business identity */}
            <div className="flex gap-4 items-center mb-3">
              <div className="w-16 h-16 rounded-tile border-2 border-dashed border-ws-border bg-[#FAFBFA] flex flex-col items-center justify-center gap-1 cursor-pointer flex-shrink-0">
                <span className="text-xl text-ws-subtle">＋</span>
                <span className="text-xs text-ws-subtle font-semibold">Logo</span>
              </div>
              <div>
                <p className="font-display font-extrabold text-xl tracking-tight">{displayName}</p>
                {estText && <p className="text-xs text-ws-subtle">{estText}</p>}
                <p className="text-xs text-ws-subtle mt-0.5">{installer.contact_name} · {installer.contact_email}</p>
                {installer.contact_phone && <p className="text-xs text-ws-subtle">{installer.contact_phone}</p>}
                <button className="text-xs text-ws-dark-green font-semibold mt-1">＋ Add your logo</button>
              </div>
            </div>
            <div className="bg-[#F2F6F3] rounded-tile px-4 py-3 text-xs text-ws-muted leading-relaxed mb-6">
              Your logo appears beside your name <strong>once a customer has chosen you</strong> — never during anonymous quoting. PNG or SVG, transparent background works best.
            </div>

            {/* Status badge */}
            {installer.status && installer.status !== 'approved' && (
              <div className="mb-6 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-tile px-4 py-3">
                <span className="text-amber-600 text-xs font-bold uppercase tracking-wide">{installer.status}</span>
                <span className="text-xs text-amber-700">— our team will review your application shortly.</span>
              </div>
            )}

            {/* Services */}
            <div className="flex justify-between items-center mb-3">
              <p className="eyebrow">Services — accepting quotes</p>
            </div>
            <div className="border border-ws-border rounded-tile overflow-hidden mb-2">
              {ALL_SERVICES.map((s, i, arr) => {
                const active = installer.products?.some(p => s.products.includes(p))
                return (
                  <div key={s.label} className={`flex justify-between items-center px-4 py-3.5 ${active ? 'bg-white' : 'bg-amber-50'} ${i < arr.length - 1 ? `border-b ${active ? 'border-ws-border' : 'border-amber-100'}` : ''}`}>
                    <div>
                      <p className={`font-bold text-sm ${active ? 'text-ws-ink' : 'text-amber-700'}`}>{s.label}</p>
                      <p className={`text-xs mt-0.5 ${active ? 'text-ws-muted' : 'text-amber-600'}`}>
                        {active ? s.sub : '⚠ Locked — certs pending verification'}
                      </p>
                    </div>
                    <Toggle on={active} locked={!active} />
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-ws-subtle leading-relaxed mb-6">
              Services unlock automatically once your relevant certificates have been verified by our team. You can then toggle individual services on or off yourself.
            </p>

            {/* Certifications */}
            <p className="eyebrow mb-3">Certifications</p>
            {certs.length === 0 ? (
              <p className="text-xs text-ws-muted mb-6">No certifications on file yet.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-2">
                  {certs.map((c) => (
                    <span
                      key={c.type}
                      className={`text-xs rounded-lg px-3 py-1.5 font-medium border ${
                        c.status === 'verified'
                          ? 'border-[#CDE6D7] bg-[#F1FAF5] text-ws-dark-green'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                      }`}
                    >
                      {c.type.toUpperCase()} · {c.status === 'verified' ? 'verified' : 'pending verification'}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-ws-subtle leading-relaxed mb-6">
                  Our team will verify your certificates manually — usually within 1 working day. Services unlock once each relevant cert is confirmed.
                </p>
              </>
            )}

            {/* Terms */}
            <p className="eyebrow mb-3">Your terms &amp; conditions</p>
            <div className="border border-ws-border rounded-tile p-4 mb-2">
              <p className="text-xs text-ws-muted leading-relaxed mb-4">Your terms for the <strong>install &amp; supply of goods</strong> — the contract between you and the customer.</p>
              <div className="border border-dashed border-ws-border rounded-lg p-4 text-center">
                <p className="text-xs text-ws-muted">No terms uploaded yet</p>
                <button className="mt-2 text-xs text-ws-dark-green font-semibold">Upload terms (PDF)</button>
              </div>
            </div>

            {/* Coverage */}
            <p className="eyebrow mt-6 mb-3">Coverage</p>
            <div className="flex gap-3 items-center mb-6">
              <div className="flex-1 border border-ws-border rounded-tile px-4 py-3 text-sm text-ws-ink">
                {coverageText || <span className="text-ws-muted">No coverage areas set</span>}
              </div>
              <button className="border-2 border-ws-border rounded-btn px-4 py-2.5 font-semibold text-sm text-ws-ink hover:bg-ws-border transition-colors">Edit</button>
            </div>

            {/* Balance payment default */}
            <p className="eyebrow mb-1">Balance payment — default</p>
            <p className="text-xs text-ws-subtle mb-3 leading-relaxed">When your proposed date is accepted, we ask the customer for the balance this far ahead.</p>
            <div className="flex gap-2 flex-wrap mb-6">
              {['3 days before', '7 days before', '14 days before', 'On the day'].map((opt) => (
                <button key={opt} className={`border rounded-lg px-3 py-2 text-sm whitespace-nowrap ${
                  opt === '7 days before'
                    ? 'border-2 border-ws-green bg-[#F1FAF5] text-ws-dark-green font-bold'
                    : 'border-ws-border text-ws-muted'
                }`}>{opt}</button>
              ))}
            </div>

            {/* Payout */}
            <p className="eyebrow mb-3">Payout account</p>
            <div className="border border-ws-border rounded-tile px-4 py-3 flex justify-between items-center text-sm text-ws-muted">
              <span>Not yet configured</span>
              <button className="text-xs text-ws-dark-green font-semibold">Set up →</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
