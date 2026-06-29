'use client'

import { useState } from 'react'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'

const ALL_OPTIONAL_CERTS: { id: string; label: string; other?: boolean }[] = [
  { id: 'trustmark', label: 'TrustMark' },
  { id: 'which', label: 'Which? Trusted Trader' },
  { id: 'napit', label: 'NAPIT' },
  { id: 'gas_safe', label: 'Gas Safe' },
  { id: 'fgas', label: 'F-Gas' },
  { id: 'hies', label: 'HIES' },
  { id: 'elecsa', label: 'ELECSA' },
  { id: 'other', label: 'Other', other: true },
]

const STEPS = 5

type CertEntry = { number: string }

type FormData = {
  companyName: string
  tradingName: string
  companiesHouseNumber: string
  contactName: string
  contactEmail: string
  contactPhone: string
  yearsTrading: string
  products: string[]
  certifications: Record<string, CertEntry>
  coveragePostcodes: string
  googleBusinessName: string
  trustpilotUrl: string
  password: string
  passwordConfirm: string
}

const PRODUCTS = [
  { id: 'solar',    label: 'Solar panels',    certs: 'MCS certification required' },
  { id: 'battery',  label: 'Battery storage', certs: 'MCS certification required' },
  { id: 'heatpump', label: 'Heat pumps',      certs: 'MCS + RECC required' },
  { id: 'ev',       label: 'EV chargers',     certs: 'NICEIC/NAPIT + OZEV required' },
]

const CERT_FIELDS: Record<string, { id: string; label: string; required: boolean }[]> = {
  solar:    [
    { id: 'mcs', label: 'MCS number', required: true },
    { id: 'recc', label: 'RECC or HIES number', required: true },
    { id: 'trustmark', label: 'TrustMark number', required: false },
  ],
  battery:  [
    { id: 'mcs', label: 'MCS number', required: true },
    { id: 'recc', label: 'RECC or HIES number', required: true },
  ],
  heatpump: [
    { id: 'mcs', label: 'MCS number', required: true },
    { id: 'recc', label: 'RECC or HIES number', required: true },
  ],
  ev:       [
    { id: 'niceic', label: 'NICEIC or NAPIT number', required: true },
    { id: 'ozev', label: 'OZEV authorisation number', required: true },
  ],
}

function getRequiredCerts(products: string[]) {
  const seen = new Set<string>()
  const fields: { id: string; label: string; required: boolean }[] = []
  for (const p of products) {
    for (const f of CERT_FIELDS[p] || []) {
      if (!seen.has(f.id)) { seen.add(f.id); fields.push(f) }
    }
  }
  return fields
}

function FieldInput({ label, value, onChange, type = 'text', placeholder, optional }: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string; optional?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-ws-ink mb-1.5">
        {label} {optional && <span className="text-ws-muted font-normal">(optional)</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-ws-border rounded-btn px-4 py-3 text-sm text-ws-ink placeholder:text-ws-muted focus:outline-none focus:border-ws-green bg-white"
      />
    </div>
  )
}

function CertField({ label, value, onChange, optional, onRemove, nameable }: {
  label: string; value: string; onChange: (v: string) => void
  optional?: boolean; onRemove?: () => void; nameable?: boolean
}) {
  const [certName, setCertName] = useState('')
  return (
    <div className="border border-ws-border rounded-tile px-4 py-4 bg-white space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-ws-ink">
          {label} {optional && <span className="text-ws-muted font-normal">(optional)</span>}
        </label>
        {onRemove && (
          <button type="button" onClick={onRemove} className="text-xs text-ws-muted hover:text-ws-red-text">Remove</button>
        )}
      </div>
      {nameable && (
        <input
          type="text"
          value={certName}
          onChange={e => setCertName(e.target.value)}
          placeholder="Certification name (e.g. OFTEC)"
          className="w-full border border-ws-border rounded-btn px-4 py-3 text-sm text-ws-ink placeholder:text-ws-muted focus:outline-none focus:border-ws-green bg-white"
        />
      )}
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={nameable ? 'Certification number' : `Enter your ${label.toLowerCase()}`}
        className="w-full border border-ws-border rounded-btn px-4 py-3 text-sm font-mono text-ws-ink placeholder:text-ws-muted focus:outline-none focus:border-ws-green bg-white"
      />
      <label className="flex items-center gap-2 cursor-pointer group w-fit">
        <div className="border border-dashed border-ws-border rounded-btn px-3 py-1.5 text-xs text-ws-muted group-hover:border-ws-green group-hover:text-ws-dark-green transition-colors flex items-center gap-1.5">
          <span>↑</span> Upload certificate <span className="text-ws-subtle">(optional — PDF or image)</span>
        </div>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" />
      </label>
    </div>
  )
}

