import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { QuoteComparison } from '@/components/dashboard/QuoteComparison'
import { Logo } from '@/components/ui/Logo'
import Link from 'next/link'

export default async function QuotesPage({ params }: { params: Promise<{ enquiryId: string }> }) {
  const { enquiryId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?type=customer`)

  return (
    <div className="min-h-screen bg-ws-bg">
      <nav className="bg-ws-card border-b border-ws-border">
        <div className="max-w-content mx-auto px-5 py-4 flex items-center gap-4">
          <Logo />
          <Link href="/customer/dashboard" className="text-sm text-ws-muted hover:text-ws-body font-medium">
            ← Dashboard
          </Link>
        </div>
      </nav>
      <main className="max-w-content mx-auto px-5 py-10">
        <QuoteComparison enquiryId={enquiryId} />
      </main>
    </div>
  )
}
