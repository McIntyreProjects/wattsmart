import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none'

    const variants = {
      primary:   'bg-ws-green text-white hover:bg-ws-green-deep rounded-btn',
      secondary: 'bg-white border border-ws-border text-ws-ink hover:border-ws-green hover:text-ws-green rounded-btn',
      ghost:     'bg-transparent text-ws-muted hover:text-ws-body rounded-btn',
      danger:    'bg-ws-red-bg text-ws-red-text hover:bg-red-100 rounded-btn border border-red-200',
    }

    const sizes = {
      sm: 'px-4 py-2 text-sm gap-1.5',
      md: 'px-6 py-3 text-[15px] gap-2',
      lg: 'px-8 py-3.5 text-base gap-2',
    }

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {children}
          </span>
        ) : children}
      </button>
    )
  }
)
Button.displayName = 'Button'
