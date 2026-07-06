'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

type CheckResult = {
  verified?: boolean
  reason?: string
  source?: string
  testMode?: boolean
  error?: string
}

/**
 * Runs the automated register check for a certification via the admin-only
 * /api/installers/verify-cert route. The route decides the outcome: it marks
 * the cert `verified` when the register confirms it, or `failed` when it
 * cannot be confirmed — there is no manual override endpoint, so any final
 * decision after a manual register lookup is recorded by re-running the check.
 */
export function CertCheckActions({
  certId,
  type,
  number,
}: {
  certId: string
  type: string
  number: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CheckResult | null>(null)

  const runCheck = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/installers/verify-cert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certId, type, number }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setResult({ error: data?.error || 'Check failed — try again' })
      } else {
        setResult(data as CheckResult)
      }
    } catch {
      setResult({ error: 'Check failed — try again' })
    }
    setLoading(false)
    router.refresh()
  }

  return (
    <div>
      <Button size="sm" onClick={runCheck} loading={loading}>
        Run register check
      </Button>
      {result && (
        <p
          className={`text-xs mt-2 leading-relaxed ${
            result.error
              ? 'text-ws-red-text'
              : result.verified
              ? 'text-ws-dark-green font-semibold'
              : 'text-ws-amber-text'
          }`}
        >
          {result.error
            ? result.error
            : result.verified
            ? `✓ Verified against register${result.testMode ? ' (test mode)' : ''}`
            : `✗ Not verified — ${result.reason || 'not found on register'}. Marked as failed; check manually via the link above and re-run once resolved.`}
        </p>
      )}
    </div>
  )
}
