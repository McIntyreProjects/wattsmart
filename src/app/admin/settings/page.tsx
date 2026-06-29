import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const sections = ['Business & billing', 'Payouts', 'Notifications & digest', 'Automation', 'Team & access', 'Data & legal']

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') redirect('/auth/login?type=admin')

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
              <span
                key={s}
                className="text-left px-3 py-2.5 rounded-lg text-sm text-ws-muted"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Panel */}
        <div className="flex-1 p-8 max-w-2xl">
          <h2 className="font-display font-extrabold text-2xl tracking-tight mb-1">Settings</h2>
          <p className="text-sm text-ws-muted mb-6">Platform configuration is managed in Supabase.</p>

          <div className="border border-ws-border rounded-tile p-6 bg-white text-sm text-ws-muted">
            Configure in Supabase
          </div>
        </div>
      </div>
    </div>
  )
}
