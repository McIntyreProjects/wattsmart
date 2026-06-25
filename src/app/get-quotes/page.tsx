import { SmartForm } from '@/components/forms/SmartForm'
import { Logo } from '@/components/ui/Logo'
import Link from 'next/link'

export default function GetQuotesPage() {
  return (
    <div className="min-h-screen" style={{ background: '#E7EAE7' }}>
      <nav className="max-w-content mx-auto px-5 py-5 flex items-center justify-between">
        <Logo />
        <Link href="/auth/login?type=installer" className="text-sm text-ws-muted hover:text-ws-body font-medium">
          Installer portal
        </Link>
      </nav>
      <main className="max-w-content mx-auto px-5 pb-24">
        <SmartForm />
      </main>
    </div>
  )
}
