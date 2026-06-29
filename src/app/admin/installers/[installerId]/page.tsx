'use client'
import { useState } from 'react'
import Link from 'next/link'

type Role = 'manager' | 'member'
type MemberStatus = 'active' | 'pending'

type TeamMember = {
  id: string
  name: string
  email: string
  role: Role
  status: MemberStatus
  joinedAt: string
}

const MEMBERS: TeamMember[] = [
  { id: '1', name: 'Daniel Okafor', email: 'daniel@northsidesolar.co.uk', role: 'manager', status: 'active',  joinedAt: '12 Jun 2026' },
  { id: '2', name: 'Priya Mehta',   email: 'priya@northsidesolar.co.uk',  role: 'member',  status: 'active',  joinedAt: '18 Jun 2026' },
  { id: '3', name: '',              email: 'tom@northsidesolar.co.uk',     role: 'member',  status: 'pending', joinedAt: '' },
]

type Tab = 'overview' | 'certs' | 'team'

export default function AdminInstallerDetailPage() {
  const [tab, setTab] = useState<Tab>('team')
  const [members, setMembers] = useState<TeamMember[]>(MEMBERS)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const [pendingRoleChange, setPendingRoleChange] = useState<{ id: string; role: Role } | null>(null)

  const changeRole = (id: string, role: Role) =>
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m))

  const removeMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id))
    setConfirmRemove(null)
  }

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
            <h1 className="font-display font-extrabold text-2xl tracking-tight">Northside Solar Co.</h1>
            <p className="text-xs text-ws-muted mt-1">Durham · solar + battery · active since Jun 2026</p>
          </div>
          <span className="text-xs border border-[#CDE6D7] bg-[#F1FAF5] text-ws-dark-green rounded-pill px-3 py-1 font-semibold">Active</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {([
            { id: 'overview', label: 'Overview' },
            { id: 'certs',    label: 'Certificates' },
            { id: 'team',     label: `Team · ${MEMBERS.length}` },
          ] as { id: Tab; label: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                tab === t.id
                  ? 'border-2 border-ws-green bg-[#F1FAF5] text-ws-dark-green font-bold'
                  : 'border border-ws-border text-ws-muted hover:text-ws-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="border border-ws-border rounded-tile p-5 bg-white text-sm text-ws-muted">
            Overview content — jobs, fees, performance summary.
          </div>
        )}

        {tab === 'certs' && (
          <div className="flex flex-col gap-3">
            {[
              { label: 'MCS', number: 'NAP-1100-2284', status: 'verified' },
              { label: 'RECC', number: 'RECC-00821', status: 'verified' },
              { label: 'Companies House', number: '08842210', status: 'verified' },
              { label: 'Public liability', number: 'Via upload', status: 'verified' },
            ].map(c => (
              <div key={c.label} className="border border-[#CDE6D7] bg-[#F1FAF5] rounded-tile px-4 py-3 flex justify-between items-center text-sm">
                <div>
                  <p className="font-semibold">{c.label}</p>
                  <p className="text-xs text-ws-muted font-mono mt-0.5">{c.number}</p>
                </div>
                <span className="text-xs font-semibold text-ws-dark-green">✓ Verified</span>
              </div>
            ))}
            <Link
              href="/admin/installers/greenfield/verify-certs"
              className="text-sm text-ws-dark-green font-semibold hover:underline mt-1"
            >
              Re-verify certificates →
            </Link>
          </div>
        )}

        {tab === 'team' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-ws-muted">{members.filter(m => m.status === 'active').length} active · {members.filter(m => m.status === 'pending').length} invite pending</p>
              <div className="text-xs text-ws-muted bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-1.5">
                Admin view — changes take effect immediately
              </div>
            </div>

            <div className="border border-ws-border rounded-tile overflow-hidden mb-4">
              {members.map((m, i) => (
                <div key={m.id} className={`px-5 py-4 bg-white ${i < members.length - 1 ? 'border-b border-[#EDF1EE]' : ''}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        m.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-[#EAF5EE] text-ws-dark-green'
                      }`}>
                        {m.name ? m.name.split(' ').map(n => n[0]).join('').slice(0, 2) : '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">
                          {m.name || <span className="text-ws-muted italic font-normal">Invite pending</span>}
                        </p>
                        <p className="text-xs text-ws-muted">{m.email}</p>
                        {m.joinedAt && <p className="text-xs text-ws-subtle">Joined {m.joinedAt}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {m.status === 'pending' ? (
                        <span className="text-xs border border-amber-200 bg-amber-50 text-amber-700 rounded-pill px-2.5 py-1">Invite pending</span>
                      ) : pendingRoleChange?.id === m.id ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-ws-muted">Change {m.name || 'this user'} to {pendingRoleChange.role === 'manager' ? 'Manager' : 'Member'}?</span>
                          <button
                            onClick={() => { changeRole(m.id, pendingRoleChange.role); setPendingRoleChange(null) }}
                            className="font-semibold text-ws-dark-green hover:underline"
                          >
                            Confirm
                          </button>
                          <span className="text-ws-subtle">·</span>
                          <button
                            onClick={() => setPendingRoleChange(null)}
                            className="text-ws-muted hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <select
                          value={m.role}
                          onChange={e => setPendingRoleChange({ id: m.id, role: e.target.value as Role })}
                          className="text-xs border border-ws-border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-ws-green"
                        >
                          <option value="member">Member</option>
                          <option value="manager">Manager</option>
                        </select>
                      )}

                      {confirmRemove === m.id ? (
                        <div className="flex gap-1.5">
                          <button onClick={() => removeMember(m.id)} className="text-xs font-semibold text-[#C2603F] hover:underline">Confirm remove</button>
                          <span className="text-ws-subtle text-xs">·</span>
                          <button onClick={() => setConfirmRemove(null)} className="text-xs text-ws-muted hover:underline">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmRemove(m.id)} className="text-xs text-ws-muted hover:text-[#C2603F]">Remove</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-ws-muted leading-relaxed">
              Removing a user immediately revokes their access to this installer&apos;s workspace. The installer&apos;s manager will be notified by email.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
