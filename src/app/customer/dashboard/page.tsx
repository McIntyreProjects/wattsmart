import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Logo } from '@/components/ui/Logo'
import { Card } from '@/components/ui/Card'
import { Badge, ProductTag } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default async function CustomerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?type=customer')

  const { data: customer } = await supabase
    .from('customers')
    .select('id, first_name, last_name')
    .eq('user_id', user.id)
    .single()

  const { data: enquiries } = await supabase
    .from('enquiries')
    .select('id, reference, products, postcode, status, created_at, jobs(id)')
    .eq('customer_id', customer?.id || '')
    .order('created_at', { ascending: false })

  const statusBadge: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'neutral' }> = {
    quotes_requested:        { label: 'Awaiting quotes',    variant: 'neutral' },
    quotes_received:         { label: 'Quotes ready',       variant: 'info' },
    client_deciding:         { label: 'Comparing quotes',   variant: 'info' },
    installer_chosen:        { label: 'Installer chosen',   variant: 'success' },
    deposit_paid:            { label: 'Deposit paid',       variant: 'success' },
    survey_booked:           { label: 'Survey booked',      variant: 'success' },
    installation_confirmed:  { label: 'Install confirmed',  variant: 'success' },
    complete:                { label: 'Complete',            variant: 'neutral' },
    cancelled:               { label: 'Cancelled',          variant: 'neutral' },
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
        <p className="eyebrow mb-2">Your account</p>
        <h1
          className="text-3xl font-bold text-ws-ink mb-1"
          style={{ fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.02em' }}
        >
          Hello, {customer?.first_name || 'there'}.
        </h1>
        <p className="text-ws-muted mb-8">Your enquiries and quote status.</p>

        {!enquiries?.length ? (
          <div className="text-center py-16">
            <p className="text-ws-muted mb-6 text-sm">No enquiries yet. Get free quotes from certified local installers.</p>
            <Link href="/get-quotes">
              <Button size="lg">Get my free quotes →</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {enquiries.map(enq => {
              const st = statusBadge[enq.status] || { label: enq.status, variant: 'neutral' as const }
              const jobId = Array.isArray(enq.jobs) ? enq.jobs[0]?.id : (enq.jobs as { id: string } | null)?.id
              const postDepositStatuses = ['deposit_paid', 'survey_booked', 'install_scheduled', 'installation_confirmed', 'install_complete', 'complete']
              return (
                <Card key={enq.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-ws-ink text-[15px]">{enq.reference}</div>
                      <div className="text-sm text-ws-muted mt-0.5">{enq.postcode}</div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(enq.products as string[]).map(p => <ProductTag key={p} product={p} />)}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge variant={st.variant}>{st.label}</Badge>
                      {enq.status === 'quotes_received' && (
                        <div className="mt-2">
                          <Link href={`/customer/quotes/${enq.id}`} className="text-sm font-semibold text-ws-green hover:text-ws-green-deep">
                            Compare quotes →
                          </Link>
                        </div>
                      )}
                      {enq.status === 'client_deciding' && (
                        <div className="mt-2">
                          <Link href={`/customer/quotes/${enq.id}`} className="text-sm font-semibold text-ws-green hover:text-ws-green-deep">
                            Complete your payment →
                          </Link>
                        </div>
                      )}
                      {postDepositStatuses.includes(enq.status) && jobId && (
                        <div className="mt-2">
                          <Link href={`/customer/jobs/${jobId}`} className="text-sm font-semibold text-ws-green hover:text-ws-green-deep">
                            Track your job →
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
