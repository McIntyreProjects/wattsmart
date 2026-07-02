import { redirect } from 'next/navigation'

export default async function QuoteBreakdownPage({ params }: { params: Promise<{ enquiryId: string; quoteId: string }> }) {
  const { enquiryId } = await params
  redirect(`/customer/quotes/${enquiryId}`)
}
