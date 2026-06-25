'use client'

export function ProgressBar({ steps, current }: { steps: number; current: number }) {
  return (
    <div className="flex gap-1.5 mb-8" role="progressbar" aria-valuenow={current + 1} aria-valuemax={steps}>
      {Array.from({ length: steps }).map((_, i) => (
        <div
          key={i}
          className="flex-1 h-1 rounded-full transition-all duration-300"
          style={{
            background:
              i < current
                ? '#15A05A'
                : i === current
                ? '#0E7A43'
                : '#E4EAE6',
          }}
        />
      ))}
    </div>
  )
}
