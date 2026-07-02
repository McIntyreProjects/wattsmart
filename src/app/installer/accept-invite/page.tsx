'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

type InviteDetails = {
  email: string
  role: string
  companyName: string
}

function AcceptInviteContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [invite, setInvite] = useState<InviteDetails | null>(null)
  const [tokenError, setTokenError] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!token) { setTokenError('No invite link found.'); return }
    fetch(`/api/installers/accept-invite?token=${token}`)
      .then(r => r.json())
      .then(json => {
        if (json.error) setTokenError(json.error)
        else setInvite(json)
      })
      .catch(() => setTokenError('Could not load invite details.'))
  }, [token])

  const submit = async () => {
    if (!name || !password || password !== confirm) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/installers/accept-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, name, password }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) setError(json.error || 'Something went wrong')
    else setSubmitted(true)
  }

  if (tokenError) {
    return (
      <div className="min-h-screen bg-ws-body font-body text-ws-ink flex items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <p className="font-display font-extrabold text-xl tracking-tight mb-2">Invalid invite</p>
          <p className="text-sm text-ws-muted leading-relaxed mb-5">{tokenError} Invite links expire after 7 days.</p>
          <Link href="/" className="text-sm text-ws-dark-green font-semibold hover:underline">Go to WattSmart →</Link>
        </div>
      </div>
    )
  }

  if (!invite) {
    return (
      <div className="min-h-screen bg-ws-body font-body text-ws-ink flex items-center justify-center px-6">
        <p className="text-sm text-ws-muted">Loading invite…</p>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-ws-body font-body text-ws-ink flex items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <div className="w-14 h-14 rounded-full bg-[#EAF5EE] flex items-center justify-center mx-auto mb-5 text-2xl">✓</div>
          <h1 className="font-display font-extrabold text-2xl tracking-tight mb-2">You&apos;re in.</h1>
          <p className="text-sm text-ws-muted leading-relaxed mb-6">
            Your account is set up. You&apos;re now part of the <strong>{invite.companyName}</strong> workspace on WattSmart.
          </p>
          <Link
            href="/auth/login?type=installer"
            className="inline-block bg-ws-green text-white rounded-btn px-6 py-3 font-bold text-sm hover:bg-ws-dark-green transition-colors"
          >
            Sign in to your account →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="bg-white border border-ws-border rounded-tile p-5 mb-6">
          <p className="text-xs text-ws-muted mb-1">You&apos;ve been invited to join</p>
          <p className="font-bold text-sm">{invite.companyName}</p>
          <p className="text-xs text-ws-muted mt-0.5">
            as a <strong className="text-ws-ink capitalize">{invite.role}</strong> on WattSmart
          </p>
        </div>

        <h1 className="font-display font-extrabold text-xl tracking-tight mb-1">Create your account</h1>
        <p className="text-sm text-ws-muted mb-6">
          Your email is <strong className="text-ws-ink">{invite.email}</strong> — set a password to get started.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ws-muted mb-1.5">Your name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="First and last name"
              className="w-full border border-ws-border rounded-btn px-4 py-3 text-sm focus:outline-none focus:border-ws-green bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ws-muted mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-ws-border rounded-btn px-4 py-3 text-sm focus:outline-none focus:border-ws-green bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ws-muted mb-1.5">Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full border border-ws-border rounded-btn px-4 py-3 text-sm focus:outline-none focus:border-ws-green bg-white"
            />
            {password && confirm && password !== confirm && (
              <p className="text-xs text-[#C2603F] mt-1.5">Passwords don&apos;t match.</p>
            )}
          </div>

          {error && <p className="text-xs text-[#C2603F]">{error}</p>}

          <button
            onClick={submit}
            disabled={!name || !password || password !== confirm || loading}
            className="w-full bg-ws-green text-white rounded-btn py-3.5 font-bold text-sm hover:bg-ws-dark-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account…' : `Create account & join ${invite.companyName} →`}
          </button>
        </div>

        <p className="text-xs text-ws-muted text-center mt-5 leading-relaxed">
          By creating an account you agree to the{' '}
          <Link href="/terms" className="underline">WattSmart terms</Link> and{' '}
          <Link href="/privacy" className="underline">privacy policy</Link>.
        </p>
      </div>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-ws-body font-body text-ws-ink flex items-center justify-center px-6">
        <p className="text-sm text-ws-muted">Loading…</p>
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  )
}
