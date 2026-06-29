'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface DocEntry {
  type: string
  label: string
  sub: string
  date: string | null
  ready: boolean
  icon: string
  ref?: string
}

export default function DocumentsPage() {
  const router = useRouter()
  const [docs, setDocs] = useState<DocEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [enquiryRef, setEnquiryRef] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/auth/login')
        return
      }

      // Get customer record
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!customer) {
        setLoading(false)
        return
      }

      // Get enquiries with payments
      const { data: enquiries } = await supabase
        .from('enquiries')
        .select('id, reference, status, created_at')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (!enquiries || enquiries.length === 0) {
        setLoading(false)
        return
      }

      const enquiry = enquiries[0]
      setEnquiryRef(enquiry.reference)

      const { data: payments } = await supabase
        .from('payments')
        .select('id, type, amount, status, paid_at, stripe_payment_intent_id')
        .eq('enquiry_id', enquiry.id)
        .in('status', ['held', 'released', 'refunded'])
        .order('paid_at', { ascending: true })

      const built: DocEntry[] = []

      for (const p of payments ?? []) {
        if (!p.paid_at) continue
        const dateStr = new Date(p.paid_at).toLocaleDateString('en-GB', {
          day: 'numeric', month: 'short', year: 'numeric'
        })
        const amountStr = `£${(p.amount / 100).toFixed(2)}`
        const ref = p.stripe_payment_intent_id ?? p.id

        if (p.type === 'deposit') {
          built.push({
            type: 'deposit_receipt',
            label: 'Deposit receipt',
            sub: `${amountStr} · Ref: ${ref}`,
            date: dateStr,
            ready: true,
            icon: '🧾',
            ref,
          })
        } else if (p.type === 'final') {
          built.push({
            type: 'balance_receipt',
            label: 'Balance payment receipt',
            sub: `${amountStr} · Ref: ${ref}`,
            date: dateStr,
            ready: true,
            icon: '💷',
            ref,
          })
        }
      }

      // Always show pending placeholders for documents not yet available
      const pendingDocs: DocEntry[] = [
        { type: 'survey_report', label: 'Survey report', sub: 'Uploaded by installer after survey', date: null, ready: false, icon: '🔍' },
        { type: 'dno_approval', label: 'DNO / G99 approval', sub: 'Grid connection approval', date: null, ready: false, icon: '⚡' },
        { type: 'mcs_cert', label: 'MCS installation certificate', sub: 'Auto-appears after install', date: null, ready: false, icon: '🏅' },
        { type: 'electrical_cert', label: 'Electrical installation cert (EIC)', sub: 'Auto-appears after install', date: null, ready: false, icon: '📝' },
        { type: 'warranty', label: 'Manufacturer warranty docs', sub: 'Auto-appears after install', date: null, ready: false, icon: '🛡' },
      ]

      setDocs([...built, ...pendingDocs])
      setLoading(false)
    }

    load()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#E7EAE7' }}>
        <nav className="bg-white border-b border-ws-border">
          <div className="max-w-content mx-auto px-5 py-4 flex items-center gap-4">
            <Logo />
          </div>
        </nav>
        <main className="max-w-content mx-auto px-5 py-8">
          <p className="text-sm text-ws-muted">Loading your documents…</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#E7EAE7' }}>
      <nav className="bg-white border-b border-ws-border">
        <div className="max-w-content mx-auto px-5 py-4 flex items-center gap-4">
          <Logo />
          <Link href="/customer/dashboard" className="text-sm text-ws-muted hover:text-ws-body">← Dashboard</Link>
        </div>
      </nav>

      <main className="max-w-content mx-auto px-5 py-8">
        {enquiryRef && <p className="eyebrow mb-1">Job {enquiryRef}</p>}
        <h1 className="font-display font-extrabold text-2xl tracking-tight mb-1">Your documents</h1>
        <p className="text-sm text-ws-muted mb-6">Documents are added automatically as your job progresses. They live here throughout — you can always come back.</p>

        {docs.length === 0 ? (
          <div className="border border-ws-border rounded-tile bg-white px-6 py-10 text-center">
            <p className="text-sm text-ws-muted">No documents yet. They&apos;ll appear here as your job progresses.</p>
          </div>
        ) : (
          <div className="border border-ws-border rounded-tile overflow-hidden">
            {docs.map((doc, i) => (
              <div
                key={doc.type}
                className={`flex items-center gap-4 px-4 py-4 ${i < docs.length - 1 ? 'border-b border-[#EDF1EE]' : ''} ${doc.ready ? 'bg-white' : 'bg-[#FAFBFA]'}`}
              >
                <span className="text-2xl flex-shrink-0">{doc.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${!doc.ready ? 'text-ws-muted' : ''}`}>{doc.label}</p>
                  <p className="text-xs text-ws-subtle mt-0.5">{doc.sub}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  {doc.ready ? (
                    <>
                      <p className="text-xs text-ws-muted mb-1">{doc.date}</p>
                      <span className="text-xs font-semibold text-ws-muted cursor-not-allowed opacity-60">Coming soon</span>
                    </>
                  ) : (
                    <span className="text-xs text-ws-subtle">Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-ws-muted mt-4 leading-relaxed">
          All documents are stored securely. MCS certificates, electrical certs and warranty docs are uploaded directly by your installer after installation is complete. Your account and documents are retained for 7 years (GDPR + tax).
        </p>
      </main>
    </div>
  )
}
