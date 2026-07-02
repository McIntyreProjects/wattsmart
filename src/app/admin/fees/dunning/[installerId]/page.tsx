import Link from 'next/link'
import { use } from 'react'

export default function AdminDunningPage({ params }: { params: Promise<{ installerId: string }> }) {
  const { installerId } = use(params)

  const steps = [
    { label: 'Invoice issued', detail: 'Day 0 · 16 Jul', done: true, active: false },
    { label: 'Automated reminder · email', detail: 'Day 30 · 15 Aug', done: true, active: false },
    { label: 'Interest starts · 8% over base', detail: 'Day 30 · 15 Aug', done: true, active: false },
    { label: 'Final notice · email + SMS · today', detail: 'Day 45 · 30 Aug', done: false, active: true },
    { label: 'Suspended — no new briefs', detail: 'Day 60 · in 15 days', done: false, active: false },
    { label: 'Referred to debt recovery', detail: 'After Day 60', done: false, active: false },
  ]

  return (
    <div className="min-h-screen bg-ws-bg">
      <nav className="flex items-center gap-8 px-6 py-4 bg-white border-b border-ws-border">
        <span className="font-display font-extrabold text-lg tracking-tight">WattSmart</span>
        <Link href="/admin/fees" className="text-sm text-ws-muted hover:text-ws-body">← Fees</Link>
      </nav>

      <div className="max-w-xl mx-auto px-6 py-8">
        <p className="eyebrow mb-1">Overdue fee</p>
        <h1 className="font-display font-extrabold text-2xl tracking-tight mb-1">Brightwatt Renewables</h1>
        <p className="text-sm text-ws-muted mb-5">Invoice #F-1987 · £450 · off-platform balance · <span className="text-ws-red-text font-semibold">45 days overdue</span></p>
        <p className="text-xs text-ws-muted mb-6">Job #WS-1987</p>

        <div className="bg-white border border-ws-border rounded-tile p-5 mb-5">
          <p className="text-xs font-semibold text-ws-muted uppercase tracking-wider mb-4">Escalation ladder · automatic</p>
          <div className="relative">
            <div className="absolute left-3.5 top-4 bottom-4 w-0.5 bg-[#EDF1EE]" />
            <div className="flex flex-col gap-4">
              {steps.map((step, i) => (
                <div key={step.label} className="flex items-start gap-3 relative">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 relative z-10 ${
                    step.done ? 'bg-ws-green text-white' :
                    step.active ? 'bg-ws-amber-bg border-2 border-amber-400 text-amber-600' :
                    'bg-[#F2F6F3] border border-ws-border text-ws-subtle'
                  }`}>
                    {step.done ? '✓' : step.active ? '!' : '○'}
                  </span>
                  <div className="pt-0.5">
                    <p className={`text-sm font-semibold ${step.active ? 'text-amber-700' : step.done ? 'text-ws-muted' : 'text-ws-subtle'}`}>{step.label}</p>
                    <p className="text-xs text-ws-muted">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-5">
          <button className="w-full border-2 border-ws-red-text text-ws-red-text rounded-btn py-3 font-bold text-sm hover:bg-ws-red-bg transition-colors">
            Suspend from matching now
          </button>
          <button className="w-full border-2 border-ws-border rounded-btn py-3 font-semibold text-sm text-ws-body hover:bg-[#F2F6F3] transition-colors">
            Send final notice now
          </button>
          <button className="w-full border-2 border-ws-border rounded-btn py-3 font-semibold text-sm text-ws-body hover:bg-[#F2F6F3] transition-colors">
            Mark as paid
          </button>
          <button className="w-full border border-ws-border rounded-btn py-3 font-medium text-sm text-ws-muted hover:bg-[#F2F6F3] transition-colors">
            Write off
          </button>
        </div>

        <p className="text-xs text-ws-muted leading-relaxed">
          🔗 The installer sees every step on their Fees owed screen, and agreed in the Installer Terms that non-payment pauses new matching. Fees taken at source via Stripe never reach this ladder.
        </p>
      </div>
    </div>
  )
}
