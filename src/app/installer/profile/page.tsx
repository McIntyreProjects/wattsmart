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

type StripeConnect = {
  accountId: string | null
  onboarded: boolean
}

const ALL_SERVICES = [
  { label: 'Solar PV',        sub: 'Requires MCS + RECC',         products: ['solar_pv', 'solar'] },
  { label: 'Battery storage', sub: 'Requires MCS',                products: ['battery', 'battery_storage'] },
  { label: 'EV chargers',     sub: 'Requires OZEV + NICEIC',      products: ['ev_charger', 'ev_chargers'] },
  { label: 'Heat pumps',      sub: 'Requires MCS + NAPIT',        products: ['heat_pump', 'heat_pumps'] },
]

function ServiceToggle({
  label, sub, active, locked, onToggle,
}: {
  label: string
  sub: string
  active: boolean
  locked: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={() => !locked && onToggle()}
      disabled={locked}
      className={`w-11 h-6 rounded-full flex items-center px-0.5 flex-shrink-0 transition-colors ${
        locked ? 'bg-[#E3DABE] cursor-not-allowed' : active ? 'bg-ws-green' : 'bg-[#D9E1DC]'
      }`}
      aria-label={`${label} toggle`}
    >
      <span className={`w-5 h-5 rounded-full bg-white transition-transform flex items-center justify-center ${active && !locked ? 'translate-x-5' : ''}`}>
        {locked && <span className="text-[9px]">🔒</span>}
      </span>
    </button>
  )
}

async function patchInstaller(updates: Record<string, unknown>) {
  const res = await fetch('/api/installers/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error ?? 'Failed to save')
  }
  return res.json()
}

