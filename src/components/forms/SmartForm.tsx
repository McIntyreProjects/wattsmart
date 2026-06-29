'use client'

import { useState } from 'react'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { calculateRecommendation } from '@/lib/recommendation'
import { formatCurrency } from '@/lib/utils'
import type { RecommendationResult } from '@/types'

const STEPS = 6

type FormData = {
  products: string[]
  postcode: string; propertyType: string; propertyAge: string; ownership: string
  roofType: string; roofOrientation: string; shading: string
  monthlyKwh: string; monthlyBill: string; electricitySupplier: string
  goal: 'cover' | 'export' | ''
  firstName: string; lastName: string; email: string; phone: string
  preferredContact: string[]; notes: string
}

const initial: FormData = {
  products: [], postcode: '', propertyType: '', propertyAge: '', ownership: '',
  roofType: '', roofOrientation: '', shading: '',
  monthlyKwh: '', monthlyBill: '', electricitySupplier: '',
  goal: '', firstName: '', lastName: '', email: '', phone: '',
  preferredContact: [], notes: '',
}

const PRODUCTS = [
  { id: 'solar',    label: 'Solar panels',    sub: 'Generate your own electricity' },
  { id: 'battery',  label: 'Battery storage', sub: 'Store energy for later' },
  { id: 'heatpump', label: 'Heat pump',        sub: 'Low-carbon heating · £7,500 grant' },
  { id: 'ev',       label: 'EV charger',       sub: 'Charge at home overnight' },
  { id: 'unsure',   label: 'Not sure yet',     sub: 'Help me decide' },
]

const CONTACT_METHODS = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'text',     label: 'Text' },
  { id: 'email',    label: 'Email' },
  { id: 'phone',    label: 'Phone call' },
]

