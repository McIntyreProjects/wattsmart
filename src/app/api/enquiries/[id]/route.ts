import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: enquiry, error } = await supabase
      .from('enquiries')
      .select(`
        id, reference, products, postcode, property_type, property_age, goal,
        recommended_panels, recommended_system_kwp, recommended_battery_kwh,
        status, created_at,
        customers (user_id)
      `)
      .eq('id', id)
      .single()

    if (error || !enquiry) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if ((enquiry.customers as { user_id: string })?.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(enquiry)
  } catch (err) {
    console.error('Get enquiry error:', err)
    return NextResponse.json({ error: 'Failed to load enquiry' }, { status: 500 })
  }
}
