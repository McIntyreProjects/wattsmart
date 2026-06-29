'use client'
import { useState } from 'react'
import Link from 'next/link'

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

export default function InstallerProfilePage() {
  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <Link href="/installer/dashboard" className="text-ws-muted text-sm">← Dashboard</Link>
          <h1 className="font-display font-extrabold text-2xl tracking-tight">Profile</h1>
          <div className="w-16" />
        </div>

        {/* Business identity */}
        <div className="flex gap-4 items-center mb-3">
          <div className="w-16 h-16 rounded-tile border-2 border-dashed border-ws-border bg-[#FAFBFA] flex flex-col items-center justify-center gap-1 cursor-pointer flex-shrink-0">
            <span className="text-xl text-ws-subtle">＋</span>
            <span className="text-xs text-ws-subtle font-semibold">Logo</span>
          </div>
          <div>
            <p className="font-display font-extrabold text-xl tracking-tight">Northside Solar Co.</p>
            <p className="text-xs text-ws-subtle">Durham · est. 2014 · 5 fitters</p>
            <button className="text-xs text-ws-dark-green font-semibold mt-1">＋ Add your logo</button>
          </div>
        </div>
        <div className="bg-[#F2F6F3] rounded-tile px-4 py-3 text-xs text-ws-muted leading-relaxed mb-6">
          Your logo appears beside your name <strong>once a customer has chosen you</strong> — never during anonymous quoting. PNG or SVG, transparent background works best.
        </div>

        {/* Services */}
        <div className="flex justify-between items-center mb-3">
          <p className="eyebrow">Services — accepting quotes</p>
        </div>
        <div className="border border-ws-border rounded-tile overflow-hidden mb-2">
          {[
            { label: 'Solar PV', sub: 'Requires MCS + RECC' },
            { label: 'Battery storage', sub: 'Requires MCS' },
            { label: 'EV chargers', sub: 'Requires OZEV + NICEIC' },
            { label: 'Heat pumps', sub: 'Requires MCS + NAPIT' },
          ].map((s, i, arr) => (
            <div key={s.label} className={`flex justify-between items-center px-4 py-3.5 bg-amber-50 ${i < arr.length - 1 ? 'border-b border-amber-100' : ''}`}>
              <div>
                <p className="font-bold text-sm text-amber-700">{s.label}</p>
                <p className="text-xs text-amber-600 mt-0.5">⚠ Locked — certs pending verification</p>
              </div>
              <Toggle on={false} locked />
            </div>
          ))}
        </div>
        <p className="text-xs text-ws-subtle leading-relaxed mb-6">
          Services unlock automatically once your relevant certificates have been verified by our team. You can then toggle individual services on or off yourself.
        </p>

        {/* Certifications */}
        <p className="eyebrow mb-3">Certifications</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {[
            { label: 'MCS', status: 'pending' },
            { label: 'RECC', status: 'pending' },
            { label: 'NICEIC', status: 'pending' },
            { label: 'NAPIT', status: 'pending' },
          ].map((c) => (
            <span key={c.label} className="text-xs rounded-lg px-3 py-1.5 font-medium border border-amber-200 bg-amber-50 text-amber-700">
              {c.label} · pending verification
            </span>
          ))}
        </div>
        <p className="text-xs text-ws-subtle leading-relaxed mb-6">
          Our team will verify your certificates manually — usually within 1 working day. Services unlock once each relevant cert is confirmed.
        </p>

        {/* Terms */}
        <p className="eyebrow mb-3">Your terms &amp; conditions</p>
        <div className="border border-ws-border rounded-tile p-4 mb-2">
          <p className="text-xs text-ws-muted leading-relaxed mb-4">Your terms for the <strong>install &amp; supply of goods</strong> — the contract between you and the customer.</p>
          <div className="flex justify-between items-center gap-3">
            <div className="flex gap-3 items-center">
              <span className="w-9 h-9 rounded-xl bg-ws-green-tint text-ws-dark-green flex items-center justify-center text-xs font-bold flex-shrink-0">DOC</span>
              <div>
                <p className="font-bold text-sm">Your-terms.pdf</p>
                <p className="text-xs text-ws-subtle">Uploaded 12 Jun · 88 KB</p>
              </div>
            </div>
            <button className="text-xs text-ws-dark-green font-semibold whitespace-nowrap">Replace</button>
          </div>
          <div className="flex items-start gap-2 mt-3 bg-[#F1FAF5] border border-[#CDE6D7] rounded-lg p-3">
            <span className="text-ws-dark-green text-xs">🔒</span>
            <p className="text-xs text-ws-dark-green leading-relaxed"><strong>Reformatted to WattSmart's template</strong> — company name, logo, address &amp; contact details removed. <span className="text-ws-muted">6 identifying items stripped.</span></p>
          </div>
          <div className="flex gap-3 items-center mt-3 flex-wrap">
            <button className="border-2 border-ws-green text-ws-dark-green rounded-lg px-4 py-2 font-semibold text-sm whitespace-nowrap hover:bg-ws-green-tint transition-colors">
              Preview anonymised version
            </button>
            <p className="text-xs text-ws-subtle flex-1">Shown to customers (anonymised) with your quote.</p>
          </div>
        </div>

        {/* Coverage */}
        <p className="eyebrow mt-6 mb-3">Coverage</p>
        <div className="flex gap-3 items-center mb-6">
          <div className="flex-1 border border-ws-border rounded-tile px-4 py-3 text-sm">DH, DL, NE, YO · within 25 miles of DH1</div>
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
        <div className="border border-ws-border rounded-tile px-4 py-3 flex justify-between items-center text-sm">
          <span>Barclays ••••4471</span>
          <span className="text-ws-green text-xs font-semibold">● verified</span>
        </div>
      </div>
    </div>
  )
}
