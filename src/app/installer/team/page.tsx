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
  you?: boolean
}

const INITIAL_MEMBERS: TeamMember[] = [
  { id: '1', name: 'Daniel Okafor', email: 'daniel@northsidesolar.co.uk', role: 'manager', status: 'active', joinedAt: 'Jun 2026', you: true },
  { id: '2', name: 'Priya Mehta',   email: 'priya@northsidesolar.co.uk',  role: 'member',  status: 'active', joinedAt: 'Jun 2026' },
  { id: '3', name: '',              email: 'tom@northsidesolar.co.uk',     role: 'member',  status: 'pending', joinedAt: '' },
]

export default function InstallerTeamPage() {
  const userRole: Role = 'manager' // TODO: replace with real role from auth context
  const isManager = userRole === 'manager'

  const [members, setMembers] = useState<TeamMember[]>(INITIAL_MEMBERS)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('member')
  const [inviteSent, setInviteSent] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)

  const sendInvite = async () => {
    if (!inviteEmail) return
    setInviteLoading(true)
    setInviteError('')
    const res = await fetch('/api/installers/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: isManager ? inviteRole : 'member' }),
    })
    const json = await res.json()
    setInviteLoading(false)
    if (!res.ok) {
      setInviteError(json.error || 'Failed to send invite')
      return
    }
    setMembers(prev => [...prev, {
      id: Date.now().toString(),
      name: '',
      email: inviteEmail,
      role: isManager ? inviteRole : 'member',
      status: 'pending',
      joinedAt: '',
    }])
    setInviteSent(true)
    setTimeout(() => {
      setInviteSent(false)
      setShowInvite(false)
      setInviteEmail('')
      setInviteRole('member')
    }, 2000)
  }

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
          <Link href="/installer/dashboard" className="hover:text-ws-ink">Dashboard</Link>
          <Link href="/installer/profile" className="hover:text-ws-ink">Profile</Link>
          <Link href="/installer/team" className="text-ws-dark-green font-bold border-b-2 border-ws-green pb-1">Team</Link>
          <Link href="/installer/fees" className="hover:text-ws-ink">Fees</Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-display font-extrabold text-2xl tracking-tight mb-1">Team</h1>
            <p className="text-sm text-ws-muted">
              Northside Solar Co. · {members.filter(m => m.status === 'active').length} active · {members.filter(m => m.status === 'pending').length} pending
            </p>
          </div>
          <button
            onClick={() => setShowInvite(true)}
            className="bg-ws-green text-white rounded-btn px-4 py-2.5 font-bold text-sm hover:bg-ws-dark-green transition-colors"
          >
            + Invite someone
          </button>
        </div>

        {/* Role explanation — managers see both, members just see a note about their own role */}
        {isManager ? (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { role: 'Manager', desc: 'Can invite Members or Managers, change roles, remove team members, and see performance metrics.' },
              { role: 'Member',  desc: 'Can invite other Members, review quotes, submit details, and update certifications.' },
            ].map(r => (
              <div key={r.role} className="border border-ws-border rounded-tile px-4 py-3 bg-white">
                <p className="text-xs font-bold text-ws-ink mb-1">{r.role}</p>
                <p className="text-xs text-ws-muted leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#F2F6F3] border border-ws-border rounded-tile px-4 py-3 text-xs text-ws-muted mb-6 leading-relaxed">
            You can invite colleagues as <strong className="text-ws-ink">Members</strong>. Only Managers can promote someone to Manager or remove team members.
          </div>
        )}

        {/* Invite panel */}
        {showInvite && (
          <div className="border-2 border-ws-green rounded-tile p-5 mb-5 bg-white">
            <p className="font-bold text-sm mb-4">Invite a team member</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ws-muted mb-1.5">Email address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="colleague@yourcompany.co.uk"
                  className="w-full border border-ws-border rounded-btn px-3 py-2.5 text-sm focus:outline-none focus:border-ws-green"
                />
              </div>

              {/* Role picker — Managers choose, Members always invite as Member */}
              {isManager ? (
                <div>
                  <label className="block text-xs font-semibold text-ws-muted mb-1.5">Role</label>
                  <div className="flex gap-2">
                    {(['member', 'manager'] as Role[]).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setInviteRole(r)}
                        className={`flex-1 rounded-btn py-2.5 text-sm font-semibold border-2 transition-colors ${
                          inviteRole === r
                            ? 'border-ws-green bg-[#F1FAF5] text-ws-dark-green'
                            : 'border-ws-border text-ws-muted'
                        }`}
                      >
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-ws-muted mt-1.5">
                    {inviteRole === 'manager'
                      ? 'Managers can invite others, change roles, and see performance metrics.'
                      : 'Members can action quotes, submit details, and invite other Members.'}
                  </p>
                </div>
              ) : (
                <div className="bg-[#F2F6F3] rounded-btn px-3 py-2.5 text-xs text-ws-muted">
                  They will be invited as a <strong className="text-ws-ink">Member</strong>. Only a Manager can invite someone as a Manager.
                </div>
              )}

              <div className="flex gap-2 pt-1">
                {inviteSent ? (
                  <div className="flex-1 text-center py-2.5 text-sm font-bold text-ws-dark-green bg-[#F1FAF5] rounded-btn border-2 border-ws-green">
                    ✓ Invite sent
                  </div>
                ) : (
                  <>
                    {inviteError && (
                      <p className="text-xs text-[#C2603F] mb-1">{inviteError}</p>
                    )}
                    <button
                      onClick={sendInvite}
                      disabled={!inviteEmail || inviteLoading}
                      className="flex-1 bg-ws-green text-white rounded-btn py-2.5 font-bold text-sm hover:bg-ws-dark-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {inviteLoading ? 'Sending…' : 'Send invite'}
                    </button>
                    <button
                      onClick={() => { setShowInvite(false); setInviteEmail(''); setInviteRole('member') }}
                      className="border-2 border-ws-border rounded-btn px-4 py-2.5 text-sm font-semibold text-ws-muted hover:bg-ws-border transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Member list */}
        <div className="border border-ws-border rounded-tile overflow-hidden">
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
                    <p className="font-semibold text-sm truncate">
                      {m.name || <span className="text-ws-muted italic">Invite pending</span>}
                      {m.you && <span className="ml-2 text-xs text-ws-muted font-normal">(you)</span>}
                    </p>
                    <p className="text-xs text-ws-muted truncate">{m.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {m.status === 'pending' ? (
                    <span className="text-xs border border-amber-200 bg-amber-50 text-amber-700 rounded-pill px-2.5 py-1">Invite pending</span>
                  ) : m.you || !isManager ? (
                    /* Members and "you" see a static role badge — no dropdown */
                    <span className="text-xs border border-ws-border rounded-pill px-2.5 py-1 capitalize text-ws-muted">{m.role}</span>
                  ) : (
                    /* Managers see a role dropdown for everyone else */
                    <select
                      value={m.role}
                      onChange={e => changeRole(m.id, e.target.value as Role)}
                      className="text-xs border border-ws-border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-ws-green"
                    >
                      <option value="member">Member</option>
                      <option value="manager">Manager</option>
                    </select>
                  )}

                  {/* Only Managers can remove — and not themselves */}
                  {isManager && !m.you && (
                    confirmRemove === m.id ? (
                      <div className="flex gap-1.5">
                        <button onClick={() => removeMember(m.id)} className="text-xs font-semibold text-[#C2603F] hover:underline">Remove</button>
                        <span className="text-ws-subtle text-xs">·</span>
                        <button onClick={() => setConfirmRemove(null)} className="text-xs text-ws-muted hover:underline">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmRemove(m.id)} className="text-xs text-ws-muted hover:text-[#C2603F]">Remove</button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-ws-muted mt-4 leading-relaxed">
          {isManager
            ? 'Invited users will receive an email with a link to create their WattSmart account and join your workspace. You can change their role or remove them at any time.'
            : 'Invited users will receive an email with a link to create their WattSmart account and join your workspace as a Member.'}
        </p>
      </div>
    </div>
  )
}
