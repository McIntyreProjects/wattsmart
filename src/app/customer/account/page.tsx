'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default function AccountPage() {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Something went wrong')
      }
      router.push('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#E7EAE7' }}>
      <nav className="bg-ws-card border-b border-ws-border">
        <div className="max-w-content mx-auto px-5 py-4 flex items-center justify-between">
          <Logo />
          <form action="/auth/signout" method="post">
            <button className="text-sm text-ws-muted hover:text-ws-body font-medium">Sign out</button>
          </form>
        </div>
      </nav>

      <main className="max-w-content mx-auto px-5 py-10">
        <p className="eyebrow mb-2">Settings</p>
        <h1
          className="text-3xl font-bold text-ws-ink mb-1"
          style={{ fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.02em' }}
        >
          Your account
        </h1>
        <p className="text-ws-muted mb-8">Manage your data and account settings.</p>

        <div className="flex flex-col gap-6 max-w-lg">
          {/* Download data */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-ws-ink mb-1">Download your data</h2>
            <p className="text-sm text-ws-muted mb-4">
              Export a copy of everything WattSmart holds about you — enquiries, quotes, payments, and more — as a JSON file.
            </p>
            <a href="/api/account/download" download>
              <Button variant="secondary" size="sm">Download my data</Button>
            </a>
          </Card>

          {/* Delete account */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-ws-ink mb-1">Delete account</h2>
            <p className="text-sm text-ws-muted mb-4">
              Permanently removes your account and cancels any active enquiries. Payment records are retained for legal compliance.
            </p>

            {error && (
              <p className="text-sm text-red-600 mb-3">{error}</p>
            )}

            {!showConfirm ? (
              <Button variant="danger" size="sm" onClick={() => setShowConfirm(true)}>
                Delete my account
              </Button>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-ws-ink">
                  Are you sure? This cannot be undone.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting…' : 'Yes, delete my account'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowConfirm(false)}
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <Link href="/customer/dashboard" className="text-sm text-ws-muted hover:text-ws-body">
            ← Back to dashboard
          </Link>
        </div>
      </main>
    </div>
  )
}