export default function InstallerProfilePage() {
  const [installer, setInstaller] = useState<InstallerData | null>(null)
  const [certs, setCerts] = useState<Cert[]>([])
  const [stripeConnect, setStripeConnect] = useState<StripeConnect>({ accountId: null, onboarded: false })
  const [connectLoading, setConnectLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Edit state per section
  const [editingContact, setEditingContact] = useState(false)
  const [contactDraft, setContactDraft] = useState({ trading_name: '', contact_name: '', contact_phone: '' })
  const [contactSaving, setContactSaving] = useState(false)
  const [contactError, setContactError] = useState('')

  const [editingCoverage, setEditingCoverage] = useState(false)
  const [coverageDraft, setCoverageDraft] = useState('')
  const [coverageSaving, setCoverageSaving] = useState(false)
  const [coverageError, setCoverageError] = useState('')

  const [servicesSaving, setServicesSaving] = useState(false)

  useEffect(() => {
    fetch('/api/installers/me')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return }
        setInstaller(data.installer)
        setCerts(data.certifications ?? [])
        if (data.stripeConnect) setStripeConnect(data.stripeConnect)
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [])

  async function startConnectOnboarding() {
    setConnectLoading(true)
    try {
      const res = await fetch('/api/installers/connect/onboard', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Failed to start payout setup — please try again.')
      }
    } catch {
      alert('Failed to start payout setup — please try again.')
    } finally {
      setConnectLoading(false)
    }
  }

  function openContactEdit() {
    if (!installer) return
    setContactDraft({
      trading_name: installer.trading_name ?? '',
      contact_name: installer.contact_name ?? '',
      contact_phone: installer.contact_phone ?? '',
    })
    setContactError('')
    setEditingContact(true)
  }

  async function saveContact() {
    if (!installer) return
    setContactSaving(true)
    setContactError('')
    try {
      const result = await patchInstaller({
        trading_name: contactDraft.trading_name || null,
        contact_name: contactDraft.contact_name,
        contact_phone: contactDraft.contact_phone || null,
      })
      setInstaller(result.installer)
      setEditingContact(false)
    } catch (e: unknown) {
      setContactError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setContactSaving(false)
    }
  }

  function openCoverageEdit() {
    if (!installer) return
    setCoverageDraft((installer.coverage_postcodes ?? []).join(', '))
    setCoverageError('')
    setEditingCoverage(true)
  }

  async function saveCoverage() {
    if (!installer) return
    setCoverageSaving(true)
    setCoverageError('')
    try {
      const postcodes = coverageDraft
        .split(',')
        .map(p => p.trim().toUpperCase())
        .filter(Boolean)
      const result = await patchInstaller({ coverage_postcodes: postcodes })
      setInstaller(result.installer)
      setEditingCoverage(false)
    } catch (e: unknown) {
      setCoverageError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setCoverageSaving(false)
    }
  }

  async function toggleService(serviceProducts: string[]) {
    if (!installer) return
    const currentProducts = installer.products ?? []
    const isActive = currentProducts.some(p => serviceProducts.includes(p))
    let newProducts: string[]
    if (isActive) {
      newProducts = currentProducts.filter(p => !serviceProducts.includes(p))
    } else {
      newProducts = [...currentProducts, serviceProducts[0]]
    }
    setInstaller({ ...installer, products: newProducts })
    setServicesSaving(true)
    try {
      const result = await patchInstaller({ products: newProducts })
      setInstaller(result.installer)
    } catch {
      // revert
      setInstaller({ ...installer, products: currentProducts })
    } finally {
      setServicesSaving(false)
    }
  }

  const displayName = installer?.trading_name || installer?.company_name || '—'
  const coverageText = installer
    ? (installer.coverage_postcodes ?? []).slice(0, 6).join(', ')
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
            <div className="flex gap-4 items-start mb-3">
              <div className="w-16 h-16 rounded-tile border-2 border-dashed border-ws-border bg-[#FAFBFA] flex flex-col items-center justify-center gap-1 flex-shrink-0">
                <span className="text-xl text-ws-subtle">＋</span>
                <span className="text-xs text-ws-subtle font-semibold">Logo</span>
              </div>
              <div className="flex-1">
                {!editingContact ? (
                  <>
                    <p className="font-display font-extrabold text-xl tracking-tight">{displayName}</p>
                    {estText && <p className="text-xs text-ws-subtle">{estText}</p>}
                    <p className="text-xs text-ws-subtle mt-0.5">{installer.contact_name} · {installer.contact_email}</p>
                    {installer.contact_phone && <p className="text-xs text-ws-subtle">{installer.contact_phone}</p>}
                    <button
                      onClick={openContactEdit}
                      className="text-xs text-ws-dark-green font-semibold mt-1"
                    >
                      Edit contact details
                    </button>
                  </>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-ws-muted block mb-0.5">Trading name</label>
                      <input
                        className="w-full border border-ws-border rounded-lg px-3 py-1.5 text-sm"
                        value={contactDraft.trading_name}
                        onChange={e => setContactDraft(d => ({ ...d, trading_name: e.target.value }))}
                        placeholder={installer.company_name}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-ws-muted block mb-0.5">Contact name</label>
                      <input
                        className="w-full border border-ws-border rounded-lg px-3 py-1.5 text-sm"
                        value={contactDraft.contact_name}
                        onChange={e => setContactDraft(d => ({ ...d, contact_name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-ws-muted block mb-0.5">Contact phone</label>
                      <input
                        className="w-full border border-ws-border rounded-lg px-3 py-1.5 text-sm"
                        value={contactDraft.contact_phone}
                        onChange={e => setContactDraft(d => ({ ...d, contact_phone: e.target.value }))}
                        placeholder="07700 000000"
                      />
                    </div>
                    {contactError && <p className="text-xs text-[#C2603F]">{contactError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={saveContact}
                        disabled={contactSaving}
                        className="text-xs bg-ws-green text-white font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
                      >
                        {contactSaving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingContact(false)}
                        className="text-xs text-ws-muted font-semibold px-3 py-1.5"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-[#F2F6F3] rounded-tile px-4 py-3 text-xs text-ws-muted leading-relaxed mb-6">
              Your logo appears beside your name <strong>once a customer has chosen you</strong> — never during anonymous quoting.{' '}
              <span className="text-ws-dark-green font-semibold">Contact support to upload your logo.</span>
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
              {servicesSaving && <span className="text-xs text-ws-muted">Saving…</span>}
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
                    <ServiceToggle
                      label={s.label}
                      sub={s.sub}
                      active={!!active}
                      locked={!active}
                      onToggle={() => toggleService(s.products)}
                    />
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
                <p className="mt-2 text-xs text-ws-dark-green font-semibold">Contact support to upload your terms PDF.</p>
              </div>
            </div>

            {/* Coverage */}
            <p className="eyebrow mt-6 mb-3">Coverage</p>
            {!editingCoverage ? (
              <div className="flex gap-3 items-center mb-6">
                <div className="flex-1 border border-ws-border rounded-tile px-4 py-3 text-sm text-ws-ink">
                  {coverageText || <span className="text-ws-muted">No coverage areas set</span>}
                </div>
                <button
                  onClick={openCoverageEdit}
                  className="border-2 border-ws-border rounded-btn px-4 py-2.5 font-semibold text-sm text-ws-ink hover:bg-ws-border transition-colors"
                >
                  Edit
                </button>
              </div>
            ) : (
              <div className="mb-6">
                <label className="text-xs text-ws-muted block mb-1">Postcodes (comma-separated)</label>
                <textarea
                  className="w-full border border-ws-border rounded-tile px-4 py-3 text-sm resize-none"
                  rows={3}
                  value={coverageDraft}
                  onChange={e => setCoverageDraft(e.target.value)}
                  placeholder="e.g. SW1, EC1, N1, E1"
                />
                {coverageError && <p className="text-xs text-[#C2603F] mt-1">{coverageError}</p>}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={saveCoverage}
                    disabled={coverageSaving}
                    className="text-xs bg-ws-green text-white font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
                  >
                    {coverageSaving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditingCoverage(false)}
                    className="text-xs text-ws-muted font-semibold px-3 py-1.5"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

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
            {stripeConnect.onboarded ? (
              <div className="border border-[#CDE6D7] rounded-tile px-4 py-3 bg-[#F1FAF5] flex justify-between items-center text-sm">
                <span className="text-ws-dark-green font-semibold">Payouts active</span>
                <span className="text-xs text-ws-muted">Bank details managed via Stripe</span>
              </div>
            ) : stripeConnect.accountId ? (
              <div className="border border-ws-border rounded-tile px-4 py-3 flex justify-between items-center text-sm text-ws-muted">
                <span>Setup incomplete</span>
                <button
                  onClick={startConnectOnboarding}
                  disabled={connectLoading}
                  className="text-xs text-ws-dark-green font-semibold disabled:opacity-50"
                >
                  {connectLoading ? 'Loading…' : 'Continue setup →'}
                </button>
              </div>
            ) : (
              <div className="border border-ws-border rounded-tile px-4 py-3 flex justify-between items-center text-sm text-ws-muted">
                <span>Not yet configured</span>
                <button
                  onClick={startConnectOnboarding}
                  disabled={connectLoading}
                  className="text-xs text-ws-dark-green font-semibold disabled:opacity-50"
                >
                  {connectLoading ? 'Loading…' : 'Set up payouts →'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
