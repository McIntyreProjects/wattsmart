'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'
import { createClient } from '@/lib/supabase/client'

function getStrength(pw: string) {
  if (pw.length === 0) return { label: '', color: '' }
  const hasLength = pw.length >= 8
  const hasSymbol = /[0-9!@#$%^&*]/.test(pw)
  if (hasLength && hasSymbol) return { label: 'Strong password', color: 'bg-ws-green' }
  if (hasLength || hasSymbol) return { label: 'Fair password', color: 'bg-amber-400' }
  return { label: 'Weak password', color: 'bg-ws-red-text' }
}

export default function SetNewPasswordPage() {
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const strength = getStrength(pw)
  const hasLength = pw.length >= 8
  const hasSymbol = /[0-9!@#$%^&*]/.test(pw)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error: updateError, data } = await supabase.auth.updateUser({ password: pw })
    setLoading(false)
    if (updateError) {
      setError(updateError.message || 'Failed to update password. Please try again.')
      return
    }
    // Redirect based on role
    const role = data.user?.user_metadata?.role
    if (role === 'installer') {
      router.push('/installer/dashboard')
    } else {
      router.push('/customer/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 bg-ws-bg">
      <div className="w-full max-w-[400px]">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        <div className="bg-white rounded-card border border-ws-border p-7">
          <h1 className="font-display font-extrabold text-xl tracking-tight mb-0.5">Create a new password</h1>
          <p className="text-sm text-ws-muted mb-6">Enter and confirm your new password below.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-ws-muted uppercase tracking-wide">New password</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={pw}
                  onChange={e => setPw(e.target.value)}
                  className="w-full border border-ws-border rounded-btn px-3.5 py-2.5 text-sm pr-16 focus:outline-none focus:border-ws-green"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ws-muted font-semibold"
                >
                  {show ? 'Hide' : 'Show'}
                </button>
              </div>
              {pw.length > 0 && (
                <>
                  <div className="flex gap-1 mt-2">
                    {[0,1,2].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i < (hasLength && hasSymbol ? 3 : hasLength || hasSymbol ? 2 : 1) ? strength.color : 'bg-[#E4EAE6]'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-ws-muted mt-1">{strength.label}</p>
                </>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-ws-muted uppercase tracking-wide">Confirm password</label>
              <input
                type={show ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="w-full border border-ws-border rounded-btn px-3.5 py-2.5 text-sm focus:outline-none focus:border-ws-green"
              />
            </div>

            <div className="space-y-1.5">
              <div className={`flex items-center gap-2 text-sm ${hasLength ? 'text-ws-green' : 'text-ws-muted'}`}>
                <span>{hasLength ? '✓' : '○'}</span>
                <span>At least 8 characters</span>
              </div>
              <div className={`flex items-center gap-2 text-sm ${hasSymbol ? 'text-ws-green' : 'text-ws-muted'}`}>
                <span>{hasSymbol ? '✓' : '○'}</span>
                <span>One number or symbol</span>
              </div>
            </div>

            {error && <p className="text-xs text-[#C2603F]">{error}</p>}

            <button
              type="submit"
              disabled={!hasLength || !hasSymbol || pw !== confirm || loading}
              className="bg-ws-green text-white rounded-btn py-3 font-bold text-sm hover:bg-ws-green-deep transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving…' : 'Save & sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
