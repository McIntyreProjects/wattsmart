'use client'
import Link from 'next/link'
import { useState } from 'react'

const sections = ['Business & billing', 'Payouts', 'Notifications & digest', 'Automation', 'Team & access', 'Data & legal']

export default function AdminSettingsPage() {
  const [active, setActive] = useState('Business & billing')

  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink">
      <nav className="flex items-center gap-8 px-6 py-4 bg-white border-b border-ws-border">
        <span className="font-display font-extrabold text-lg tracking-tight">WattSmart</span>
        <div className="flex gap-6 text-sm text-ws-muted">
          <Link href="/admin/dashboard" className="hover:text-ws-ink">Overview</Link>
          <Link href="/admin/customers" className="hover:text-ws-ink">Customers</Link>
          <Link href="/admin/installers" className="hover:text-ws-ink">Installers</Link>
          <Link href="/admin/pipeline" className="hover:text-ws-ink">Pipeline</Link>
          <Link href="/admin/fees" className="hover:text-ws-ink">Fees</Link>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-57px)]">
        {/* Sidebar */}
        <div className="w-56 flex-shrink-0 border-r border-[#EDF1EE] bg-[#FBFCFB] p-4">
          <p className="eyebrow px-3 mb-2">Settings</p>
          <div className="flex flex-col gap-0.5">
            {sections.map((s) => (
              <button
                key={s}
                onClick={() => setActive(s)}
                className={`text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active === s ? 'bg-ws-green-tint text-ws-dark-green font-semibold' : 'text-ws-muted hover:text-ws-ink'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-[#EDF1EE] flex items-center gap-2.5 px-3">
            <span className="w-8 h-8 rounded-full bg-ws-green text-white flex items-center justify-center text-xs font-bold flex-shrink-0">JD</span>
            <div className="text-xs leading-tight">
              <p className="font-bold">Owner</p>
              <p className="text-ws-subtle">Full access</p>
            </div>
          </div>
        </div>

        {/* Panel */}
        <div className="flex-1 p-8 max-w-2xl">
          {active === 'Business & billing' && (
            <>
              <h2 className="font-display font-extrabold text-2xl tracking-tight mb-1">Business &amp; billing</h2>
              <p className="text-sm text-ws-muted mb-5">Your legal entity, invoice details, and how VAT appears on fee invoices.</p>
              <div className="border border-[#EDF1EE] rounded-tile overflow-hidden mb-5">
                {[
                  { label: 'Legal name', value: 'WattSmart Ltd' },
                  { label: 'Company no.', value: '14829006' },
                  { label: 'Registered address', value: '12 Saddler Street, Durham DH1 3NU' },
                  { label: 'Billing email', value: 'billing@wattsmart.co.uk' },
                ].map((r, i, arr) => (
                  <div key={r.label} className={`flex justify-between items-center text-sm px-4 py-3 ${i < arr.length - 1 ? 'border-b border-[#EDF1EE]' : ''}`}>
                    <span className="text-ws-muted">{r.label}</span>
                    <strong className="font-mono text-xs">{r.value}</strong>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center border border-ws-border rounded-tile p-4 bg-[#FAFBFA]">
                <div>
                  <p className="font-bold text-sm">Charge VAT on referral fees</p>
                  <p className="text-xs text-ws-muted mt-0.5">Not registered — below £90k threshold</p>
                </div>
                <div className="w-11 h-6 rounded-full bg-[#D9E1DC] flex items-center px-0.5">
                  <span className="w-5 h-5 rounded-full bg-white" />
                </div>
              </div>
              <p className="text-xs text-ws-subtle mt-2 leading-relaxed">When you register for VAT, flip this on — every fee invoice instantly adds a VAT @ 20% line.</p>
            </>
          )}

          {active === 'Team & access' && (
            <>
              <h2 className="font-display font-extrabold text-2xl tracking-tight mb-1">Team &amp; access</h2>
              <p className="text-sm text-ws-muted mb-5">Invite-only — team members can't self-register. Send an invite and they'll create their account from the link.</p>
              <div className="border border-ws-border rounded-tile overflow-hidden mb-5">
                {[
                  { name: 'James D.', email: 'james@wattsmart.co.uk', role: 'Owner', initials: 'JD' },
                ].map((m) => (
                  <div key={m.email} className="flex items-center gap-3 px-4 py-3.5">
                    <span className="w-9 h-9 rounded-full bg-ws-green text-white flex items-center justify-center text-sm font-bold flex-shrink-0">{m.initials}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{m.name}</p>
                      <p className="text-xs text-ws-subtle">{m.email}</p>
                    </div>
                    <span className="text-xs border border-ws-border rounded-lg px-2.5 py-1 text-ws-muted">{m.role}</span>
                  </div>
                ))}
              </div>
              <button className="bg-ws-green text-white rounded-btn px-5 py-3 font-bold text-sm hover:bg-ws-dark-green transition-colors">
                Send invite →
              </button>
            </>
          )}

          {active === 'Automation' && (
            <>
              <h2 className="font-display font-extrabold text-2xl tracking-tight mb-1">Automation</h2>
              <p className="text-sm text-ws-muted mb-5">Tune how much runs without you. These rules fire automatically — you only see the exceptions.</p>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Auto-approve refunds under £500', sub: 'Pre-survey cancellations refunded without review', on: true },
                  { label: 'Auto-pause on cert lapse', sub: 'Pause affected products the day a cert expires', on: true },
                  { label: 'Auto-resume on re-verification', sub: 'Lift the pause the moment re-check passes', on: true },
                  { label: 'Flag insurance within 14 days of expiry', sub: 'Surface to admin before auto-pause kicks in', on: true },
                  { label: 'Quote expiry window', sub: '14 days — installers agree to hold quotes this long', on: true },
                ].map((rule) => (
                  <div key={rule.label} className="flex justify-between items-start border border-ws-border rounded-tile p-4">
                    <div className="flex-1 mr-4">
                      <p className="font-semibold text-sm">{rule.label}</p>
                      <p className="text-xs text-ws-muted mt-0.5">{rule.sub}</p>
                    </div>
                    <div className={`w-11 h-6 rounded-full flex items-center px-0.5 flex-shrink-0 ${rule.on ? 'bg-ws-green' : 'bg-[#D9E1DC]'}`}>
                      <span className={`w-5 h-5 rounded-full bg-white ${rule.on ? 'translate-x-5' : ''} transition-transform`} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!['Business & billing', 'Team & access', 'Automation'].includes(active) && (
            <div className="text-ws-muted text-sm mt-4">
              <h2 className="font-display font-extrabold text-2xl tracking-tight text-ws-ink mb-3">{active}</h2>
              <p>Settings for this section coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
