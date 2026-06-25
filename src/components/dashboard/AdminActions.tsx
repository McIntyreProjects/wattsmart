'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

export function AdminActions({ installerId, compact = false }: { installerId: string; compact?: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [rejReason, setRejReason] = useState('')
  const [showReject, setShowReject] = useState(false)

  const approve = async () => {
    setLoading('approve')
    await fetch('/api/admin/approve-installer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ installerId }),
    })
    setLoading(null)
    router.refresh()
  }

  const reject = async () => {
    setLoading('reject')
    await fetch('/api/admin/reject-installer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ installerId, reason: rejReason }),
    })
    setLoading(null)
    setShowReject(false)
    router.refresh()
  }

  if (showReject) {
    return (
      <div className="flex items-center gap-2">
        <input
          value={rejReason}
          onChange={e => setRejReason(e.target.value)}
          placeholder="Reason (optional)"
          className="border border-ws-border rounded-btn px-3 py-1.5 text-xs text-ws-ink bg-white focus:outline-none focus:border-ws-green"
        />
        <Button size="sm" variant="ghost" onClick={() => reject()} loading={loading === 'reject'}>Confirm</Button>
        <button className="text-xs text-ws-muted hover:text-ws-body" onClick={() => setShowReject(false)}>Cancel</button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={approve} loading={loading === 'approve'}>
        {compact ? 'Approve' : 'Approve ✓'}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setShowReject(true)}>
        Reject
      </Button>
    </div>
  )
}
