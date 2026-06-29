import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center px-4 py-3.5">
      <div>
        <p className="text-xs text-ws-subtle">{label}</p>
        <p className="font-semibold text-sm mt-0.5">{value}</p>
      </div>
    </div>
  )
}

export default async function CustomerSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?type=customer')

  const { data: customer } = await supabase
    .from('customers')
    .select('first_name, last_name, phone')
    .eq('user_id', user.id)
    .single()

  const fullName = customer
    ? [customer.first_name, customer.last_name].filter(Boolean).join(' ')
    : '—'
  const phone = customer?.phone ?? '—'
  const email = user.email ?? '—'

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
        <div className="border border-ws-border rounded-tile overflow-hidden mb-6 divide-y divide-[#EDF1EE]">
          <Row label="Name" value={fullName} />
          <Row label="Email" value={email} />
          <Row label="Mobile" value={phone} />
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
        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            className="w-full border border-ws-border rounded-tile py-3.5 font-semibold text-sm text-[#3D463F] hover:bg-ws-border transition-colors"
          >
            Log out
          </button>
        </form>
      </div>
    </div>
  )
}
