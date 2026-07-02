'use client'
import { useState } from 'react'
import { Logo } from '@/components/ui/Logo'

export default function AcceptInvitePage() {
  const [name, setName] = useState('')
  const [pw, setPw] = useState('')
  const [agreed, setAgreed] = useState(false)

  // In production, extract email from token in URL search params
  const invitedEmail = 'ops@wattsmart.co.uk'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 bg-ws-bg">
      <div className="w-full max-w-[420px]">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <p className="text-xs text-ws-muted text-center mb-4 font-semibold uppercase tracking-wider">Team access</p>

        <div className="bg-white rounded-card border border-ws-border p-7">
          <h1 className="font-display font-extrabold text-xl tracking-tight mb-1">Accept your invite</h1>
          <p className="text-sm text-ws-muted mb-6">You've been invited to the WattSmart admin console. Set your name and password to get started.</p>

          <form className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-ws-muted uppercase tracking-wide">Email</label>
              <div className="w-full border border-ws-border rounded-btn px-3.5 py-2.5 text-sm bg-[#F2F6F3] text-ws-muted cursor-not-allowed">
                {invitedEmail}
              </div>
              <p className="text-xs text-ws-subtle mt-1">This can't be changed — it's the email your invite was sent to.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-ws-muted uppercase tracking-wide">Your name</label>
              <input
                type="text" required value={name} onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full border border-ws-border rounded-btn px-3.5 py-2.5 text-sm focus:outline-none focus:border-ws-green"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-ws-muted uppercase tracking-wide">Set a password</label>
              <input
                type="password" required value={pw} onChange={e => setPw(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full border border-ws-border rounded-btn px-3.5 py-2.5 text-sm focus:outline-none focus:border-ws-green"
              />
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 accent-ws-green" />
              <span className="text-xs text-ws-muted leading-relaxed">
                I agree to WattSmart's <a href="/terms" className="text-ws-green hover:underline">Terms of Use</a> and <a href="/privacy" className="text-ws-green hover:underline">Privacy Policy</a>.
              </span>
            </label>

            <button
              type="submit"
              disabled={!name || pw.length < 8 || !agreed}
              className="bg-ws-green text-white rounded-btn py-3 font-bold text-sm hover:bg-ws-green-deep transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Create account &amp; sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
