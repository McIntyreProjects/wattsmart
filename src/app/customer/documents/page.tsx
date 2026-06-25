import { Logo } from '@/components/ui/Logo'
import Link from 'next/link'

const DOCS = [
  { type: 'quote', label: 'Quote B — full specification', sub: 'Solar + battery · £8,990', date: '12 Jun 2026', ready: true, icon: '📄' },
  { type: 'installer_terms', label: "Installer's terms & conditions", sub: 'Anonymised until reveal · v1.0', date: '12 Jun 2026', ready: true, icon: '📋' },
  { type: 'deposit_receipt', label: 'Deposit receipt', sub: '£250 · Stripe ref PI_xxx', date: '14 Jun 2026', ready: true, icon: '🧾' },
  { type: 'survey_report', label: 'Survey report', sub: 'Uploaded by installer', date: '18 Jun 2026', ready: true, icon: '🔍' },
  { type: 'dno_approval', label: 'DNO / G99 approval', sub: 'Grid connection approved', date: '22 Jun 2026', ready: true, icon: '⚡' },
  { type: 'mcs_cert', label: 'MCS installation certificate', sub: 'Auto-appears after install', date: null, ready: false, icon: '🏅' },
  { type: 'electrical_cert', label: 'Electrical installation cert (EIC)', sub: 'Auto-appears after install', date: null, ready: false, icon: '📝' },
  { type: 'warranty', label: 'Manufacturer warranty docs', sub: 'Auto-appears after install', date: null, ready: false, icon: '🛡' },
  { type: 'final_invoice', label: 'Final invoice', sub: 'Auto-generated when balance paid', date: null, ready: false, icon: '💷' },
]

export default function DocumentsPage() {
  return (
    <div className="min-h-screen" style={{ background: '#E7EAE7' }}>
      <nav className="bg-white border-b border-ws-border">
        <div className="max-w-content mx-auto px-5 py-4 flex items-center gap-4">
          <Logo />
          <Link href="/customer/dashboard" className="text-sm text-ws-muted hover:text-ws-body">← Dashboard</Link>
        </div>
      </nav>

      <main className="max-w-content mx-auto px-5 py-8">
        <p className="eyebrow mb-1">Job #WS-2041</p>
        <h1 className="font-display font-extrabold text-2xl tracking-tight mb-1">Your documents</h1>
        <p className="text-sm text-ws-muted mb-6">Documents are added automatically as your job progresses. They live here throughout — you can always come back.</p>

        <div className="border border-ws-border rounded-tile overflow-hidden">
          {DOCS.map((doc, i) => (
            <div key={doc.type} className={`flex items-center gap-4 px-4 py-4 ${i < DOCS.length - 1 ? 'border-b border-[#EDF1EE]' : ''} ${doc.ready ? 'bg-white' : 'bg-[#FAFBFA]'}`}>
              <span className="text-2xl flex-shrink-0">{doc.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${!doc.ready ? 'text-ws-muted' : ''}`}>{doc.label}</p>
                <p className="text-xs text-ws-subtle mt-0.5">{doc.sub}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                {doc.ready ? (
                  <>
                    <p className="text-xs text-ws-muted mb-1">{doc.date}</p>
                    <button className="text-xs font-semibold text-ws-green hover:underline">Download</button>
                  </>
                ) : (
                  <span className="text-xs text-ws-subtle">Pending</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-ws-muted mt-4 leading-relaxed">
          All documents are stored securely. MCS certificates, electrical certs and warranty docs are uploaded directly by your installer after installation is complete. Your account and documents are retained for 7 years (GDPR + tax).
        </p>
      </main>
    </div>
  )
}
