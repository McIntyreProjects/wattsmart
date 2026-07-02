'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'

function LoginForm() {
  const params = useSearchParams()
  const router = useRouter()
  const type = params.get('type') || 'customer'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicSent, setMagicSent] = useState(false)

  const labels: Record<string, string> = {
    customer: 'your account',
    installer: 'installer portal',
    admin: 'admin panel',
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()

    if (type === 'customer' && process.env.NODE_ENV !== 'development') {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?type=customer` },
      })
      if (error) setError(error.message)
      else setMagicSent(true)
    } else if (type === 'customer') {
      // Dev mode: use password login so automated tests can sign in
      const { error, data } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else router.push('/customer/dashboard')
    } else {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        const role = data.user?.user_metadata?.role
        if (type === 'admin' && role !== 'admin') {
          await supabase.auth.signOut()
          setError('You do not have admin access.')
        } else {
          router.push(type === 'admin' ? '/admin/dashboard' : '/installer/dashboard')
        }
      }
    }
    setLoading(false)
  }

  if (magicSent) {
    return (
      <div className="text-center py-4">
        <div
          className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-5"
          style={{ background: '#EAF5EE' }}
        >
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              stroke="#15A05A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2
          className="text-xl font-bold text-ws-ink mb-2 font-display tracking-tight"
        >
          Check your email
        </h2>
        <p className="text-sm text-ws-muted leading-relaxed">
          We&apos;ve sent a login link to <strong className="text-ws-ink">{email}</strong>.
          Click it to sign in — no password needed.
        </p>
      </div>
    )
  }

  return (
    <>
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="mb-6 text-center">
          <h1
            className="text-2xl font-bold text-ws-ink mb-1 font-display tracking-tight"
          >
            Sign in to {labels[type]}
          </h1>
          {type === 'customer' && (
            <p className="text-sm text-ws-muted">We&apos;ll email you a secure link — no password needed.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-ws-ink mb-1.5">Email address</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full border border-ws-border rounded-btn px-4 py-3 text-sm text-ws-ink placeholder:text-ws-muted focus:outline-none focus:border-ws-green bg-white"
          />
        </div>

        {(type !== 'customer' || process.env.NODE_ENV === 'development') && (
          <div>
            <label className="block text-sm font-semibold text-ws-ink mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-ws-border rounded-btn px-4 py-3 text-sm text-ws-ink focus:outline-none focus:border-ws-green bg-white"
            />
          </div>
        )}

        {error && <p className="text-ws-red-text text-sm">{error}</p>}

        <Button type="submit" loading={loading} className="w-full">
          {type === 'customer' && process.env.NODE_ENV !== 'development' ? 'Send login link →' : 'Sign in →'}
        </Button>
      </form>

      {type === 'installer' && (
        <p className="text-sm text-center text-ws-muted mt-5">
          New installer?{' '}
          <Link href="/installer/register" className="text-ws-green font-semibold hover:text-ws-green-deep">
            Apply to join →
          </Link>
        </p>
      )}
    </>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-ws-bg">
      <nav className="max-w-content mx-auto px-5 py-5 w-full">
        <Logo />
      </nav>
      <div className="flex-1 flex items-center justify-center px-5 pb-12">
        <div className="w-full max-w-sm bg-ws-card rounded-card border border-ws-border p-8">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
