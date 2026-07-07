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
  businessAddress: string
  termsMode: 'pdf' | 'url'
  termsUrl: string
  termsPdfBase64: string
  termsPdfName: string
  yearsTrading: string
  products: string[]
  certifications: Record<string, CertEntry>
  basePostcode: string
  coveragePostcodes: string
  googleBusinessName: string
  trustpilotUrl: string
  password: string
  passwordConfirm: string
}

// Client-side cap below the server's 5MB decoded limit — base64 inflates the
// payload by ~33% and serverless request bodies are capped at ~4.5MB.
const MAX_TERMS_PDF_BYTES = 3 * 1024 * 1024

const PRODUCTS = [
  { id: 'solar',    label: 'Solar panels',    certs: 'MCS certification required' },
  { id: 'battery',  label: 'Battery storage', certs: 'MCS certification required' },
  { id: 'heatpump', label: 'Heat pumps',      certs: 'MCS certification required' },
  { id: 'ev',       label: 'EV chargers',     certs: 'OZEV authorisation required' },
]

// Only the certifications that are legally/mandatorily required for a product
// are marked required. Everything else (consumer codes, trade bodies) is
// collected if offered, but optional at registration.
const CERT_FIELDS: Record<string, { id: string; label: string; required: boolean }[]> = {
  solar:    [
    { id: 'mcs', label: 'MCS number', required: true },
    { id: 'recc', label: 'RECC or HIES number', required: false },
    { id: 'trustmark', label: 'TrustMark number', required: false },
  ],
  battery:  [
    { id: 'mcs', label: 'MCS number', required: true },
    { id: 'recc', label: 'RECC or HIES number', required: false },
  ],
  heatpump: [
    { id: 'mcs', label: 'MCS number', required: true },
    { id: 'recc', label: 'RECC or HIES number', required: false },
  ],
  ev:       [
    { id: 'ozev', label: 'OZEV authorisation number', required: true },
    { id: 'niceic', label: 'NICEIC or NAPIT number', required: false },
  ],
}

