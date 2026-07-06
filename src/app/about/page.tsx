import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

export const metadata = {
  title: 'About WattSmart — why we exist',
  description:
    'WattSmart was built by its founder after a frustrating experience getting home energy quotes. A local service for the North East & Yorkshire: compare quotes from certified installers anonymously — WattSmart will never cold call you.',
}

const sections = [
  {
    title: 'The frustration',
    body: "WattSmart started as a frustration, not a business plan. When founder Steven kitted out his own home — solar panels, a storage battery, an air source heat pump and an EV charger — getting quotes meant handing his details to comparison sites, then fielding weeks of follow-up calls and emails from companies chasing a signature rather than answering his questions.",
  },
  {
    title: 'The idea',
    body: "WattSmart is built to be the opposite. Tell us about your home once. We ask up to 3 certified local installers to quote. You compare quotes side by side — anonymously. No installer gets your name or number unless you accept their quote — so the only call you'll ever get is from the one installer you chose, arranging the survey you asked for.",
  },
  {
    title: 'Local, not a call centre',
    body: "Steven is from Gateshead and lives in Darlington — right in the middle of the North East and Yorkshire region WattSmart serves. This isn't a national lead-generation machine; it's a local service built by someone who's been on the customer's side of the process.",
  },
]

const commitments = [
  'WattSmart will never cold call you, and never pressure you to buy.',
  'Your contact details go to one installer only — the one whose quote you accept.',
  'Every installer certification-checked.',
  'Free for homeowners.',
  'Your legal rights always intact.',
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-ws-bg font-body text-ws-ink">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-ws-border bg-white">
        <Logo />
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-display font-extrabold text-4xl tracking-tight">Why WattSmart exists</h1>

        <div className="flex flex-col gap-6 mt-8">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="font-display font-bold text-lg">{s.title}</h2>
              <p className="text-sm text-[#3D463F] leading-relaxed mt-1.5">{s.body}</p>
            </div>
          ))}

          <div>
            <h2 className="font-display font-bold text-lg">What we promise</h2>
            <ul className="flex flex-col gap-1.5 mt-1.5">
              {commitments.map((c) => (
                <li key={c} className="text-sm text-[#3D463F] leading-relaxed">
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8">
          <Link href="/get-quotes" className="text-sm font-bold text-ws-dark-green hover:underline">
            Get your quotes →
          </Link>
        </div>

        <div className="mt-10 pt-6 border-t border-ws-border text-xs text-ws-subtle flex gap-4">
          <Link href="/how-youre-protected" className="hover:text-ws-ink">How you&apos;re protected</Link>
          <Link href="/privacy" className="hover:text-ws-ink">Privacy policy</Link>
          <Link href="/contact" className="hover:text-ws-ink">Contact us</Link>
        </div>
      </div>
    </div>
  )
}
