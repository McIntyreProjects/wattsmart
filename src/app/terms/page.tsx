import Link from 'next/link'

export const metadata = { title: 'Terms & conditions — WattSmart' }

const sections = [
  {
    title: '1 · The service',
    body: "WattSmart introduces homeowners to certified local installers for solar, battery, heat pump and EV-charger work. It's free for homeowners; installers pay a 5% referral fee on completed jobs. These terms cover your use of the WattSmart website and service only — the contract for the installation and supply of goods is directly between you and your chosen installer, under their own terms.",
  },
  {
    title: '2 · Quotes',
    body: "We aim to provide up to three anonymous quotes, each held for 14 days. So you can always make a fair comparison, we'll give you at least two to choose from: if only one installer quotes, we hold it for you and send your enquiry to more — you're free to go ahead with the single quote if you'd rather. If none arrive, we'll match you with new installers at no cost. Quotes themselves can't be guaranteed.",
  },
  {
    title: '3 · Deposits',
    body: "Your deposit is held securely by WattSmart and is fully refundable until your installation date is confirmed. It's released to the installer only once you've approved the date.",
  },
  {
    title: '4 · Payments',
    body: "The balance is paid through Stripe and split automatically — your installer's share to them, our 5% fee at source. WattSmart does not hold the balance.",
  },
  {
    title: '5 · Installers',
    body: 'Installers are independent businesses, verified against the relevant registers (MCS, RECC, etc.). The installation contract is between you and your chosen installer.',
  },
  {
    title: '6 · Liability',
    body: "WattSmart is an introducer and payment facilitator, not the installer. Workmanship, warranties and certificates are the installer's responsibility; we'll help mediate if something goes wrong.",
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-ws-border bg-white">
        <Link href="/" className="font-display font-extrabold text-xl text-ws-ink tracking-tight">
          WattSmart
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-display font-extrabold text-4xl tracking-tight">Terms &amp; conditions</h1>
        <p className="text-xs text-ws-subtle mt-1.5">Last updated June 2026 · plain-English summary</p>

        <div className="bg-amber-50 border border-amber-200 rounded-card px-4 py-3 mt-5 text-xs text-amber-700 leading-relaxed">
          ⚠ Draft content for design — to be reviewed by a solicitor before launch.
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
          <Link href="/privacy" className="hover:text-ws-ink">Privacy policy</Link>
          <Link href="/contact" className="hover:text-ws-ink">Contact us</Link>
        </div>
      </div>
    </div>
  )
}
