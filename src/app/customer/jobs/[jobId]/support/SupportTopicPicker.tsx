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

interface Props {
  jobId: string
  installerName: string
  installerEmail: string | null
}

export default function SupportTopicPicker({ installerName, installerEmail }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const topic = topics.find((t) => t.id === selected)

  return (
    <>
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
                Workmanship and service issues are between you and your installer — that&apos;s who carries the liability and the warranties. Emailing them directly is the best first step.
              </p>
              {installerEmail ? (
                <a
                  href={`mailto:${installerEmail}`}
                  className="block w-full bg-ws-green text-white rounded-btn py-3 font-bold text-sm mb-2 hover:bg-ws-dark-green transition-colors text-center"
                >
                  Email {installerName}
                </a>
              ) : (
                <p className="text-sm text-ws-muted mb-2">Installer contact details will be available once your deposit is paid.</p>
              )}
              <div className="border border-ws-border rounded-btn p-3 bg-white mt-2">
                <p className="text-xs font-semibold text-ws-ink mb-0.5">Independent escalation route</p>
                <p className="text-xs text-ws-muted leading-relaxed">
                  If messaging doesn&apos;t resolve it, you can raise a formal complaint through the independent consumer code your installer is registered with (such as RECC, HIES or TrustMark) — ask us and we&apos;ll point you to the right one.
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="font-bold text-sm text-ws-dark-green mb-2">We&apos;ll sort this for you</p>
              <p className="text-sm text-[#22302A] leading-relaxed mb-3">
                Deposit, payment and account issues are handled directly by WattSmart. Use the form below and we&apos;ll reply within one working day.
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
    </>
  )
}
