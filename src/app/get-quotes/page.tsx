import { SmartForm } from '@/components/forms/SmartForm'
import { Logo } from '@/components/ui/Logo'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Get Free Solar & Heat Pump Quotes — WattSmart',
  description:
    'Get up to 3 free quotes for solar panels, battery storage, heat pumps and EV chargers from certified local installers in North East England & Yorkshire. Anonymous, no cold calls, no obligation.',
}

export default function GetQuotesPage() {
  return (
    <div className="min-h-screen bg-ws-bg">
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
