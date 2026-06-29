import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'

type Enquiry = {
  id: string
  reference: string
  postcode: string
  products: string[]
  status: string
  created_at: string
}

const COLUMNS: { status: string[]; label: string; done?: boolean; amber?: boolean }[] = [
  { status: ['quotes_requested', 'quotes_received'], label: 'Quoting' },
  { status: ['installer_chosen', 'deposit_paid'], label: 'Chosen' },
  { status: ['installation_confirmed'], label: 'Booked' },
  { status: ['complete'], label: 'Done', done: true },
]

export default async function AdminPipelinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') redirect('/auth/login?type=admin')

  const admin = await createAdminClient()
  const { data: enquiries } = await admin
    .from('enquiries')
    .select('id, reference, postcode, products, status, created_at')
    .not('status', 'in', '(cancelled)')
    .order('created_at', { ascending: false })

  const all = (enquiries || []) as Enquiry[]

  const grouped = COLUMNS.map(col => {
    const items = all.filter(e => col.status.includes(e.status))
    return { ...col, items, count: items.length, preview: items.slice(0, 2), more: Math.max(0, items.length - 2) }
  })

  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink">
      <nav className="flex items-center gap-8 px-6 py-4 bg-white border-b border-ws-border">
        <span className="font-display font-extrabold text-lg tracking-tight">WattSmart</span>
        <div className="flex gap-6 text-sm text-ws-muted">
          <Link href="/admin/dashboard" className="hover:text-ws-ink">Overview</Link>
          <Link href="/admin/customers" className="hover:text-ws-ink">Customers</Link>
          <Link href="/admin/installers" className="hover:text-ws-ink">Installers</Link>
          <span className="text-ws-dark-green font-bold border-b-2 border-ws-green pb-1">Pipeline</span>
          <Link href="/admin/fees" className="hover:text-ws-ink">Fees</Link>
        </div>
      </nav>

      <div className="px-6 py-8">
        <h1 className="font-display font-extrabold text-2xl tracking-tight mb-6">Job pipeline</h1>

        <div className="grid grid-cols-4 gap-4">
          {grouped.map((col) => (
            <div key={col.label}>
              <p className="eyebrow mb-3">{col.label} · {col.count}</p>
              <div className="flex flex-col gap-2">
                {col.preview.map((enq) => (
                  <div key={enq.id} className={`border rounded-xl p-3 text-sm cursor-pointer hover:shadow-sm transition-shadow ${
                    col.done ? 'border-[#CDE6D7] bg-[#F1FAF5]' : 'border-ws-border bg-white'
                  }`}>
                    <p className="font-semibold text-sm">{(enq.products as string[]).join(' + ')} · {enq.postcode}</p>
                    <p className={`text-xs mt-1 ${col.done ? 'text-ws-dark-green' : 'text-ws-muted'}`}>{enq.reference}</p>
                  </div>
                ))}
                {col.more > 0 && (
                  <div className="border border-dashed border-ws-border rounded-xl p-3 text-xs text-ws-subtle">
                    + {col.more} more
                  </div>
                )}
                {col.count === 0 && (
                  <div className="border border-dashed border-ws-border rounded-xl p-3 text-xs text-ws-subtle">
                    None
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-col gap-2 max-w-2xl">
          <p className="text-xs text-ws-muted leading-relaxed">
            Read-only board. Click a card to see the full job.
          </p>
          <div className="border border-ws-border rounded-xl px-4 py-3 bg-white text-xs text-ws-muted leading-relaxed">
            <span className="font-semibold text-ws-ink">How matching works — </span>
            We send each brief to the 3 nearest verified installers who hold the right certifications and cover the customer&apos;s postcode district, supporting local businesses and fast turnaround.
          </div>
        </div>
      </div>
    </div>
  )
}
