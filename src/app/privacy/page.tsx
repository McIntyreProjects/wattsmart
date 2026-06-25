import Link from 'next/link'

export const metadata = { title: 'Privacy policy — WattSmart' }

const sections = [
  {
    title: 'What we collect',
    body: 'The details you give in your enquiry (property, energy use, goals), your contact details, and payment information processed securely by Stripe. We never store full card details.',
  },
  {
    title: 'How we use it',
    body: 'To match you with certified local installers, generate your system recommendation, process your deposit and balance, and keep you updated on your job.',
  },
  {
    title: 'Your anonymity',
    body: "Installers never see your name, address or contact details until you choose their quote and pay a deposit. Reviews shown to you have installer-identifying details removed.",
  },
  {
    title: 'Who we share it with',
    body: "Only your chosen installer (after deposit), and trusted processors like Stripe for payments. We never sell your data.",
  },
  {
    title: 'Your rights',
    body: 'You can access, correct, download or delete your data anytime from Account & settings, or by emailing us. We respond within statutory timeframes.',
  },
  {
    title: 'How long we keep it',
    body: "Completed accounts are automatically anonymised 12 months after installation, unless we're required to keep records for legal or tax reasons.",
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-ws-border bg-white">
        <Link href="/" className="font-display font-extrabold text-xl text-ws-ink tracking-tight">
          WattSmart
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-display font-extrabold text-4xl tracking-tight">Privacy policy</h1>
        <p className="text-xs text-ws-subtle mt-1.5">Last updated June 2026 · plain-English summary</p>

        <div className="bg-amber-50 border border-amber-200 rounded-card px-4 py-3 mt-5 text-xs text-amber-700 leading-relaxed">
          ⚠ Draft content for design — to be reviewed by a solicitor / DPO before launch.
        </div>

        <div className="flex flex-col gap-6 mt-8">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="font-display font-bold text-lg">{s.title}</h2>
              <p className="text-sm text-[#3D463F] leading-relaxed mt-1.5">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-ws-border text-xs text-ws-subtle flex gap-4">
          <Link href="/terms" className="hover:text-ws-ink">Terms & conditions</Link>
          <Link href="/contact" className="hover:text-ws-ink">Contact us</Link>
        </div>
      </div>
    </div>
  )
}
