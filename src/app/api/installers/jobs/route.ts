import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: installer } = await supabase
      .from('installers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!installer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: jobs, error } = await supabase
      .from('jobs')
      .select(`
        id, status, brief_sent_at, quote_deadline_at,
        enquiries (
          reference, products, postcode, property_type, property_age,
          monthly_elec_kwh, monthly_bill, goal,
          recommended_panels, recommended_system_kwp, recommended_battery_kwh
        ),
        quotes (
          id, total_price, deposit_amount, status
        )
      `)
      .eq('installer_id', installer.id)
      .order('brief_sent_at', { ascending: false })

    if (error) throw error

    // Strip PII from enquiries (anonymised brief)
    const anonymised = (jobs || []).map(j => ({
      ...j,
      enquiries: j.enquiries
        ? {
            reference: (j.enquiries as Record<string, unknown>).reference,
            products: (j.enquiries as Record<string, unknown>).products,
            postcode_area: ((j.enquiries as Record<string, unknown>).postcode as string)?.split(' ')[0]?.replace(/\d+$/, '') || '',
            property_type: (j.enquiries as Record<string, unknown>).property_type,
            property_age: (j.enquiries as Record<string, unknown>).property_age,
            monthly_elec_kwh: (j.enquiries as Record<string, unknown>).monthly_elec_kwh,
            monthly_bill: (j.enquiries as Record<string, unknown>).monthly_bill,
            goal: (j.enquiries as Record<string, unknown>).goal,
            recommended_panels: (j.enquiries as Record<string, unknown>).recommended_panels,
            recommended_system_kwp: (j.enquiries as Record<string, unknown>).recommended_system_kwp,
            recommended_battery_kwh: (j.enquiries as Record<string, unknown>).recommended_battery_kwh,
          }
        : null,
    }))

    return NextResponse.json(anonymised)
  } catch (err) {
    console.error('Get jobs error:', err)
    return NextResponse.json({ error: 'Failed to load jobs' }, { status: 500 })
  }
}
