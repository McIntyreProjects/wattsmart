import Link from 'next/link'
import Image from 'next/image'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { Stars } from '@/components/ui/Stars'

const SERVICE_REVIEWS = [
  {
    stars: 5,
    source: 'Google',
    text: 'Three solid quotes in two days and not one pushy phone call. Genuinely easy.',
    name: 'Priya',
    location: 'Leeds',
  },
  {
    stars: 5,
    source: 'Trustpilot',
    text: "I felt in control the whole way. Comparing without the sales pressure was brilliant.",
    name: 'Mark',
    location: 'Durham',
  },
  {
    stars: 5,
    source: 'Google',
    text: 'WattSmart holding the deposit made me feel safe paying someone new.',
    name: 'Abi',
    location: 'York',
  },
]

const PRODUCTS = [
  { id: 'solar',    label: 'Solar panels',    sub: 'Make your own power' },
  { id: 'battery',  label: 'Battery storage', sub: 'Store it for later' },
  { id: 'heatpump', label: 'Heat pumps',      sub: 'Up to £7,500 grant*' },
  { id: 'ev',       label: 'EV chargers',     sub: 'Charge overnight' },
]

const HOW_IT_WORKS = [
  { n: '1', title: 'Tell us about your home',        body: 'A few quick questions — products, property, energy use.' },
  { n: '2', title: 'Get up to 3 anonymous quotes',   body: 'We ask three certified local installers to quote. You compare them side by side — names hidden.' },
  { n: '3', title: 'Choose & pay securely',           body: 'Pick your favourite. Pay a refundable deposit — we hold it until your date\'s confirmed.' },
  { n: '4', title: 'Meet your installer',             body: 'They call within one working day to book your survey.' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: '#E7EAE7' }}>
      {/* Nav */}
      <nav className="max-w-content mx-auto px-5 py-5 flex items-center justify-between">
        <Logo />
        <Link
          href="/auth/login?type=installer"
          className="text-sm text-ws-muted hover:text-ws-body font-medium transition-colors"
        >
          Installer portal
        </Link>
      </nav>

      {/* Hero */}
      <main className="max-w-content mx-auto px-5">
        <section className="pt-10 pb-12">
          <p className="eyebrow mb-4">Free · no spam · no pressure</p>
          <h1
            className="text-[38px] leading-[1.03] font-bold text-ws-ink mb-4"
            style={{ fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.02em' }}
          >
            Green-energy quotes without the 20 phone calls.
          </h1>
          <p className="text-[17px] text-ws-body leading-relaxed mb-8">
            We send your enquiry to three certified local installers to quote. They never get
            your name or number unless you accept their quote.
          </p>
          <Link href="/get-quotes">
            <Button size="lg" className="w-full sm:w-auto">
              Get quotes from 3 installers →
            </Button>
          </Link>
          <p className="text-sm text-ws-muted mt-3">Free, no obligation · about 3 minutes</p>

          {/* Trust bar */}
          <div className="flex gap-6 mt-10">
            {[
              { label: 'Certified', sub: 'every installer' },
              { label: 'Free to use', sub: 'getting quotes costs nothing' },
              { label: 'Private',   sub: 'no cold calls' },
            ].map(t => (
              <div key={t.label}>
                <div className="text-sm font-semibold text-ws-ink">{t.label}</div>
                <div className="text-xs text-ws-muted">{t.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="py-10 border-t border-ws-border">
          <h2
            className="text-2xl font-bold text-ws-ink mb-6"
            style={{ fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.02em' }}
          >
            How it works
          </h2>
          <ol className="space-y-5">
            {HOW_IT_WORKS.map(step => (
              <li key={step.n} className="flex gap-4">
                <span
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5"
                  style={{ background: '#15A05A' }}
                >
                  {step.n}
                </span>
                <div>
                  <div className="font-semibold text-ws-ink text-[15px]">{step.title}</div>
                  <div className="text-sm text-ws-muted mt-0.5 leading-relaxed">{step.body}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* What we cover */}
        <section className="py-10 border-t border-ws-border">
          <h2
            className="text-2xl font-bold text-ws-ink mb-6"
            style={{ fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.02em' }}
          >
            What we cover
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {PRODUCTS.map(p => (
              <div
                key={p.id}
                className="bg-ws-card rounded-tile border border-ws-border p-4"
              >
                <span className={`tag-${p.id} inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-semibold mb-2`}>
                  {p.label}
                </span>
                <p className="text-sm text-ws-muted leading-snug">{p.sub}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-ws-muted mt-3">
            *Boiler Upgrade Scheme grant — subject to eligibility. We&apos;ll check yours in the form.
          </p>
        </section>

        {/* Reviews of WattSmart service */}
        <section className="py-10 border-t border-ws-border">
          <p className="text-sm text-ws-muted mb-1">What homeowners say about us</p>
          <div className="flex items-center gap-4 mb-1">
            <span className="font-semibold text-ws-ink text-sm">Google 4.9</span>
            <span className="font-semibold text-ws-ink text-sm">Trustpilot 4.7</span>
          </div>
          <p className="text-xs text-ws-muted mb-6">
            Reviews of the WattSmart service — your installer&apos;s own reviews come later, anonymised.
          </p>
          <div className="space-y-3">
            {SERVICE_REVIEWS.map((r, i) => (
              <div key={i} className="bg-ws-card rounded-card border border-ws-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <Stars rating={r.stars} size={13} />
                  <span className="text-xs text-ws-muted">{r.source}</span>
                </div>
                <p className="text-sm text-ws-body leading-relaxed">&ldquo;{r.text}&rdquo;</p>
                <p className="text-xs text-ws-muted mt-2">{r.name} · {r.location}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-10 border-t border-ws-border text-center">
          <h2
            className="text-2xl font-bold text-ws-ink mb-2"
            style={{ fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.02em' }}
          >
            Ready for quotes you can trust?
          </h2>
          <p className="text-ws-muted text-sm mb-6">Free, anonymous, no obligation.</p>
          <Link href="/get-quotes">
            <Button size="lg" className="w-full sm:w-auto">
              Get quotes from 3 installers →
            </Button>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-ws-border mt-4 py-8">
        <div className="max-w-content mx-auto px-5 flex flex-wrap items-center justify-between gap-4 text-sm text-ws-muted">
          <Logo />
          <nav className="flex flex-wrap gap-4">
            <span>How it works</span>
            <Link href="/contact"       className="hover:text-ws-body transition-colors">Contact us</Link>
            <Link href="/privacy"       className="hover:text-ws-body transition-colors">Privacy policy</Link>
            <Link href="/terms"         className="hover:text-ws-body transition-colors">Terms & conditions</Link>
            <Link href="/auth/login?type=installer" className="hover:text-ws-body transition-colors">Installer portal</Link>
          </nav>
          <span>© 2026 · wattsmart.co.uk</span>
        </div>
      </footer>
    </div>
  )
}
