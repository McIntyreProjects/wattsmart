'use client'
import Link from 'next/link'
import { useState } from 'react'

const monthBars = [42, 55, 50, 68, 80, 96]
const yearBars = [30, 48, 62, 80, 99]
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
const years = ['2022', '2023', '2024', '2025', '2026']

const recent = [
  { label: 'Solar · SR2 · #WS-1990', amount: '+£412' },
  { label: 'Heat pump · YO1 · #WS-1987', amount: '+£640' },
  { label: 'EV · NE3 · #WS-1985', amount: '+£58' },
]

export default function AdminFeesPage() {
  const [period, setPeriod] = useState<'month' | 'year'>('month')
  const bars = period === 'month' ? monthBars : yearBars
  const labels = period === 'month' ? months : years
  const total = period === 'month' ? '£4,820' : '£28,440'
  const sub = period === 'month' ? 'Jun 2026 · 13 jobs completed' : '2026 YTD · 63 jobs completed'

  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink">
      <nav className="flex items-center gap-8 px-6 py-4 bg-white border-b border-ws-border">
        <span className="font-display font-extrabold text-lg tracking-tight">WattSmart</span>
        <div className="flex gap-6 text-sm text-ws-muted">
          <Link href="/admin/dashboard" className="hover:text-ws-ink">Overview</Link>
          <Link href="/admin/customers" className="hover:text-ws-ink">Customers</Link>
          <Link href="/admin/installers" className="hover:text-ws-ink">Installers</Link>
          <Link href="/admin/pipeline" className="hover:text-ws-ink">Pipeline</Link>
          <span className="text-ws-dark-green font-bold border-b-2 border-ws-green pb-1">Fees</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-xs text-ws-subtle">Fee income · {period === 'month' ? 'this month' : 'year to date'}</p>
            <p className="font-display font-extrabold text-5xl text-ws-green mt-1">{total}</p>
            <p className="text-xs text-ws-subtle mt-1">{sub}</p>
          </div>
          <div className="flex bg-[#EEF3F0] rounded-lg p-0.5">
            {(['month', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${period === p ? 'bg-white text-ws-dark-green shadow-sm' : 'text-ws-muted'}`}
              >
                {p === 'month' ? 'Month' : 'Year'}
              </button>
            ))}
          </div>
        </div>

        {/* Bar chart */}
        <div className="flex items-end gap-3 h-28 border-b border-ws-border mb-2">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 rounded-t-md" style={{height: `${h}%`, background: h === Math.max(...bars) ? '#15A05A' : h > 70 ? '#A7DBBF' : '#CDE6D7'}} />
          ))}
        </div>
        <div className="flex justify-between text-xs text-ws-subtle mb-8">
          {labels.map((l) => <span key={l}>{l}</span>)}
        </div>

        {/* Recent fees */}
        <p className="eyebrow mb-3">Recent — auto-collected on completion</p>
        <div className="flex flex-col gap-0 border border-ws-border rounded-tile overflow-hidden">
          {recent.map((r, i) => (
            <div key={r.label} className={`flex justify-between items-center px-4 py-3.5 text-sm ${i < recent.length - 1 ? 'border-b border-[#EDF1EE]' : ''}`}>
              <span>{r.label}</span>
              <span className="font-mono text-ws-dark-green font-semibold">{r.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
