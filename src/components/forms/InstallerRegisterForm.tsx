'use client'

import { useState } from 'react'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { CertStatusBadge } from '@/components/ui/Badge'

const STEPS = 5

type CertEntry = { number: string; status: 'pending' | 'verified' | 'failed'; source?: string }

type FormData = {
  companyName: string
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

export function InstallerRegisterForm() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<FormData>({
    companyName: '', companiesHouseNumber: '', contactName: '', contactEmail: '',
    contactPhone: '', yearsTrading: '', products: [], certifications: {},
    coveragePostcodes: '', googleBusinessName: '', trustpilotUrl: '',
    password: '', passwordConfirm: '',
  })
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

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
        [id]: { ...(d.certifications[id] || { number: '', status: 'pending' }), [field]: value },
      },
    }))

  const verifyCert = async (type: string) => {
    const cert = data.certifications[type]
    if (!cert?.number) return
    setVerifying(type)
    const res = await fetch('/api/installers/verify-cert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, number: cert.number }),
    })
    const result = await res.json()
    setCert(type, 'status', result.verified ? 'verified' : 'failed')
    if (result.source) setCert(type, 'source', result.source)
    setVerifying(null)
  }

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
          <FieldInput label="Company name" value={data.companyName} onChange={v => set('companyName', v)} />
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
            <h2 className="text-2xl font-bold text-ws-ink mb-6" style={{ fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.02em' }}>
              Certification numbers
            </h2>
          </div>
          {certFields.map(f => (
            <div key={f.id}>
              <label className="block text-sm font-semibold text-ws-ink mb-1.5">
                {f.label} {!f.required && <span className="text-ws-muted font-normal">(optional)</span>}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={data.certifications[f.id]?.number || ''}
                  onChange={e => setCert(f.id, 'number', e.target.value)}
                  placeholder={`Enter ${f.label.toLowerCase()}`}
                  className="flex-1 border border-ws-border rounded-btn px-4 py-3 text-sm text-ws-ink placeholder:text-ws-muted focus:outline-none focus:border-ws-green bg-white"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => verifyCert(f.id)}
                  loading={verifying === f.id}
                  disabled={!data.certifications[f.id]?.number}
                >
                  Check
                </Button>
              </div>
              {data.certifications[f.id]?.status && data.certifications[f.id].status !== 'pending' && (
                <div className="mt-1.5 flex items-center gap-2">
                  <CertStatusBadge status={data.certifications[f.id].status} />
                  {data.certifications[f.id].source && (
                    <span className="text-xs text-ws-muted">{data.certifications[f.id].source}</span>
                  )}
                </div>
              )}
            </div>
          ))}
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
            <div className="flex justify-between text-ws-body"><span className="text-ws-muted">Company</span><span>{data.companyName}</span></div>
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
