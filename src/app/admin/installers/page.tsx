import Link from 'next/link'
import AdminNav from '@/components/ui/AdminNav'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export default async function AdminInstallersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?type=admin')

  const admin = await createAdminClient()
  const { data: { user: fullUser } } = await admin.auth.admin.getUserById(user.id)
  if (!fullUser || fullUser.app_metadata?.role !== 'admin') redirect('/auth/login?type=admin')
  const { data: installers } = await admin
    .from('installers')
    .select('id, company_name, trading_name, status, contact_name, contact_email, created_at')
    .order('created_at', { ascending: false })

  const all = installers || []
  const active = all.filter(i => i.status === 'active')
  const pending = all.filter(i => i.status === 'pending')
  const paused = all.filter(i => i.status === 'paused')

  const statusStyle = (status: string) => {
    if (status === 'active') return 'bg-[#F1FAF5] text-ws-dark-green border border-[#CDE6D7]'
    if (status === 'pending') return 'bg-amber-50 text-amber-700 border border-amber-200'
    return 'bg-[#F2F6F3] text-ws-muted border border-ws-border'
  }

  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink">
      <AdminNav active="installers" />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="font-display font-extrabold text-2xl tracking-tight mb-5">Installer management</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { label: `Active · ${active.length}` },
            { label: `Pending · ${pending.length}`, highlight: pending.length > 0 },
            { label: `Paused · ${paused.length}` },
          ].map((tab) => (
            <span key={tab.label} className={`rounded-lg px-3 py-1.5 text-sm ${
              tab.highlight ? 'border-2 border-ws-green bg-[#F1FAF5] text-ws-dark-green font-bold' : 'border border-ws-border text-ws-muted'
            }`}>{tab.label}</span>
          ))}
        </div>

        {/* All installers table */}
        <div className="border border-ws-border rounded-tile overflow-x-auto">
          <div className="grid min-w-[640px] grid-cols-[2fr_1.5fr_1.5fr_1fr_.5fr] bg-[#FAFBFA] border-b border-ws-border px-5 py-3 text-xs font-semibold text-ws-subtle uppercase tracking-wider">
            <span>Company</span><span>Contact</span><span>Email</span><span>Status</span><span></span>
          </div>
          {all.map((inst, i) => (
            <div key={inst.id} className={`grid min-w-[640px] grid-cols-[2fr_1.5fr_1.5fr_1fr_.5fr] items-center px-5 py-4 text-sm ${i < all.length - 1 ? 'border-b border-[#EDF1EE]' : ''}`}>
              <div>
                <p className="font-bold">{inst.trading_name || inst.company_name}</p>
                {inst.trading_name && inst.trading_name !== inst.company_name && (
                  <p className="text-xs text-ws-subtle mt-0.5">{inst.company_name}</p>
                )}
              </div>
              <span className="text-ws-muted">{inst.contact_name || '—'}</span>
              <span className="text-ws-muted text-xs truncate">{inst.contact_email || '—'}</span>
              <span className={`text-xs rounded-lg px-2.5 py-1 font-semibold inline-block w-fit ${statusStyle(inst.status)}`}>{inst.status}</span>
              <Link href={`/admin/installers/${inst.id}`} className="text-ws-dark-green font-semibold text-sm">View</Link>
            </div>
          ))}
          {all.length === 0 && (
            <div className="px-5 py-8 text-center text-ws-muted text-sm">No installers found.</div>
          )}
        </div>
      </div>
    </div>
  )
}
