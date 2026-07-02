import { redirect } from 'next/navigation'

export default async function OneQuotePage({ params }: { params: Promise<{ enquiryId: string }> }) {
  const { enquiryId } = await params
  redirect(`/customer/quotes/${enquiryId}`)
}
