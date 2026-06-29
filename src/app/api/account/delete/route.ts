import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // Fetch the customer record
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (customerError || !customer) {
    return NextResponse.json({ error: 'Customer record not found' }, { status: 404 })
  }

  // Cancel any active enquiries
  const activeStatuses = [
    'quotes_requested',
    'quotes_received',
    'client_deciding',
    'installer_chosen',
    'deposit_paid',
    'survey_booked',
    'installation_confirmed',
  ]

  await supabase
    .from('enquiries')
    .update({ status: 'cancelled' })
    .eq('customer_id', customer.id)
    .in('status', activeStatuses)

  // Soft-delete the customer record
  const { error: deleteError } = await supabase
    .from('customers')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', customer.id)

  if (deleteError) {
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }

  // Delete the Supabase auth user via admin client
  const adminClient = await createAdminClient()
  const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(user.id)

  if (authDeleteError) {
    // Roll back the soft-delete so the user can try again
    await supabase
      .from('customers')
      .update({ deleted_at: null })
      .eq('id', customer.id)
    return NextResponse.json({ error: 'Failed to delete auth account' }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
