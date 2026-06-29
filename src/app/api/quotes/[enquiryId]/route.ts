import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ enquiryId: string }> }) {
  try {
    const { enquiryId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify customer owns this enquiry
    const { data: enquiry } = await supabase
      .from('enquiries')
      .select('id, reference, status, customers(user_id)')
      .eq('id', enquiryId)
      .single()

    if (!enquiry) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const custQ = Array.isArray(enquiry.customers) ? enquiry.customers[0] : enquiry.customers
    if ((custQ as { user_id: string } | null)?.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: quotes, error } = await supabase
      .from('quotes')
      .select('id, label, panel_count, system_kwp, battery_kwh, panel_brand, inverter_brand, total_price, deposit_amount, estimated_install_timeframe, additional_notes, status, submitted_at')
      .eq('enquiry_id', enquiryId)
      .eq('status', 'submitted')
      .order('label')

    if (error) throw error

    // Never return installer_id to customer at this stage
    return NextResponse.json({ enquiry, quotes })
  } catch (err) {
    console.error('Get quotes error:', err)
    return NextResponse.json({ error: 'Failed to load quotes' }, { status: 500 })
  }
}