export function InstallerRegisterForm() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<FormData>({
    companyName: '', tradingName: '', companiesHouseNumber: '', contactName: '', contactEmail: '',
    contactPhone: '', yearsTrading: '', products: [], certifications: {},
    coveragePostcodes: '', googleBusinessName: '', trustpilotUrl: '',
    password: '', passwordConfirm: '',
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [extraCerts, setExtraCerts] = useState<string[]>([])
  const [showExtraPicker, setShowExtraPicker] = useState(false)

  const set = (field: keyof FormData, value: unknown) =>
    setData(d => ({ ...d, [field]: value }))

  const toggleProduct = (id: string) =>
    set('products', data.products.includes(id)
      ? data.products.filter(p => p !== id)
      : [...data.products, id])

  const setCert = (id: string, field: keyof CertEntry, value: string) =>
    setData(d => ({
      ...d,
      certifications: {
        ...d.certifications,
        [id]: { ...(d.certifications[id] || { number: '' }), [field]: value },
      },
    }))

const canProceed = () => {
    if (step === 0) return data.companyName && data.contactName && data.contactEmail && data.contactPhone
    if (step === 1) return data.products.length > 0
    if (step === 2) {
      const required = getRequiredCerts(data.products).filter(f => f.required)
      return required.every(f => data.certifications[f.id]?.number)
    }
    if (step === 3) return data.coveragePostcodes.trim().length > 0
    if (step === 4) return !!(data.password && data.password === data.passwordConfirm)
    return true
  }

  const submit = async () => {
    setLoading(true)
    setError('')
    const res = await fetch('/api/installers/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) setError(json.error || 'Registration failed')
    else setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="pt-10 text-center max-w-sm mx-auto">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-6" style={{ background: '#EAF5EE' }}>
          <svg width="26" height="26" fill="none" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" stroke="#15A05A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1
          className="text-2xl font-bold text-ws-ink mb-3"
          style={{ fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.02em' }}
        >
          Application submitted.
        </h1>
        <p className="text-sm text-ws-muted leading-relaxed">
          We&apos;ll review your certifications and send you a decision by email — usually within 48 hours.
        </p>
      </div>
    )
  }

  const certFields = getRequiredCerts(data.products)

  return (
    <div className="pt-8">
      <ProgressBar steps={STEPS} current={step} />

      {step === 0 && (
        <div className="space-y-4">
          <div>
            <p className="eyebrow mb-3">Step 1 of 5</p>
            <h2 className="text-2xl font-bold text-ws-ink mb-6" style={{ fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.02em' }}>
              Business details
            </h2>
          </div>
          <div>
            <label className="block text-sm font-semibold text-ws-ink mb-1.5">Company name</label>
            <input
              type="text"
              value={data.companyName}
              onChange={e => set('companyName', e.target.value)}
              placeholder="e.g. Northside Solar Co. Ltd"
              className="w-full border border-ws-border rounded-btn px-4 py-3 text-sm text-ws-ink placeholder:text-ws-muted focus:outline-none focus:border-ws-green bg-white"
            />
            <p className="text-xs text-ws-muted mt-1.5">Enter your registered company name exactly as it appears on Companies House.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-ws-ink mb-1.5">Trading name <span className="text-ws-muted font-normal">(if applicable)</span></label>
            <input
              type="text"
              value={data.tradingName}
              onChange={e => set('tradingName', e.target.value)}
              placeholder="e.g. Northside Solar"
              className="w-full border border-ws-border rounded-btn px-4 py-3 text-sm text-ws-ink placeholder:text-ws-muted focus:outline-none focus:border-ws-green bg-white"
            />
            <p className="text-xs text-ws-muted mt-1.5">If you trade under a different name, enter it here — this is what customers will see. Leave blank to use your company name.</p>
          </div>
          <FieldInput label="Companies House number" optional value={data.companiesHouseNumber} onChange={v => set('companiesHouseNumber', v)} />
          <FieldInput label="Your name" value={data.contactName} onChange={v => set('contactName', v)} />
          <FieldInput label="Email address" type="email" value={data.contactEmail} onChange={v => set('contactEmail', v)} />
          <FieldInput label="Phone number" type="tel" value={data.contactPhone} onChange={v => set('contactPhone', v)} />
          <FieldInput label="Years trading" type="number" value={data.yearsTrading} onChange={v => set('yearsTrading', v)} />
        </div>
      )}

      {step === 1 && (
        <div>
          <p className="eyebrow mb-3">Step 2 of 5</p>
          <h2 className="text-2xl font-bold text-ws-ink mb-6" style={{ fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.02em' }}>
            What do you install?
          </h2>
          <div className="space-y-3">
            {PRODUCTS.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleProduct(p.id)}
                className="w-full text-left rounded-tile p-4 transition-all border"
                style={{
                  borderColor: data.products.includes(p.id) ? '#15A05A' : '#E4EAE6',
                  borderWidth: data.products.includes(p.id) ? 2 : 1,
                  background:  data.products.includes(p.id) ? '#EAF5EE' : '#fff',
                }}
              >
                <div className="font-semibold text-ws-ink">{p.label}</div>
                <div className="text-xs text-ws-muted mt-0.5">{p.certs}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div>
            <p className="eyebrow mb-3">Step 3 of 5</p>
            <h2 className="text-2xl font-bold text-ws-ink mb-2" style={{ fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.02em' }}>
              Certification numbers
            </h2>
            <p className="text-sm text-ws-muted mb-6 leading-relaxed">Our team manually checks each number against the relevant register before your account goes live.</p>
          </div>
          <div className="bg-[#F1FAF5] border border-[#CDE6D7] rounded-tile px-4 py-3 text-xs text-ws-dark-green leading-relaxed">
            <strong>Tip:</strong> uploading a copy of your certificate alongside your number helps us verify and approve your account quicker.
          </div>

          {/* Required certs for selected products */}
          {certFields.filter(f => f.required).map(f => (
            <CertField
              key={f.id}
              label={f.label}
              value={data.certifications[f.id]?.number || ''}
              onChange={v => setCert(f.id, 'number', v)}
            />
          ))}

          {/* Extra certs the installer has added */}
          {extraCerts.map((id, idx) => {
            const cert = ALL_OPTIONAL_CERTS.find(c => c.id === id)!
            const isOther = cert.other
            const otherId = `other_${idx}`
            return (
              <CertField
                key={id === 'other' ? otherId : id}
                label={isOther ? 'Other certification' : cert.label}
                optional
                nameable={isOther}
                value={data.certifications[isOther ? otherId : id]?.number || ''}
                onChange={v => setCert(isOther ? otherId : id, 'number', v)}
                onRemove={() => setExtraCerts(prev => prev.filter((_, i) => i !== idx))}
              />
            )
          })}

          {/* Add more */}
          {showExtraPicker ? (
            <div className="border border-ws-border rounded-tile px-4 py-3 bg-white space-y-2">
              <p className="text-xs font-semibold text-ws-muted">Select a certification to add</p>
              <select
                className="w-full border border-ws-border rounded-btn px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-ws-green"
                defaultValue=""
                onChange={e => {
                  const val = e.target.value
                  if (val && !extraCerts.includes(val)) {
                    setExtraCerts(prev => [...prev, val])
                  }
                  setShowExtraPicker(false)
                }}
              >
                <option value="" disabled>Choose…</option>
                {ALL_OPTIONAL_CERTS
                  .filter(c => c.other || (!extraCerts.includes(c.id) && !certFields.find(f => f.id === c.id)))
                  .map(c => <option key={c.id} value={c.id}>{c.label}</option>)
                }
              </select>
              <button
                type="button"
                onClick={() => setShowExtraPicker(false)}
                className="text-xs text-ws-muted hover:text-ws-ink"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowExtraPicker(true)}
              className="w-full border-2 border-dashed border-ws-border rounded-tile py-3 text-sm text-ws-muted hover:border-ws-green hover:text-ws-dark-green transition-colors font-semibold"
            >
              + Add another certification
            </button>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <p className="eyebrow mb-3">Step 4 of 5</p>
            <h2 className="text-2xl font-bold text-ws-ink mb-6" style={{ fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.02em' }}>
              Coverage area
            </h2>
          </div>
          <div>
            <label className="block text-sm font-semibold text-ws-ink mb-1.5">Postcode areas you cover</label>
            <textarea
              value={data.coveragePostcodes}
              onChange={e => set('coveragePostcodes', e.target.value)}
              rows={3}
              placeholder="e.g. NE, DH, SR, TS, YO"
              className="w-full border border-ws-border rounded-btn px-4 py-3 text-sm text-ws-ink placeholder:text-ws-muted focus:outline-none focus:border-ws-green bg-white resize-none"
            />
            <p className="text-xs text-ws-muted mt-1.5">You&apos;ll only receive briefs for properties within your coverage area.</p>
          </div>
          <FieldInput label="Google Business name" optional value={data.googleBusinessName} onChange={v => set('googleBusinessName', v)} placeholder="e.g. ABC Solar Ltd" />
          <FieldInput label="Trustpilot URL" optional value={data.trustpilotUrl} onChange={v => set('trustpilotUrl', v)} placeholder="https://uk.trustpilot.com/review/…" />
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div>
            <p className="eyebrow mb-3">Step 5 of 5</p>
            <h2 className="text-2xl font-bold text-ws-ink mb-6" style={{ fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.02em' }}>
              Create your portal password
            </h2>
          </div>
          <FieldInput label="Password" type="password" value={data.password} onChange={v => set('password', v)} />
          <FieldInput label="Confirm password" type="password" value={data.passwordConfirm} onChange={v => set('passwordConfirm', v)} />
          {data.password && data.passwordConfirm && data.password !== data.passwordConfirm && (
            <p className="text-ws-red-text text-sm">Passwords don&apos;t match.</p>
          )}

          <div className="border-t border-ws-border pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-ws-body"><span className="text-ws-muted">Registered name</span><span>{data.companyName}</span></div>
            {data.tradingName && <div className="flex justify-between text-ws-body"><span className="text-ws-muted">Trading as</span><span>{data.tradingName}</span></div>}
            <div className="flex justify-between text-ws-body"><span className="text-ws-muted">Name shown to customers</span><span className="font-semibold text-ws-dark-green">{data.tradingName || data.companyName}</span></div>
            <div className="flex justify-between text-ws-body"><span className="text-ws-muted">Email</span><span>{data.contactEmail}</span></div>
            <div className="flex justify-between text-ws-body"><span className="text-ws-muted">Products</span><span>{data.products.join(', ')}</span></div>
            <div className="flex justify-between text-ws-body"><span className="text-ws-muted">Coverage</span><span>{data.coveragePostcodes}</span></div>
          </div>

          {error && <p className="text-ws-red-text text-sm">{error}</p>}

          <Button onClick={submit} loading={loading} className="w-full">
            Submit application →
          </Button>
        </div>
      )}

      {step < STEPS - 1 && (
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep(s => Math.max(s - 1, 0))}
            className="text-sm text-ws-muted hover:text-ws-body font-medium"
            style={{ visibility: step === 0 ? 'hidden' : 'visible' }}
          >
            ← Back
          </button>
          <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
            Continue →
          </Button>
        </div>
      )}
    </div>
  )
}
