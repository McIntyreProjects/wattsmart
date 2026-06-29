'use client'
import { useState } from 'react'

const STEPS = ['Business details', 'Products you fit', 'Certifications', 'Coverage area', 'Agree to terms']

const PRODUCTS = [
  { id: 'solar', label: 'Solar PV', cert: 'needs MCS + RECC' },
  { id: 'battery', label: 'Battery storage', cert: 'needs MCS' },
  { id: 'heat', label: 'Heat pumps', cert: 'needs MCS + RECC' },
  { id: 'ev', label: 'EV chargers', cert: 'needs OZEV + NICEIC' },
]

export default function InstallerOnboardingPage() {
  const [step, setStep] = useState(1)
  const [selected, setSelected] = useState<string[]>(['solar', 'battery', 'ev'])
  const [hasScrolled, setHasScrolled] = useState(false)

  const handleTermsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
      setHasScrolled(true)
    }
  }

  const toggle = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink flex">
      {/* Sidebar */}
      <div className="w-56 bg-[#FAFBFA] border-r border-[#EDF1EE] p-6 flex-shrink-0">
        <div className="font-display font-extrabold text-lg tracking-tight mb-7">WattSmart</div>
        <div className="flex flex-col gap-5">
          {STEPS.map((label, i) => {
            const n = i + 1
            const done = n < step
            const active = n === step
            return (
              <div key={label} className="flex gap-3 items-center">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  done ? 'bg-ws-green text-white' :
                  active ? 'bg-ws-green text-white' :
                  'border-2 border-ws-border text-ws-subtle'
                }`}>
                  {done ? '✓' : n}
                </span>
                <span className={`text-sm ${active ? 'font-bold text-ws-ink' : done ? 'text-ws-muted' : 'text-ws-subtle'}`}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>
        {step === 5 && (
          <p className="text-xs text-ws-subtle mt-8 leading-relaxed border-t border-[#EDF1EE] pt-5">
            You can't receive briefs or quote until our terms are signed.
          </p>
        )}
      </div>

      {/* Main */}
      <div className="flex-1 p-10 max-w-2xl">
        {step === 1 && (
          <>
            <h1 className="font-display font-extrabold text-3xl tracking-tight mb-1">Tell us about your business</h1>
            <p className="text-sm text-ws-muted mb-7">We'll use this to set up your installer profile.</p>
            <div className="flex flex-col gap-4 max-w-md">
              {[
                { label: 'Business name', placeholder: 'Northside Solar Co. Ltd' },
                { label: 'Your name', placeholder: 'Daniel Okafor' },
                { label: 'Business email', placeholder: 'daniel@northsidesolar.co.uk' },
                { label: 'Mobile', placeholder: '07700 900 412' },
                { label: 'Base postcode', placeholder: 'DH1 3JZ' },
                { label: 'Years trading', placeholder: '12' },
              ].map((f) => (
                <div key={f.label}>
                  <label className="block text-xs font-semibold text-ws-muted mb-1.5">{f.label}</label>
                  <input placeholder={f.placeholder} className="w-full border border-ws-border rounded-btn px-3 py-3 text-sm focus:outline-none focus:border-ws-green" />
                </div>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="font-display font-extrabold text-3xl tracking-tight mb-1">Which products do you fit?</h1>
            <p className="text-sm text-ws-muted mb-7">We'll only send briefs that match — and check the right certs next.</p>
            <div className="grid grid-cols-2 gap-3 max-w-lg">
              {PRODUCTS.map((p) => {
                const on = selected.includes(p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => toggle(p.id)}
                    className={`text-left border-2 rounded-tile p-4 flex justify-between items-start transition-colors ${
                      on ? 'border-ws-green bg-[#F1FAF5]' : 'border-ws-border bg-white'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-sm">{p.label}</p>
                      <p className={`text-xs mt-1 ${on ? 'text-ws-dark-green' : 'text-ws-subtle'}`}>{p.cert}</p>
                    </div>
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                      on ? 'bg-ws-green text-white' : 'border-2 border-ws-border'
                    }`}>{on ? '✓' : ''}</span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="font-display font-extrabold text-3xl tracking-tight mb-1">Just your MCS number.</h1>
            <p className="text-sm text-ws-muted mb-7 leading-relaxed">Enter your certification numbers below. Our team will manually check each one against the relevant register — usually within 1 working day.</p>
            <div className="max-w-md">
              <p className="text-xs text-ws-muted mb-5 leading-relaxed">Enter your certification numbers below and optionally upload a copy of each certificate. Our team will check these manually — usually within 1 working day.</p>
              <div className="flex flex-col gap-3">
                {[
                  { id: 'mcs', label: 'MCS', sub: 'Microgeneration Certification', placeholder: 'e.g. NAP-1100-2284' },
                  { id: 'recc', label: 'RECC', sub: 'Renewable Energy Consumer Code', placeholder: 'e.g. RECC-00821' },
                  { id: 'niceic', label: 'NICEIC', sub: 'Electrical competence', placeholder: 'e.g. NICEIC-12345' },
                  { id: 'ozev', label: 'OZEV', sub: 'EV charge-point grant approval', placeholder: 'e.g. OZEV-67890' },
                  { id: 'trustmark', label: 'TrustMark', sub: 'Government-endorsed quality', placeholder: 'e.g. TM-112233' },
                ].map((r) => (
                  <div key={r.id} className="border border-ws-border rounded-tile px-4 py-3.5 bg-white">
                    <div className="flex items-center justify-between mb-2.5">
                      <div>
                        <span className="font-bold text-sm">{r.label}</span>
                        <span className="text-xs text-ws-muted ml-2">· {r.sub}</span>
                      </div>
                      <span className="text-xs text-ws-muted italic">optional</span>
                    </div>
                    <input
                      type="text"
                      placeholder={r.placeholder}
                      className="w-full border border-ws-border rounded-btn px-3 py-2 text-sm font-mono placeholder:text-ws-subtle focus:outline-none focus:border-ws-green mb-2.5"
                    />
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="border border-dashed border-ws-border rounded-btn px-3 py-1.5 text-xs text-ws-muted group-hover:border-ws-green group-hover:text-ws-dark-green transition-colors flex items-center gap-1.5">
                        <span>↑</span> Upload certificate (PDF or image)
                      </div>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" />
                    </label>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-[#F2F6F3] rounded-tile px-4 py-3 text-xs text-ws-muted leading-relaxed">
                Only fill in the certifications that apply to you. Our team will verify each one and notify you by email once your account is approved.
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="font-display font-extrabold text-3xl tracking-tight mb-1">Where do you cover?</h1>
            <p className="text-sm text-ws-muted mb-7">We'll match you with jobs in your area.</p>
            <div className="max-w-md flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-ws-muted mb-1.5">Postcode districts (e.g. DH, DL, NE, YO)</label>
                <input defaultValue="DH, DL, NE, YO" className="w-full border border-ws-border rounded-btn px-3 py-3 text-sm focus:outline-none focus:border-ws-green" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ws-muted mb-1.5">Max radius from base</label>
                <select className="w-full border border-ws-border rounded-btn px-3 py-3 text-sm bg-white focus:outline-none focus:border-ws-green">
                  <option>10 miles</option>
                  <option>25 miles</option>
                  <option selected>30 miles</option>
                  <option>50 miles</option>
                </select>
              </div>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h1 className="font-display font-extrabold text-3xl tracking-tight mb-1">Agree to our terms to go live</h1>
            <p className="text-sm text-ws-muted mb-6 leading-relaxed max-w-xl">One last step. Please read the WattSmart Installer Terms in full, then confirm and sign below.</p>
            <div className="flex items-center gap-3 border border-ws-border rounded-tile p-4 mb-4 max-w-lg">
              <span className="w-10 h-10 rounded-xl bg-ws-green-tint text-ws-dark-green flex items-center justify-center font-bold text-xs flex-shrink-0">PDF</span>
              <div className="flex-1">
                <p className="font-bold text-sm">WattSmart Installer Terms of Service</p>
                <p className="text-xs text-ws-subtle mt-0.5">v3.1 · updated 2 Jun 2026 · 14 pages</p>
              </div>
              <span className="text-xs font-semibold text-ws-dark-green whitespace-nowrap">Download PDF ↓</span>
            </div>
            <div className="border border-ws-border rounded-tile overflow-hidden max-w-lg mb-4">
              <div className="max-h-48 overflow-auto p-5 text-xs text-[#3D463F] leading-relaxed space-y-3" onScroll={handleTermsScroll}>
                <p className="font-bold text-sm">WattSmart Installer Terms of Service</p>
                <p className="text-xs text-ws-subtle">Version 3.1 · effective 2 June 2026</p>
                <p><strong>1. Eligibility &amp; certifications.</strong> You confirm your business holds, and will maintain for the life of your account, every certification required for the products you fit.</p>
                <p><strong>2. Anonymous quoting.</strong> Briefs are shared without customer contact details. You agree not to seek or accept identifying information until a quote is accepted through WattSmart.</p>
                <p><strong>3. Platform fee.</strong> We take 5% of the deposit and 5% of the balance, minimum £75 per job.</p>
                <p><strong>4. Deposits &amp; payments.</strong> Customer deposits are held and released by WattSmart once the customer confirms the install date.</p>
                <p><strong>5. Workmanship &amp; warranties.</strong> You remain solely responsible for the installation, its certification and any warranties offered to the customer.</p>
                <p><strong>6. Data protection.</strong> You will handle all customer information in line with UK GDPR.</p>
                <p><strong>7. Conduct &amp; removal.</strong> WattSmart may suspend or remove accounts for misrepresentation, invalid certifications, repeated poor reviews or breach of these terms.</p>
                <p className="text-center text-ws-subtle">— End of terms —</p>
              </div>
              {hasScrolled && (
                <div className="flex items-center gap-2 border-t border-[#EDF1EE] bg-[#F4FBF6] px-4 py-2.5">
                  <span className="w-5 h-5 rounded-full bg-ws-green text-white flex items-center justify-center text-xs">✓</span>
                  <span className="text-xs text-ws-dark-green font-semibold">You've read to the end</span>
                </div>
              )}
            </div>
            <div className="flex gap-3 items-start mb-5 max-w-lg">
              <span className="w-6 h-6 rounded-lg bg-ws-green text-white flex items-center justify-center text-sm flex-shrink-0 mt-0.5">✓</span>
              <p className="text-sm text-[#22302A] leading-relaxed">I confirm I have read and agree to the <strong>WattSmart Installer Terms of Service</strong>, the <strong>Fee Schedule</strong> (5% of deposit and balance, min £75) and the <strong>Privacy Policy</strong>, on behalf of my business.</p>
            </div>
            <div className="mb-5 max-w-lg">
              <label className="block text-xs font-semibold text-ws-muted mb-1.5">Sign with your full name</label>
              <div className="border-2 border-ws-green bg-[#FCFEFD] rounded-tile px-5 py-4 flex items-center justify-between">
                <span style={{fontFamily:'cursive'}} className="text-4xl font-semibold">Daniel Okafor</span>
                <button className="text-xs text-ws-dark-green font-semibold">Clear</button>
              </div>
              <p className="text-xs text-ws-subtle mt-2">Signed by <strong className="text-ws-ink">Daniel Okafor</strong> · Director, Northside Solar Co. Ltd · 16 Jun 2026, 14:32 BST · v3.1</p>
            </div>
          </>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 max-w-lg">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="border-2 border-ws-border rounded-btn px-5 py-3 font-semibold text-sm text-ws-ink hover:bg-ws-border transition-colors">
              ← Back
            </button>
          ) : <div />}
          <button
            onClick={() => setStep(Math.min(step + 1, 5))}
            className="bg-ws-green text-white rounded-btn px-6 py-3 font-bold text-sm hover:bg-ws-dark-green transition-colors"
          >
            {step === 5 ? 'Agree & activate account →' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  )
}
