'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'ws_cookie_consent'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) setVisible(true)
  }, [])

  function accept(choice: 'all' | 'essential') {
    localStorage.setItem(STORAGE_KEY, choice)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-ws-card border-t border-ws-border px-5 py-4"
      role="region"
      aria-label="Cookie consent"
    >
      <div className="max-w-content mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-ws-body flex-1">
          We use cookies to keep you logged in and improve our service. You can accept all cookies
          or essential ones only.{' '}
          <Link href="/privacy" className="underline text-ws-muted hover:text-ws-body">
            Privacy policy
          </Link>
        </p>
        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={() => accept('essential')}
            className="text-sm px-4 py-2 rounded-lg border border-ws-border text-ws-ink bg-transparent hover:bg-ws-border transition-colors"
          >
            Essential only
          </button>
          <button
            onClick={() => accept('all')}
            className="text-sm px-4 py-2 rounded-lg bg-ws-dark-green text-white hover:opacity-90 transition-opacity font-medium"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  )
}
