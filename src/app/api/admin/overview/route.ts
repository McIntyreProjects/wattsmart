import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 86400000).toISOString()

    const [
      { count: activeEnquiries },
      { count: verifiedInstallers },
      { data: feesThisMonth },
      { data: pipeline },
      { data: recentEnquiries },
      { data: pendingInstallers },
      { data: expiringCerts },
      { data: overdueFees },
    ] = await Promise.all([
      supabase.from('enquiries').select('*', { count: 'exact', head: true })
        .not('status', 'in', '(complete,cancelled)'),
      supabase.from('installers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('payments').select('wattsmart_fee').eq('status', 'released').gte('released_at', startOfMonth),
      supabase.from('quotes').select('total_price').eq('status', 'submitted'),
      supabase.from('enquiries').select('id, reference, postcode, products, status, created_at')
        .order('created_at', { ascending: false }).limit(10),
      supabase.from('installers').select('id, company_name, contact_email, products, created_at').eq('status', 'pending'),
      supabase.from('certifications').select('id, installer_id, type, expires_at, installers(company_name)')
        .lte('expires_at', thirtyDaysFromNow).eq('status', 'verified'),
      supabase.from('fee_invoices').select('id, installer_id, amount, due_at, installers(company_name)').eq('status', 'overdue'),
    ])

    const totalFeesMonth = (feesThisMonth || []).reduce((s, p) => s + (p.wattsmart_fee || 0), 0)
    const pipelineValue = (pipeline || []).reduce((s, q) => s + (q.total_price || 0), 0)

    return NextResponse.json({
      metrics: {
        activeEnquiries: activeEnquiries || 0,
        verifiedInstallers: verifiedInstallers || 0,
        feesThisMonth: totalFeesMonth,
        pipelineValue,
      },
      recentEnquiries: recentEnquiries || [],
      alerts: {
        pendingInstallers: pendingInstallers || [],
        expiringCerts: expiringCerts || [],
        overdueFees: overdueFees || [],
      },
    })
  } catch (err) {
    console.error('Admin overview error:', err)
    return NextResponse.json({ error: 'Failed to load overview' }, { status: 500 })
  }
}
