import Link from 'next/link'

export const metadata = {
  title: "How you're protected — WattSmart",
  description:
    'What protects you when you use WattSmart: certified installers, Stripe-processed payments, your 14-day cooling-off right, anonymity until you accept a quote, and what to do if something goes wrong.',
}

const sections = [
  {
    title: "Who you're dealing with",
    body: "WattSmart is a comparison and matching service — we introduce you to certified local installers and help you compare their quotes. Your installation contract is directly with the installer you choose, under their own terms. Every installer is certification-checked against the relevant registers before they can join — MCS for solar, battery and heat pump work, or OZEV authorisation for EV chargers, as applicable.",
  },
  {
    title: 'Your money',
    body: "Your deposit is paid to your installer at the time of payment, processed securely by Stripe. WattSmart never holds your funds. When you pay a deposit, a 14-day cooling-off period begins: cancel within those 14 days and you get a full refund. That's not a WattSmart perk — it's your statutory right under the Consumer Contracts Regulations 2013. After the 14 days, WattSmart's 5% fee is non-refundable.",
  },
  {
    title: 'Your data',
    body: "Installers quoting for your job see only your area (for example NE1) and your property details — never your name, address or contact details until you accept a quote and pay a deposit. If we produce a roof analysis for your property, it's shared with installers without your address.",
  },
  {
    title: 'If something goes wrong',
    body: "Your first port of call is hello@wattsmart.co.uk — we reply within one working day and will help sort things out. Issues with the installation itself are covered by your contract with the installer and the protections of their certification scheme (MCS installations come with scheme-backed guarantees). Nothing about using WattSmart affects your statutory consumer rights.",
  },
  {
    title: 'Complaints',
    body: "If you want to complain about WattSmart itself, email hello@wattsmart.co.uk with 'Complaint' in the subject line. We'll acknowledge it within one working day and tell you who's handling it and when you'll hear back.",
  },
]

export default function HowYoureProtectedPage() {
  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-ws-border bg-white">
        <Link href="/" className="font-display font-extrabold text-xl text-ws-ink tracking-tight">
          WattSmart
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-display font-extrabold text-4xl tracking-tight">How you&apos;re protected</h1>
        <p className="text-xs text-ws-subtle mt-1.5">Last updated June 2026 · plain-English summary</p>

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
          <Link href="/privacy" className="hover:text-ws-ink">Privacy policy</Link>
          <Link href="/contact" className="hover:text-ws-ink">Contact us</Link>
        </div>
      </div>
    </div>
  )
}
