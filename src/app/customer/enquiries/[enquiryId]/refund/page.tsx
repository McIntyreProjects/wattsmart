import { redirect } from 'next/navigation'

export default async function RefundDepositPage({ params }: { params: Promise<{ enquiryId: string }> }) {
  const { enquiryId } = await params
  redirect(`/customer/cancel?enquiryId=${enquiryId}`)
}
