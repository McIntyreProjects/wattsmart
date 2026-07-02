'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    // Fire the reset email — always show the same "check your email" state to avoid account enumeration
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: process.env.NEXT_PUBLIC_SITE_URL + '/auth/reset/new',
    })
    setSent(true)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 bg-ws-bg">
      <div className="w-full max-w-[400px]">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        {sent ? (
          <div className="bg-white rounded-card border border-ws-border p-7 text-center">
            <div className="w-12 h-12 rounded-full bg-[#EAF5EE] flex items-center justify-center mx-auto mb-4">
              <span className="text-ws-green text-xl">✉</span>
            </div>
            <h2 className="font-display font-extrabold text-xl tracking-tight mb-2">Check your email</h2>
            <p className="text-sm text-ws-muted leading-relaxed mb-5">
              If an account exists for that email, we've sent a secure reset link. Check your spam folder if it doesn't arrive within a few minutes.
            </p>
            <Link href="/auth/login" className="text-sm font-semibold text-ws-green">
              ← Back to log in
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-card border border-ws-border p-7">
            <div className="text-2xl mb-3 text-center">✉</div>
            <h1 className="font-display font-extrabold text-xl tracking-tight text-center mb-1">Reset your password</h1>
            <p className="text-sm text-ws-muted text-center mb-6">Enter your email and we'll send a secure link to set a new one.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-ws-muted uppercase tracking-wide">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="sarah.m@email.com"
                  className="w-full border border-ws-border rounded-btn px-3.5 py-2.5 text-sm focus:outline-none focus:border-ws-green"
                />
              </div>
              <button
                type="submit"
                className="bg-ws-green text-white rounded-btn py-3 font-bold text-sm hover:bg-ws-green-deep transition-colors"
              >
                Send reset link
              </button>
            </form>

            <div className="text-center mt-5">
              <Link href="/auth/login" className="text-sm text-ws-muted hover:text-ws-body">← Back to log in</Link>
            </div>
            <p className="text-xs text-ws-muted mt-4 text-center">
              🔒 Links expire in 30 minutes. We'll never ask for your password by email or message.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
