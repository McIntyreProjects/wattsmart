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
            <p className="text-sm text-ws-muted mb-7 leading-relaxed">Enter one ID — we pull your RECC, NICEIC, insurance and Companies House record from it, then check every register live.</p>
            <div className="max-w-md">
              <label className="block text-xs font-semibold text-ws-muted mb-1.5">MCS membership no.</label>
              <div className="border-2 border-ws-green rounded-btn px-4 py-3 flex justify-between items-center">
                <span className="font-mono text-sm">NAP-1100-2284</span>
                <span className="text-xs text-ws-green font-semibold">✓ found</span>
              </div>
              <p className="text-xs text-ws-muted mt-2 leading-relaxed">↳ From this we auto-found your company reg (08842210), RECC &amp; £2m insurance.</p>
              <button className="w-full bg-ws-green text-white rounded-btn py-3 font-bold text-sm mt-5 hover:bg-ws-dark-green transition-colors">
                Run verification
              </button>
              <div className="flex flex-col gap-2.5 mt-6">
                {[
                  { label: 'MCS', sub: 'Microgeneration Certification', status: 'verified · exp 04/27', ok: true },
                  { label: 'RECC', sub: 'Renewable Energy Consumer Code', status: 'verified · exp 09/26', ok: true },
                  { label: 'NICEIC', sub: 'electrical competence', status: 'verified · exp 01/27', ok: true },
                  { label: 'OZEV', sub: 'EV charge-point grant approval', status: 'verified · exp 11/26', ok: true },
                  { label: 'TrustMark', sub: 'government-endorsed quality', status: 'checking…', pending: true },
                  { label: 'NAPIT', sub: 'lapsed 02/26', status: 'action needed', error: true },
                ].map((r) => (
                  <div key={r.label} className={`flex items-center gap-3 border rounded-tile px-4 py-3 ${
                    r.ok ? 'border-[#CDE6D7] bg-[#F1FAF5]' :
                    r.error ? 'border-[#ECC9BE] bg-[#FBEFEA]' :
                    'border-ws-border'
                  }`}>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                      r.ok ? 'bg-ws-green text-white' :
                      r.error ? 'bg-[#C2603F] text-white' :
                      'border-2 border-amber-400 text-amber-500'
                    }`}>{r.ok ? '✓' : r.error ? '!' : '◐'}</span>
                    <div className="flex-1">
                      <span className="font-bold text-sm">{r.label}</span>
                      <span className="text-xs text-ws-muted ml-2">· {r.sub}</span>
                      {r.error && <p className="text-xs text-[#C2603F] mt-0.5">Renew to offer heat pumps. Other products stay active.</p>}
                    </div>
                    <span className={`font-mono text-xs whitespace-nowrap ${r.ok ? 'text-ws-dark-green' : r.error ? 'text-[#C2603F]' : 'text-amber-500'}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
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
              <div className="max-h-48 overflow-auto p-5 text-xs text-[#3D463F] leading-relaxed space-y-3">
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
              <div className="flex items-center gap-2 border-t border-[#EDF1EE] bg-[#F4FBF6] px-4 py-2.5">
                <span className="w-5 h-5 rounded-full bg-ws-green text-white flex items-center justify-center text-xs">✓</span>
                <span className="text-xs text-ws-dark-green font-semibold">You've read to the end</span>
              </div>
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
