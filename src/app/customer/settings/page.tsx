'use client'
import Link from 'next/link'
import { useState } from 'react'

function Toggle({ on }: { on: boolean }) {
  const [value, setValue] = useState(on)
  return (
    <button
      onClick={() => setValue(!value)}
      className={`w-11 h-6 rounded-full flex items-center px-0.5 flex-shrink-0 transition-colors ${value ? 'bg-ws-green' : 'bg-[#D9E1DC]'}`}
    >
      <span className={`w-5 h-5 rounded-full bg-white transition-transform ${value ? 'translate-x-5' : ''}`} />
    </button>
  )
}

export default function CustomerSettingsPage() {
  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/customer/dashboard" className="text-ws-muted text-lg">←</Link>
          <h1 className="font-display font-extrabold text-2xl tracking-tight">Account &amp; settings</h1>
        </div>

        {/* Your details */}
        <p className="eyebrow mb-3">Your details</p>
        <div className="border border-ws-border rounded-tile overflow-hidden mb-6">
          {[
            { label: 'Name', value: 'Sarah Mills' },
            { label: 'Email', value: 'sarah.mills@email.co.uk' },
            { label: 'Mobile', value: '07700 900 412' },
            { label: 'Password', value: '••••••••', action: 'Change' },
          ].map((row, i, arr) => (
            <div
              key={row.label}
              className={`flex justify-between items-center px-4 py-3.5 ${i < arr.length - 1 ? 'border-b border-[#EDF1EE]' : ''}`}
            >
              <div>
                <p className="text-xs text-ws-subtle">{row.label}</p>
                <p className="font-semibold text-sm mt-0.5">{row.value}</p>
              </div>
              <button className="text-xs text-ws-dark-green font-semibold">{row.action ?? 'Edit'}</button>
            </div>
          ))}
        </div>

        {/* Notifications */}
        <p className="eyebrow mb-3">Notifications</p>
        <div className="border border-ws-border rounded-tile overflow-hidden mb-6">
          {[
            { title: 'Quote & job updates', sub: 'Email · the important stuff', on: true },
            { title: 'SMS reminders', sub: 'Survey & payment dates', on: true },
            { title: 'Tips & offers', sub: 'Occasional, never spammy', on: false },
          ].map((row, i, arr) => (
            <div
              key={row.title}
              className={`flex justify-between items-center px-4 py-3.5 ${i < arr.length - 1 ? 'border-b border-[#EDF1EE]' : ''}`}
            >
              <div>
                <p className="font-semibold text-sm">{row.title}</p>
                <p className="text-xs text-ws-subtle mt-0.5">{row.sub}</p>
              </div>
              <Toggle on={row.on} />
            </div>
          ))}
        </div>

        {/* Privacy & data */}
        <p className="eyebrow mb-3">Privacy &amp; data</p>
        <div className="border border-ws-border rounded-tile overflow-hidden mb-6">
          <div className="flex justify-between items-center px-4 py-3.5 border-b border-[#EDF1EE]">
            <span className="font-semibold text-sm">Download my data</span>
            <span className="text-ws-subtle">→</span>
          </div>
          <div className="flex justify-between items-center px-4 py-3.5">
            <div>
              <p className="font-semibold text-sm text-[#C2603F]">Delete my account</p>
              <p className="text-xs text-ws-subtle mt-0.5">Erases your data — can't be undone</p>
            </div>
            <span className="text-[#C2603F]">→</span>
          </div>
        </div>

        {/* Log out */}
        <button className="w-full border border-ws-border rounded-tile py-3.5 font-semibold text-sm text-[#3D463F] hover:bg-ws-border transition-colors">
          Log out
        </button>
      </div>
    </div>
  )
}
