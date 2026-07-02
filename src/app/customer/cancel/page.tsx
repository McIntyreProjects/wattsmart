import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { CancelForm } from './CancelForm'

const COOLING_OFF_DAYS = 14

export default async function CancelPage({
  searchParams,
}: {
  searchParams: Promise<{ enquiryId?: string }>
}) {
  const { enquiryId } = await searchParams
  if (!enquiryId) redirect('/customer/dashboard')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?type=customer')

  const admin = await createAdminClient()

  // Verify the logged-in customer owns this enquiry — never trust URL params
  const { data: enquiry } = await admin
    .from('enquiries')
    .select('id, customers(user_id)')
    .eq('id', enquiryId)
    .single()
  const cust = Array.isArray(enquiry?.customers) ? enquiry.customers[0] : enquiry?.customers
  const ownerId = (cust as { user_id: string } | null)?.user_id
  if (!enquiry || ownerId !== user.id) redirect('/customer/dashboard')

  // Resolve the refundable deposit payment for this enquiry server-side
  const { data: payment } = await admin
    .from('payments')
    .select('id, amount, wattsmart_fee, installer_id, status, paid_at, created_at')
    .eq('enquiry_id', enquiryId)
    .eq('type', 'deposit')
    .in('status', ['pending', 'held'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!payment) redirect('/customer/dashboard')

  // Cooling-off eligibility from the real payment date (paid_at, falling back
  // to created_at) — never from a tamperable URL parameter.
  const paidDate = new Date(payment.paid_at || payment.created_at)
  const withinCoolingOff =
    Date.now() - paidDate.getTime() <= COOLING_OFF_DAYS * 24 * 60 * 60 * 1000

  // Installer contact details for the post-cooling-off view, looked up
  // server-side (the installer is already revealed once the deposit is paid).
  let installerName = 'Your installer'
  let installerPhone: string | null = null
  let installerEmail: string | null = null
  if (!withinCoolingOff && payment.installer_id) {
    const { data: installer } = await admin
      .from('installers')
      .select('company_name, trading_name, contact_phone, contact_email')
      .eq('id', payment.installer_id)
      .single()
    if (installer) {
      installerName = installer.trading_name || installer.company_name || installerName
      installerPhone = installer.contact_phone || null
      installerEmail = installer.contact_email || null
    }
  }

  return (
    <CancelForm
      paymentId={payment.id}
      amountPence={payment.amount}
      feePence={payment.wattsmart_fee}
      withinCoolingOff={withinCoolingOff}
      installerName={installerName}
      installerPhone={installerPhone}
      installerEmail={installerEmail}
    />
  )
}