function Tile({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-tile p-4 transition-all border text-sm"
      style={{
        borderColor: selected ? '#15A05A' : '#E4EAE6',
        borderWidth: selected ? 2 : 1,
        background: selected ? '#EAF5EE' : '#fff',
      }}
    >
      {children}
    </button>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-ws-ink mb-1.5">{children}</label>
}

function Input({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-ws-border rounded-btn px-4 py-3 text-sm text-ws-ink placeholder:text-ws-muted focus:outline-none focus:border-ws-green bg-white"
    />
  )
}

function Select({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]; placeholder?: string
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full border border-ws-border rounded-btn px-4 py-3 text-sm text-ws-ink bg-white focus:outline-none focus:border-ws-green"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

export function SmartForm() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<FormData>(initial)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [ref, setRef] = useState('')
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null)
  const [error, setError] = useState('')

  const set = (field: keyof FormData, value: unknown) =>
    setData(d => ({ ...d, [field]: value }))

  const toggleProduct = (id: string) => {
    if (id === 'unsure') {
      set('products', data.products.includes('unsure') ? [] : ['unsure'])
    } else {
      const without = data.products.filter(p => p !== 'unsure')
      set('products', without.includes(id) ? without.filter(p => p !== id) : [...without, id])
    }
  }

  const toggleContact = (id: string) =>
    set('preferredContact', data.preferredContact.includes(id)
      ? data.preferredContact.filter(c => c !== id)
      : [...data.preferredContact, id])

  const needsRoof = data.products.some(p => ['solar', 'battery'].includes(p))

  const canProceed = () => {
    if (step === 0) return data.products.length > 0
    if (step === 1) return !!(data.postcode && data.propertyType && data.propertyAge && data.ownership)
    if (step === 2) return !!(data.monthlyKwh && data.monthlyBill)
    if (step === 3) return data.goal !== ''
    if (step === 4) return !!(data.firstName && data.lastName && data.email)
    return true
  }

  const next = () => {
    if (step === 4) {
      const rec = calculateRecommendation({
        monthlyKwh: parseInt(data.monthlyKwh),
        roofOrientation: data.roofOrientation || 'south',
        goal: data.goal as 'cover' | 'export',
        products: data.products,
      })
      setRecommendation(rec)
    }
    setStep(s => Math.min(s + 1, STEPS - 1))
  }

  const submit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/enquiries/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, recommendation }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Something went wrong')
      setRef(json.reference)
      setSubmitted(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="pt-10 text-center max-w-sm mx-auto">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-6" style={{ background: '#EAF5EE' }}>
          <svg width="26" height="26" fill="none" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" stroke="#15A05A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-ws-ink mb-2" style={{ fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.02em' }}>
          Enquiry submitted.
        </h1>
        <p className="text-ws-muted mb-1">Your reference is <strong className="text-ws-ink">{ref}</strong>.</p>
        <p className="text-sm text-ws-muted leading-relaxed">
          We&apos;re matching you with certified local installers now. You&apos;ll hear back within 5 days once quotes are ready to compare.
        </p>

        <a
          href="/customer/dashboard"
          className="mt-6 block w-full bg-ws-green text-white rounded-btn py-3.5 font-bold text-sm text-center"
        >
          Track your quotes →
        </a>

        <p className="mt-3 text-xs text-ws-muted leading-relaxed">
          We&apos;ve created an account for <strong>{data.email}</strong>. Check your inbox for a magic link to log in — no password needed.
        </p>
      </div>
    )
  }

  return (
    <div className="pt-6">
      <ProgressBar steps={STEPS} current={step} />

      {/* Step 0 — Products */}
      {step === 0 && (
        <div>
          <p className="eyebrow mb-3">1 / 6</p>
          <h2 className="text-2xl font-bold text-ws-ink mb-1" style={{ fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.02em' }}>
            What are you thinking of?
          </h2>
          <p className="text-sm text-ws-muted mb-6">Pick all that apply — we&apos;ll tailor the rest.</p>
          <div className="space-y-2">
            {PRODUCTS.map(p => (
              <Tile key={p.id} selected={data.products.includes(p.id)} onClick={() => toggleProduct(p.id)}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-ws-ink">{p.label}</div>
                    <div className="text-ws-muted text-xs mt-0.5">{p.sub}</div>
                  </div>
                  {data.products.includes(p.id) && (
                    <svg className="flex-shrink-0 w-5 h-5 text-ws-green" fill="none" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" stroke="#15A05A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </Tile>
            ))}
          </div>
          <p className="text-xs text-ws-muted mt-4">You&apos;ll set up a quick account at the end to view your quotes</p>
        </div>
      )}

      {/* Step 1 — Property */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <p className="eyebrow mb-3">2 / 6</p>
            <h2 className="text-2xl font-bold text-ws-ink mb-6" style={{ fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.02em' }}>
              About your property
            </h2>
          </div>
          <div>
            <FieldLabel>Postcode</FieldLabel>
            <Input value={data.postcode} onChange={v => set('postcode', v.toUpperCase())} placeholder="e.g. NE1 4ST" />
          </div>
          <div>
            <FieldLabel>Property type</FieldLabel>
            <Select value={data.propertyType} onChange={v => set('propertyType', v)} placeholder="Select…"
              options={[
                { value: 'detached',     label: 'Detached' },
                { value: 'semi-detached',label: 'Semi-detached' },
                { value: 'terraced',     label: 'Terraced' },
                { value: 'bungalow',     label: 'Bungalow' },
                { value: 'flat',         label: 'Flat' },
              ]}
            />
          </div>
          <div>
            <FieldLabel>Property age</FieldLabel>
            <Select value={data.propertyAge} onChange={v => set('propertyAge', v)} placeholder="Select…"
              options={[
                { value: 'pre-1930',   label: 'Pre-1930' },
                { value: '1930s-1960s',label: '1930s–1960s' },
                { value: '1970s-1990s',label: '1970s–1990s' },
                { value: '2000s+',     label: '2000s or newer' },
                { value: 'not-sure',   label: 'Not sure' },
              ]}
            />
          </div>
          <div>
            <FieldLabel>Ownership</FieldLabel>
            <Select value={data.ownership} onChange={v => set('ownership', v)} placeholder="Select…"
              options={[
                { value: 'own',    label: 'Own' },
                { value: 'rent',   label: 'Rent' },
                { value: 'shared', label: 'Shared ownership' },
              ]}
            />
          </div>
          {needsRoof && <>
            <div>
              <FieldLabel>Roof type</FieldLabel>
              <Select value={data.roofType} onChange={v => set('roofType', v)} placeholder="Select…"
                options={[
                  { value: 'pitched', label: 'Pitched' },
                  { value: 'flat',    label: 'Flat' },
                  { value: 'mixed',   label: 'Mixed' },
                ]}
              />
            </div>
            <div>
              <FieldLabel>Roof orientation</FieldLabel>
              <Select value={data.roofOrientation} onChange={v => set('roofOrientation', v)} placeholder="Select…"
                options={[
                  { value: 'south',     label: 'South facing' },
                  { value: 'east-west', label: 'East–West' },
                  { value: 'north',     label: 'North facing' },
                  { value: 'not-sure',  label: 'Not sure' },
                ]}
              />
            </div>
            <div>
              <FieldLabel>Shading issues</FieldLabel>
              <Select value={data.shading} onChange={v => set('shading', v)} placeholder="Select…"
                options={[
                  { value: 'none',        label: 'None' },
                  { value: 'some',        label: 'Some' },
                  { value: 'significant', label: 'Significant' },
                  { value: 'not-sure',    label: 'Not sure' },
                ]}
              />
            </div>
          </>}
        </div>
      )}

      {/* Step 2 — Energy usage */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <p className="eyebrow mb-3">3 / 6</p>
            <h2 className="text-2xl font-bold text-ws-ink mb-6" style={{ fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.02em' }}>
              Your energy usage
            </h2>
          </div>
          <div>
            <FieldLabel>Monthly electricity usage</FieldLabel>
            <Select value={data.monthlyKwh} onChange={v => set('monthlyKwh', v)} placeholder="Select…"
              options={[
                { value: '150', label: 'Under 200 kWh' },
                { value: '250', label: '200–300 kWh' },
                { value: '350', label: '300–400 kWh' },
                { value: '450', label: '400–500 kWh' },
                { value: '600', label: '500–700 kWh' },
                { value: '800', label: '700+ kWh' },
              ]}
            />
          </div>
          <div>
            <FieldLabel>Monthly energy bill</FieldLabel>
            <Select value={data.monthlyBill} onChange={v => set('monthlyBill', v)} placeholder="Select…"
              options={[
                { value: '50',  label: 'Under £75' },
                { value: '100', label: '£75–£125' },
                { value: '150', label: '£125–£175' },
                { value: '200', label: '£175–£225' },
                { value: '275', label: '£225–£325' },
                { value: '375', label: '£325+' },
              ]}
            />
          </div>
          <div>
            <FieldLabel>Electricity supplier <span className="text-ws-muted font-normal">(optional)</span></FieldLabel>
            <Input value={data.electricitySupplier} onChange={v => set('electricitySupplier', v)} placeholder="e.g. Octopus Energy" />
          </div>
        </div>
      )}

      {/* Step 3 — Goal */}
      {step === 3 && (
        <div>
          <p className="eyebrow mb-3">5 / 6</p>
          <h2 className="text-2xl font-bold text-ws-ink mb-1" style={{ fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.02em' }}>
            What&apos;s your goal?
          </h2>
          <p className="text-sm text-ws-muted mb-6">This helps us size your system correctly.</p>
          <div className="space-y-3">
            <Tile selected={data.goal === 'cover'} onClick={() => set('goal', 'cover')}>
              <div className="font-semibold text-ws-ink">Cover what I use</div>
              <div className="text-sm text-ws-muted mt-1 leading-relaxed">
                System sized to offset your consumption. Lower upfront cost. Bills close to zero.
              </div>
            </Tile>
            <Tile selected={data.goal === 'export'} onClick={() => set('goal', 'export')}>
              <div className="font-semibold text-ws-ink">Cover and earn</div>
              <div className="text-sm text-ws-muted mt-1 leading-relaxed">
                Larger system generating surplus for export income via the Smart Export Guarantee.
              </div>
            </Tile>
          </div>
        </div>
      )}

      {/* Step 4 — Contact */}
      {step === 4 && (
        <div className="space-y-4">
          <div>
            <p className="eyebrow mb-3">6 / 6</p>
            <h2 className="text-2xl font-bold text-ws-ink mb-6" style={{ fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.02em' }}>
              Where should installers quote for?
            </h2>
          </div>
          <div className="bg-ws-green-tint border border-ws-green/20 rounded-tile p-4 text-sm">
            <span className="font-semibold text-ws-green-deep">Used WattSmart before?</span>
            {' '}
            <button className="underline text-ws-green font-medium" type="button">Log in to autofill →</button>
            <p className="text-ws-muted mt-1 text-xs">— or just fill it in below —</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>First name</FieldLabel>
              <Input value={data.firstName} onChange={v => set('firstName', v)} placeholder="Jane" />
            </div>
            <div>
              <FieldLabel>Last name</FieldLabel>
              <Input value={data.lastName} onChange={v => set('lastName', v)} placeholder="Smith" />
            </div>
          </div>
          <div>
            <FieldLabel>Email</FieldLabel>
            <Input type="email" value={data.email} onChange={v => set('email', v)} placeholder="jane@example.com" />
          </div>
          <div>
            <FieldLabel>Phone <span className="text-ws-muted font-normal">(optional)</span></FieldLabel>
            <Input type="tel" value={data.phone} onChange={v => set('phone', v)} placeholder="+44 7700 900000" />
          </div>
          <div>
            <FieldLabel>Preferred contact</FieldLabel>
            <div className="flex flex-wrap gap-2 mt-1">
              {CONTACT_METHODS.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleContact(m.id)}
                  className="rounded-pill px-3 py-1.5 text-sm font-medium transition-all border"
                  style={{
                    borderColor: data.preferredContact.includes(m.id) ? '#15A05A' : '#E4EAE6',
                    background:  data.preferredContact.includes(m.id) ? '#EAF5EE' : '#fff',
                    color:       data.preferredContact.includes(m.id) ? '#0E7A43' : '#7C887F',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <FieldLabel>Notes <span className="text-ws-muted font-normal">(optional)</span></FieldLabel>
            <textarea
              value={data.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              placeholder="Anything you'd like installers to know…"
              className="w-full border border-ws-border rounded-btn px-4 py-3 text-sm text-ws-ink placeholder:text-ws-muted focus:outline-none focus:border-ws-green bg-white resize-none"
            />
          </div>
          <p className="text-xs text-ws-muted">
            Your details are never shared with installers until you choose to proceed.
          </p>
        </div>
      )}

      {/* Step 5 — Recommendation */}
      {step === 5 && recommendation && (
        <div>
          <p className="eyebrow mb-3">Your recommendation</p>
          <h2 className="text-2xl font-bold text-ws-ink mb-6" style={{ fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.02em' }}>
            Here&apos;s what we recommend.
          </h2>

          <div className="space-y-3 mb-8">
            {data.products.includes('solar') && recommendation.panels && (
              <div className="bg-ws-card rounded-card border border-ws-border p-5">
                <span className="tag-solar inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-semibold mb-3">Solar panels</span>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><div className="text-ws-muted text-xs">Panels</div><div className="font-semibold text-ws-ink mt-0.5">{recommendation.panels}</div></div>
                  <div><div className="text-ws-muted text-xs">System size</div><div className="font-semibold text-ws-ink mt-0.5">{recommendation.systemKwp} kWp</div></div>
                  <div><div className="text-ws-muted text-xs">Annual saving</div><div className="font-semibold text-ws-green mt-0.5">~£{recommendation.annualSaving?.toLocaleString()}/yr</div></div>
                  <div><div className="text-ws-muted text-xs">Payback</div><div className="font-semibold text-ws-ink mt-0.5">~{recommendation.paybackYears} yrs</div></div>
                </div>
                {recommendation.systemCost && (
                  <div className="mt-3 pt-3 border-t border-ws-border text-sm">
                    <span className="text-ws-muted text-xs">Estimated cost: </span>
                    <span className="font-semibold text-ws-ink">{formatCurrency(recommendation.systemCost * 100)}</span>
                  </div>
                )}
              </div>
            )}
            {data.products.includes('battery') && recommendation.batteryKwh && (
              <div className="bg-ws-card rounded-card border border-ws-border p-5">
                <span className="tag-battery inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-semibold mb-3">Battery storage</span>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><div className="text-ws-muted text-xs">Capacity</div><div className="font-semibold text-ws-ink mt-0.5">{recommendation.batteryKwh} kWh</div></div>
                  <div><div className="text-ws-muted text-xs">Coverage</div><div className="font-semibold text-ws-ink mt-0.5">~{Math.round(recommendation.batteryKwh / 0.5)} hrs</div></div>
                </div>
                <p className="text-xs text-ws-muted mt-2">10-year warranty typical</p>
              </div>
            )}
            {data.products.includes('heatpump') && (
              <div className="bg-ws-card rounded-card border border-ws-border p-5">
                <span className="tag-heatpump inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-semibold mb-3">Heat pump</span>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><div className="text-ws-muted text-xs">Type</div><div className="font-semibold text-ws-ink mt-0.5">Air source</div></div>
                  <div><div className="text-ws-muted text-xs">Grant available</div><div className="font-semibold text-ws-green mt-0.5">£7,500*</div></div>
                  <div><div className="text-ws-muted text-xs">Bill saving</div><div className="font-semibold text-ws-ink mt-0.5">~40%</div></div>
                  <div><div className="text-ws-muted text-xs">Efficiency</div><div className="font-semibold text-ws-ink mt-0.5">300%+</div></div>
                </div>
                <p className="text-xs text-ws-muted mt-2">*Boiler Upgrade Scheme — subject to eligibility.</p>
              </div>
            )}
            {data.products.includes('ev') && (
              <div className="bg-ws-card rounded-card border border-ws-border p-5">
                <span className="tag-ev inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-semibold mb-3">EV charger</span>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><div className="text-ws-muted text-xs">Output</div><div className="font-semibold text-ws-ink mt-0.5">7kW</div></div>
                  <div><div className="text-ws-muted text-xs">Full charge</div><div className="font-semibold text-ws-ink mt-0.5">~8 hours</div></div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-ws-green-tint border border-ws-green/20 rounded-card p-4 mb-6 text-sm leading-relaxed text-ws-body">
            We&apos;ll send your anonymous property details to three trusted, certified local installers. They&apos;ll each provide a quote — you compare them side by side without knowing who&apos;s who.
          </div>

          {error && <p className="text-ws-red-text text-sm mb-4">{error}</p>}
          <Button onClick={submit} loading={loading} className="w-full">
            Request 3 anonymous quotes →
          </Button>
        </div>
      )}

      {/* Navigation */}
      {step < 5 && (
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep(s => Math.max(s - 1, 0))}
            className="text-sm text-ws-muted hover:text-ws-body font-medium"
            style={{ visibility: step === 0 ? 'hidden' : 'visible' }}
          >
            ← Back
          </button>
          <Button onClick={next} disabled={!canProceed()}>
            {step === 4 ? 'See my recommendation →' : 'Continue →'}
          </Button>
        </div>
      )}
    </div>
  )
}
