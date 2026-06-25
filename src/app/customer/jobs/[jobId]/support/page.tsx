'use client'
import Link from 'next/link'
import { useState } from 'react'

const topics = [
  { id: 'workmanship', label: 'Quality of the work', sub: 'Something wrong with the installation itself', route: 'installer' },
  { id: 'installer-service', label: "Installer's service", sub: 'Communication, timekeeping, conduct', route: 'installer' },
  { id: 'deposit', label: 'My deposit or payment', sub: 'Refund, charge, or payment question', route: 'wattsmart' },
  { id: 'tracking', label: 'Tracking or documents', sub: 'Portal, documents, job status', route: 'wattsmart' },
  { id: 'account', label: 'My account', sub: 'Login, settings, data', route: 'wattsmart' },
]

export default function SupportPage({ params }: { params: { jobId: string } }) {
  const [selected, setSelected] = useState<string | null>(null)
  const topic = topics.find((t) => t.id === selected)

  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/customer/jobs/${params.jobId}`} className="text-ws-muted text-lg">←</Link>
          <h1 className="font-display font-extrabold text-2xl tracking-tight">Something's wrong</h1>
        </div>

        <p className="text-sm text-ws-muted leading-relaxed mb-5">
          Tell us what's happened and we'll point you to the right place — or handle it ourselves.
        </p>

        {/* Topic picker */}
        <div className="flex flex-col gap-2 mb-6">
          {topics.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(t.id)}
              className={`text-left border rounded-tile px-4 py-3.5 transition-colors ${
                selected === t.id
                  ? 'border-ws-green bg-[#F1FAF5]'
                  : 'border-ws-border bg-white hover:border-ws-green'
              }`}
            >
              <p className="font-semibold text-sm">{t.label}</p>
              <p className="text-xs text-ws-muted mt-0.5">{t.sub}</p>
            </button>
          ))}
        </div>

        {/* Routed response */}
        {topic && (
          <div className={`rounded-tile p-4 mb-5 ${
            topic.route === 'installer'
              ? 'bg-[#F2F6F3] border border-ws-border'
              : 'bg-[#F1FAF5] border border-[#CDE6D7]'
          }`}>
            {topic.route === 'installer' ? (
              <>
                <p className="font-bold text-sm mb-2">This one goes to your installer</p>
                <p className="text-sm text-[#3D463F] leading-relaxed mb-3">
                  Workmanship and service issues are between you and your installer — that's who carries the liability and the warranties. Your in-app message trail is the best first step.
                </p>
                <button className="w-full bg-ws-green text-white rounded-btn py-3 font-bold text-sm mb-2 hover:bg-ws-dark-green transition-colors">
                  Message Northside Solar
                </button>
                <div className="border border-ws-border rounded-btn p-3 bg-white mt-2">
                  <p className="text-xs font-semibold text-ws-ink mb-0.5">Independent escalation route</p>
                  <p className="text-xs text-ws-muted leading-relaxed">
                    If messaging doesn't resolve it, you can raise a formal complaint via <strong>RECC</strong> or <strong>TrustMark</strong> — the independent consumer codes your installer is registered with.
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="font-bold text-sm text-ws-dark-green mb-2">We'll sort this for you</p>
                <p className="text-sm text-[#22302A] leading-relaxed mb-3">
                  Deposit, payment and account issues are handled directly by WattSmart. Use the form below and we'll reply within one working day.
                </p>
                <Link href="/contact" className="block w-full bg-ws-green text-white rounded-btn py-3 font-bold text-sm text-center hover:bg-ws-dark-green transition-colors">
                  Contact WattSmart
                </Link>
              </>
            )}
          </div>
        )}

        {!selected && (
          <p className="text-xs text-ws-subtle text-center">Select a topic above to see the right route</p>
        )}
      </div>
    </div>
  )
}
