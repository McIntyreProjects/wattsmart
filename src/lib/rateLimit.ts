type WindowEntry = { count: number; windowStart: number }

const store = new Map<string, WindowEntry>()

// Periodic cleanup: remove stale entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now - entry.windowStart > 60_000) {
      store.delete(key)
    }
  }
}, 5 * 60_000)

export function rateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const key = ip
  const entry = store.get(key)

  if (!entry || now - entry.windowStart > windowMs) {
    // Delete stale entry if present before creating a fresh one
    if (entry) store.delete(key)
    store.set(key, { count: 1, windowStart: now })
    return true // allowed
  }

  if (entry.count >= limit) {
    return false // exceeded
  }

  entry.count++
  return true // allowed
}