function getCertFields(products: string[]) {
  const fields: { id: string; label: string; required: boolean }[] = []
  for (const p of products) {
    for (const f of CERT_FIELDS[p] || []) {
      const existing = fields.find(x => x.id === f.id)
      if (!existing) fields.push({ ...f })
      else if (f.required) existing.required = true
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
    contactPhone: '', businessAddress: '', termsMode: 'pdf', termsUrl: '', termsPdfBase64: '',
    termsPdfName: '', yearsTrading: '', products: [], certifications: {},
    basePostcode: '', coveragePostcodes: '', googleBusinessName: '', trustpilotUrl: '',
    password: '', passwordConfirm: '',
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [termsFileError, setTermsFileError] = useState('')
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

  const handleTermsFile = (file: File | undefined) => {
    setTermsFileError('')
    if (!file) return
    if (file.type !== 'application/pdf') {
      setTermsFileError('Please upload a PDF file.')
      return
    }
    if (file.size > MAX_TERMS_PDF_BYTES) {
      setTermsFileError('PDF must be 3MB or smaller.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      if (!result.startsWith('data:application/pdf;base64,')) {
        setTermsFileError('Please upload a PDF file.')
        return
      }
      setData(d => ({ ...d, termsPdfBase64: result, termsPdfName: file.name }))
    }
    reader.onerror = () => setTermsFileError('Could not read that file. Please try again.')
    reader.readAsDataURL(file)
  }

  const termsProvided =
    data.termsMode === 'url'
      ? /^https:\/\/.+/i.test(data.termsUrl.trim())
      : !!data.termsPdfBase64

const canProceed = () => {
    if (step === 0) return data.companyName && data.contactName && data.contactEmail && data.contactPhone && data.businessAddress.trim() && termsProvided
    if (step === 1) return data.products.length > 0
    if (step === 2) {
      const required = getCertFields(data.products).filter(f => f.required)
      return required.every(f => data.certifications[f.id]?.number?.trim())
    }
    if (step === 3) return data.coveragePostcodes.trim().length > 0
    if (step === 4) return !!(data.password && data.password.length >= 8 && data.password === data.passwordConfirm)
    return true
  }

  const submit = async () => {
    setLoading(true)
    setError('')
    const res = await fetch('/api/installers/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Only send the terms field matching the chosen mode — the server
      // requires exactly one of termsUrl / termsPdfBase64.
      body: JSON.stringify({
        ...data,
        termsUrl: data.termsMode === 'url' ? data.termsUrl.trim() : '',
        termsPdfBase64: data.termsMode === 'pdf' ? data.termsPdfBase64 : '',
      }),
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
          style={{ fontFamily: 'var(--font-bricolage), sans-serif', letterSpacing: '-0.02em' }}
        >
          Application submitted.
        </h1>
        <p className="text-sm text-ws-muted leading-relaxed">
          We&apos;ll review your certifications and be in touch by email once your account is approved.
        </p>
      </div>
    )
  }

  const certFields = getCertFields(data.products)

  return (
    <div className="pt-8">
      <ProgressBar steps={STEPS} current={step} />

      {step === 0 && (
        <div className="space-y-4">
          <div>
            <p className="eyebrow mb-3">Step 1 of 5</p>
            <h2 className="text-2xl font-bold text-ws-ink mb-6" style={{ fontFamily: 'var(--font-bricolage), sans-serif', letterSpacing: '-0.02em' }}>
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
          <div>
            <label className="block text-sm font-semibold text-ws-ink mb-1.5">Business address — shown to customers before they pay</label>
            <textarea
              value={data.businessAddress}
              onChange={e => set('businessAddress', e.target.value)}
              rows={3}
              placeholder={'e.g. Unit 4, Riverside Business Park\nDurham\nDH1 2AB'}
              className="w-full border border-ws-border rounded-btn px-4 py-3 text-sm text-ws-ink placeholder:text-ws-muted focus:outline-none focus:border-ws-green bg-white resize-none"
            />
            <p className="text-xs text-ws-muted mt-1.5">UK consumer law requires us to show your trading address to customers before they pay a deposit.</p>
          </div>
          <FieldInput label="Your name" value={data.contactName} onChange={v => set('contactName', v)} />
          <FieldInput label="Email address" type="email" value={data.contactEmail} onChange={v => set('contactEmail', v)} />
          <FieldInput label="Phone number" type="tel" value={data.contactPhone} onChange={v => set('contactPhone', v)} />
          <div>
            <FieldInput label="Base postcode" value={data.basePostcode} onChange={v => set('basePostcode', v)} placeholder="e.g. DH1 3JZ" />
            <p className="text-xs text-ws-muted mt-1.5">Your business base — used to match you with nearby customers.</p>
          </div>
          <FieldInput label="Years trading" type="number" value={data.yearsTrading} onChange={v => set('yearsTrading', v)} />
          <div>
            <label className="block text-sm font-semibold text-ws-ink mb-1.5">Your terms &amp; conditions</label>
            <p className="text-xs text-ws-muted mb-2">Customers must be able to read your terms before they pay — upload a PDF or link to the terms page on your website.</p>
            <div className="flex border border-ws-border rounded-btn overflow-hidden w-fit mb-3">
              {([['pdf', 'Upload PDF'], ['url', 'Link to your terms page']] as const).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => set('termsMode', mode)}
                  className="px-3 py-1.5 text-sm transition-colors font-medium"
                  style={{ background: data.termsMode === mode ? '#15A05A' : '#fff', color: data.termsMode === mode ? '#fff' : '#7C887F' }}
                >
                  {label}
                </button>
              ))}
            </div>
            {data.termsMode === 'pdf' ? (
              <div>
                <label className="flex items-center gap-2 cursor-pointer group w-fit">
                  <div className="border border-dashed border-ws-border rounded-btn px-3 py-2 text-sm text-ws-muted group-hover:border-ws-green group-hover:text-ws-dark-green transition-colors flex items-center gap-1.5">
                    <span>↑</span> {data.termsPdfName || 'Upload your terms & conditions'} <span className="text-ws-subtle">(PDF, max 3MB)</span>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={e => handleTermsFile(e.target.files?.[0])}
                  />
                </label>
                {data.termsPdfName && !termsFileError && (
                  <p className="text-xs text-ws-dark-green mt-1.5">✓ {data.termsPdfName} attached</p>
                )}
                {termsFileError && <p className="text-xs text-ws-red-text mt-1.5">{termsFileError}</p>}
              </div>
            ) : (
              <div>
                <input
                  type="url"
                  value={data.termsUrl}
                  onChange={e => set('termsUrl', e.target.value)}
                  placeholder="https://yourcompany.co.uk/terms"
                  className="w-full border border-ws-border rounded-btn px-4 py-3 text-sm text-ws-ink placeholder:text-ws-muted focus:outline-none focus:border-ws-green bg-white"
                />
                <p className="text-xs text-ws-muted mt-1.5">Must be an https:// link customers can open without logging in.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <p className="eyebrow mb-3">Step 2 of 5</p>
          <h2 className="text-2xl font-bold text-ws-ink mb-6" style={{ fontFamily: 'var(--font-bricolage), sans-serif', letterSpacing: '-0.02em' }}>
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
            <h2 className="text-2xl font-bold text-ws-ink mb-2" style={{ fontFamily: 'var(--font-bricolage), sans-serif', letterSpacing: '-0.02em' }}>
              Certification numbers
            </h2>
            <p className="text-sm text-ws-muted mb-6 leading-relaxed">Our team manually checks each number against the relevant register before your account goes live.</p>
          </div>
          <div className="bg-[#F1FAF5] border border-[#CDE6D7] rounded-tile px-4 py-3 text-xs text-ws-dark-green leading-relaxed">
            <strong>Tip:</strong> uploading a copy of your certificate alongside your number helps us verify and approve your account quicker.
          </div>

          {/* Certs for selected products — mandatory ones first, optional clearly marked */}
          {[...certFields].sort((a, b) => Number(b.required) - Number(a.required)).map(f => (
            <CertField
              key={f.id}
              label={f.label}
              optional={!f.required}
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
            <h2 className="text-2xl font-bold text-ws-ink mb-6" style={{ fontFamily: 'var(--font-bricolage), sans-serif', letterSpacing: '-0.02em' }}>
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
            <h2 className="text-2xl font-bold text-ws-ink mb-6" style={{ fontFamily: 'var(--font-bricolage), sans-serif', letterSpacing: '-0.02em' }}>
              Create your portal password
            </h2>
          </div>
          <FieldInput label="Password" type="password" value={data.password} onChange={v => set('password', v)} />
          <FieldInput label="Confirm password" type="password" value={data.passwordConfirm} onChange={v => set('passwordConfirm', v)} />
          {data.password && data.password.length < 8 && (
            <p className="text-ws-red-text text-sm">Password must be at least 8 characters.</p>
          )}
          {data.password && data.password.length >= 8 && data.passwordConfirm && data.password !== data.passwordConfirm && (
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
