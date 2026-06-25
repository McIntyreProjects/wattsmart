'use client'
import { useState } from 'react'
import { Logo } from '@/components/ui/Logo'

export default function AdminRecoverPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ background: '#E7EAE7' }}>
      <div className="w-full max-w-[420px]">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>
        <p className="text-xs text-ws-muted text-center mb-4 font-semibold uppercase tracking-wider">Owner console</p>

        <div className="bg-white rounded-card border border-ws-border p-7">
          <h1 className="font-display font-extrabold text-xl tracking-tight mb-1">Owner account recovery</h1>
          <p className="text-sm text-ws-muted mb-6">Recovering the owner account takes two steps — an email link plus a time-based code from your authenticator app.</p>

          <div className="flex gap-3 mb-6">
            {[1, 2].map(s => (
              <div key={s} className={`flex-1 h-1 rounded-full ${step >= s ? 'bg-ws-green' : 'bg-[#E4EAE6]'}`} />
            ))}
          </div>

          {step === 1 && (
            <form onSubmit={e => { e.preventDefault(); setStep(2) }} className="flex flex-col gap-4">
              <p className="text-sm font-semibold">Step 1 — Send recovery email</p>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-ws-muted uppercase tracking-wide">Owner email</label>
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="hello@wattsmart.co.uk"
                  className="w-full border border-ws-border rounded-btn px-3.5 py-2.5 text-sm focus:outline-none focus:border-ws-green"
                />
              </div>
              <button type="submit" className="bg-ws-green text-white rounded-btn py-3 font-bold text-sm hover:bg-ws-green-deep transition-colors">
                Send recovery link
              </button>
            </form>
          )}

          {step === 2 && (
            <form className="flex flex-col gap-4">
              <p className="text-sm font-semibold">Step 2 — Enter your 2FA code</p>
              <p className="text-xs text-ws-muted">Link sent to {email || 'your registered email'}. Once you've clicked it, enter your authenticator code below.</p>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-ws-muted uppercase tracking-wide">6-digit code</label>
                <input
                  type="text" inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g,''))}
                  placeholder="000000"
                  className="w-full border border-ws-border rounded-btn px-3.5 py-2.5 text-sm font-mono text-center text-xl tracking-[0.4em] focus:outline-none focus:border-ws-green"
                />
              </div>
              <button
                type="submit"
                disabled={code.length < 6}
                className="bg-ws-green text-white rounded-btn py-3 font-bold text-sm hover:bg-ws-green-deep transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Verify &amp; recover
              </button>
              <button type="button" onClick={() => setStep(1)} className="text-sm text-ws-muted text-center">← Resend link</button>
            </form>
          )}

          <p className="text-xs text-ws-muted mt-5 leading-relaxed">
            🔒 Recovery requires both the email link and your 2FA code. If you've lost your authenticator, contact your backup recovery contact.
          </p>
        </div>
      </div>
    </div>
  )
}
