import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact WattSmart',
  description:
    'Get in touch with the WattSmart team about quotes, installations or anything else — we reply within 1 working day.',
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
