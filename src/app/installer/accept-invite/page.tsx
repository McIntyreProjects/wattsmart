'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function AcceptInvitePage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // In production this would read the invite token from the URL and fetch details
  const inviterName = 'Daniel Okafor'
  const companyName = 'Northside Solar Co.'
  const inviteEmail = 'colleague@northsidesolar.co.uk'

  if (submitted) {
    return (
      <div className="min-h-screen bg-ws-body font-body text-ws-ink flex items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <div className="w-14 h-14 rounded-full bg-[#EAF5EE] flex items-center justify-center mx-auto mb-5 text-2xl">✓</div>
          <h1 className="font-display font-extrabold text-2xl tracking-tight mb-2">You&apos;re in.</h1>
          <p className="text-sm text-ws-muted leading-relaxed mb-6">
            Your account is set up. You&apos;re now part of the <strong>{companyName}</strong> workspace on WattSmart.
          </p>
          <Link
            href="/installer/dashboard"
            className="inline-block bg-ws-green text-white rounded-btn px-6 py-3 font-bold text-sm hover:bg-ws-dark-green transition-colors"
          >
            Go to dashboard →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="font-display font-extrabold text-2xl tracking-tight">WattSmart</span>
        </div>

        <div className="bg-white border border-ws-border rounded-tile p-5 mb-6">
          <p className="text-xs text-ws-muted mb-1">You&apos;ve been invited by</p>
          <p className="font-bold text-sm">{inviterName}</p>
          <p className="text-xs text-ws-muted mt-0.5">to join <strong className="text-ws-ink">{companyName}</strong> on WattSmart</p>
        </div>

        <h1 className="font-display font-extrabold text-xl tracking-tight mb-1">Create your account</h1>
        <p className="text-sm text-ws-muted mb-6">Your email address is <strong className="text-ws-ink">{inviteEmail}</strong> — set a password to get started.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ws-muted mb-1.5">Your name</label>
            <input
              type="text"
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

          <button
            onClick={() => setSubmitted(true)}
            disabled={!password || password !== confirm}
            className="w-full bg-ws-green text-white rounded-btn py-3.5 font-bold text-sm hover:bg-ws-dark-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create account &amp; join {companyName} →
          </button>
        </div>

        <p className="text-xs text-ws-muted text-center mt-5 leading-relaxed">
          By creating an account you agree to the <Link href="/terms" className="underline">WattSmart terms</Link> and <Link href="/privacy" className="underline">privacy policy</Link>.
        </p>
      </div>
    </div>
  )
}
