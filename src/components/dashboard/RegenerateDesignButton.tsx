'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Admin-only: retrigger roof-design generation for an enquiry whose design
// failed or was unavailable. /api/internal/generate-design authorises admins
// via app_metadata.role (its established fallback path).
export function RegenerateDesignButton({ enquiryId }: { enquiryId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/internal/generate-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enquiryId }),
      })
      if (!res.ok) throw new Error('regenerate_failed')
      router.refresh()
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="text-xs font-semibold text-ws-green-deep underline underline-offset-2 hover:no-underline disabled:opacity-50 disabled:cursor-wait"
    >
      {loading ? 'Regenerating…' : error ? 'Failed — retry' : 'Regenerate'}
    </button>
  )
}
