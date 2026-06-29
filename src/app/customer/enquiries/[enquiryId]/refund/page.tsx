import { redirect } from 'next/navigation'

export default function RefundDepositPage({ params }: { params: { enquiryId: string } }) {
  redirect(`/customer/cancel?enquiryId=${params.enquiryId}`)
}
