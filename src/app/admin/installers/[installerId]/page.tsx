import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export default async function AdminInstallerDetailPage({
  params,
}: {
  params: Promise<{ installerId: string }>
}) {
  const { installerId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?type=admin')

  const admin = await createAdminClient()
  const { data: { user: fullUser } } = await admin.auth.admin.getUserById(user.id)
  if (!fullUser || fullUser.app_metadata?.role !== 'admin') redirect('/auth/login?type=admin')

  const [
    { data: installer },
    { data: certs },
    { data: teamRows },
    { count: jobCount },
    { count: quoteCount },
    { count: completedCount },
  ] = await Promise.all([
    admin
      .from('installers')
      .select('id, company_name, trading_name, contact_name, contact_email, contact_phone, status, years_trading, products, coverage_postcodes, base_postcode, created_at, stripe_connect_onboarded')
      .eq('id', installerId)
      .single(),
    admin
      .from('certifications')
      .select('type, certification_number, status, expires_at')
      .eq('installer_id', installerId),
    admin
      .from('installer_users')
      .select('user_id, role, status')
      .eq('installer_id', installerId),
    admin
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('installer_id', installerId),
    admin
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('installer_id', installerId)
      .eq('status', 'submitted'),
    admin
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('installer_id', installerId)
      .eq('status', 'complete'),
  ])

  if (!installer) redirect('/admin/installers')

  // Look up emails for team members via admin auth API
  type TeamMember = {
    user_id: string
    role: string
    status: string
    email: string
    name: string
  }

  let team: TeamMember[] = []
  if (teamRows && teamRows.length > 0) {
    team = await Promise.all(
      teamRows.map(async (row) => {
        const { data } = await admin.auth.admin.getUserById(row.user_id)
        return {
          user_id: row.user_id,
          role: row.role as string,
          status: row.status as string,
          email: data?.user?.email ?? '',
          name: (data?.user?.user_metadata?.full_name as string) ?? '',
        }
      })
    )
  }

  const displayName = installer.trading_name || installer.company_name
  const basePostcode = installer.base_postcode ?? ''
  const products = (installer.products as string[] | null) ?? []
  const createdAt = new Date(installer.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })

  const statusBadge =
    installer.status === 'active'
      ? 'border-[#CDE6D7] bg-[#F1FAF5] text-ws-dark-green'
      : installer.status === 'pending'
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : 'border-ws-border bg-white text-ws-muted'

  const activeCount = team.filter(m => m.status === 'active').length
  const pendingCount = team.filter(m => m.status === 'pending').length

  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink">
      <nav className="flex items-center gap-8 px-6 py-4 bg-white border-b border-ws-border">
        <span className="font-display font-extrabold text-lg tracking-tight">WattSmart</span>
        <div className="flex gap-6 text-sm text-ws-muted">
          <Link href="/admin/dashboard" className="hover:text-ws-ink">Overview</Link>
          <Link href="/admin/customers" className="hover:text-ws-ink">Customers</Link>
          <Link href="/admin/installers" className="text-ws-dark-green font-bold border-b-2 border-ws-green pb-1">Installers</Link>
          <Link href="/admin/pipeline" className="hover:text-ws-ink">Pipeline</Link>
          <Link href="/admin/fees" className="hover:text-ws-ink">Fees</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <Link href="/admin/installers" className="text-sm text-ws-muted hover:text-ws-ink mb-4 inline-block">← Installers</Link>

        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="font-display font-extrabold text-2xl tracking-tight">{displayName}</h1>
            <p className="text-xs text-ws-muted mt-1">
              {[basePostcode, products.join(' + '), `active since ${createdAt}`].filter(Boolean).join(' · ')}
            </p>
          </div>
          <span className={`text-xs border rounded-pill px-3 py-1 font-semibold capitalize ${statusBadge}`}>
            {installer.status}
          </span>
        </div>

        {/* Overview */}
        <h2 className="font-semibold text-ws-ink mb-3 mt-2">Overview</h2>
        <div className="border border-ws-border rounded-tile p-5 bg-white text-sm mb-6 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-ws-muted mb-0.5">Contact</p>
            <p className="font-semibold">{installer.contact_name || '—'}</p>
            <p className="text-xs text-ws-muted">{installer.contact_email}</p>
            {installer.contact_phone && <p className="text-xs text-ws-muted">{installer.contact_phone}</p>}
          </div>
          <div>
            <p className="text-xs text-ws-muted mb-0.5">Trading since</p>
            <p className="font-semibold">{installer.years_trading ? `${installer.years_trading} year${installer.years_trading === 1 ? '' : 's'}` : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-ws-muted mb-0.5">Jobs</p>
            <p className="font-semibold">{jobCount ?? 0} total · {completedCount ?? 0} completed</p>
          </div>
          <div>
            <p className="text-xs text-ws-muted mb-0.5">Submitted quotes</p>
            <p className="font-semibold">{quoteCount ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-ws-muted mb-0.5">Coverage</p>
            <p className="font-semibold text-xs">{((installer.coverage_postcodes as string[] | null) ?? []).join(', ') || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-ws-muted mb-0.5">Stripe connected</p>
            <p className="font-semibold">{installer.stripe_connect_onboarded ? 'Yes' : 'No'}</p>
          </div>
        </div>

        {/* Certificates */}
        <h2 className="font-semibold text-ws-ink mb-3">Certificates</h2>
        {certs && certs.length > 0 ? (
          <div className="flex flex-col gap-3 mb-6">
            {certs.map((c) => {
              const isVerified = c.status === 'verified'
              return (
                <div
                  key={c.type}
                  className={`border rounded-tile px-4 py-3 flex justify-between items-center text-sm ${
                    isVerified ? 'border-[#CDE6D7] bg-[#F1FAF5]' : 'border-ws-border bg-white'
                  }`}
                >
                  <div>
                    <p className="font-semibold capitalize">{c.type}</p>
                    <p className="text-xs text-ws-muted font-mono mt-0.5">{c.certification_number || 'No number'}</p>
                    {c.expires_at && (
                      <p className="text-xs text-ws-muted mt-0.5">
                        Expires {new Date(c.expires_at).toLocaleDateString('en-GB')}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs font-semibold ${isVerified ? 'text-ws-dark-green' : 'text-amber-700'}`}>
                    {isVerified ? '✓ Verified' : c.status}
                  </span>
                </div>
              )
            })}
            <Link
              href={`/admin/installers/${installerId}/verify-certs`}
              className="text-sm text-ws-dark-green font-semibold hover:underline mt-1"
            >
              Re-verify certificates →
            </Link>
          </div>
        ) : (
          <div className="border border-ws-border rounded-tile px-4 py-3 bg-white text-sm text-ws-muted mb-6">
            No certificates on record.
          </div>
        )}

        {/* Team */}
        <h2 className="font-semibold text-ws-ink mb-3">Team · {team.length}</h2>
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-ws-muted">{activeCount} active · {pendingCount} invite pending</p>
            <div className="text-xs text-ws-muted bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-1.5">
              Admin view — read only
            </div>
          </div>

          {team.length > 0 ? (
            <div className="border border-ws-border rounded-tile overflow-hidden">
              {team.map((m, i) => (
                <div key={m.user_id} className={`px-5 py-4 bg-white ${i < team.length - 1 ? 'border-b border-[#EDF1EE]' : ''}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        m.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-[#EAF5EE] text-ws-dark-green'
                      }`}>
                        {m.name ? m.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2) : '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">
                          {m.name || <span className="text-ws-muted italic font-normal">Invite pending</span>}
                        </p>
                        <p className="text-xs text-ws-muted">{m.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {m.status === 'pending' ? (
                        <span className="text-xs border border-amber-200 bg-amber-50 text-amber-700 rounded-pill px-2.5 py-1">Invite pending</span>
                      ) : (
                        <span className="text-xs border border-ws-border rounded-lg px-2 py-1.5 bg-white capitalize">{m.role}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-ws-border rounded-tile px-4 py-3 bg-white text-sm text-ws-muted">
              No team members yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
