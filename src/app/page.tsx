import Link from 'next/link'
import Image from 'next/image'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'

export const metadata = {
  title: 'WattSmart — Solar panels, battery storage & heat pump quotes',
  description: 'Get free quotes from up to 3 certified local installers. No cold calls, no obligation.',
}


const PRODUCTS = [
  { id: 'solar',    label: 'Solar panels',    sub: 'Make your own power' },
  { id: 'battery',  label: 'Battery storage', sub: 'Store it for later' },
  { id: 'heatpump', label: 'Heat pumps',      sub: 'Up to £7,500 grant*' },
  { id: 'ev',       label: 'EV chargers',     sub: 'Charge overnight' },
]

const HOW_IT_WORKS = [
  { n: '1', title: 'Tell us about your home',        body: 'A few quick questions — products, property, energy use.' },
  { n: '2', title: 'Get up to 3 anonymous quotes',   body: 'We ask up to 3 certified local installers to quote. You compare them side by side — names hidden.' },
  { n: '3', title: 'Choose & pay securely',           body: 'Pick your preferred quote. Pay your deposit securely through WattSmart — change your mind within 14 days and you get a full refund, your legal right under UK consumer law.' },
  { n: '4', title: 'Meet your installer',             body: 'They call within three working days to book your survey.' },
]

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'WattSmart',
      url: 'https://wattsmart.co.uk',
      logo: 'https://wattsmart.co.uk/logo.png',
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'hello@wattsmart.co.uk',
        contactType: 'customer service',
        availableLanguage: 'English',
      },
    },
    {
      '@type': 'Service',
      name: 'Solar, battery, heat pump and EV charger installation quotes',
      description:
        'Free, anonymous quotes from up to 3 certified local installers for solar panels, battery storage, heat pumps and EV chargers.',
      provider: { '@type': 'Organization', name: 'WattSmart', url: 'https://wattsmart.co.uk' },
      serviceType: 'Renewable energy installation quotes',
      areaServed: ['North East England', 'Yorkshire'],
    },
  ],
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-ws-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
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
        <section className="pt-10 pb-12 text-center">
          <p className="eyebrow mb-4">Free · no spam · no pressure</p>
          <h1
            className="text-[38px] leading-[1.03] font-bold text-ws-ink mb-4 font-display tracking-tight"
          >
            Green-energy quotes without the 20 phone calls.
          </h1>
          <p className="text-[17px] text-ws-body leading-relaxed mb-8">
            We send your enquiry to up to 3 certified local installers to quote. They never get
            your name or number unless you accept their quote.
          </p>
          <Link href="/get-quotes">
            <Button size="lg" className="w-full sm:w-auto">
              Get up to 3 quotes →
            </Button>
          </Link>
          <p className="text-sm text-ws-muted mt-3">Free, no obligation · about 3 minutes</p>

          {/* Trust bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-10 text-left">
            {[
              { label: 'Certified', sub: 'every installer' },
              { label: 'Free to use', sub: 'getting quotes costs nothing' },
              { label: 'Private',   sub: 'no cold calls' },
            ].map(t => (
              <div key={t.label} className="bg-ws-card border border-ws-border rounded-tile p-3">
                <div className="text-sm font-semibold text-ws-ink">{t.label}</div>
                <div className="text-xs text-ws-muted">{t.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-10 border-t border-ws-border">
          <h2
            className="text-2xl font-bold text-ws-ink mb-6 font-display tracking-tight text-center"
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
            className="text-2xl font-bold text-ws-ink mb-6 font-display tracking-tight text-center"
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
          <p className="text-sm text-ws-muted mb-4 text-center">What homeowners say about us</p>
          <div className="bg-ws-card rounded-card border border-ws-border p-6 text-center">
            <p className="text-2xl mb-3">⭐</p>
            <p className="font-semibold text-ws-ink text-sm mb-1">We&apos;re new — no reviews yet</p>
            <p className="text-xs text-ws-muted leading-relaxed max-w-xs mx-auto">
              If you use WattSmart, we&apos;d love to hear what you think. Reviews on Google or Trustpilot help other homeowners find us.
            </p>
            <div className="flex justify-center gap-3 mt-4">
              {/* TODO: replace with real Google Place review URL once GMB is set up */}
              <a href="https://www.google.com/search?q=WattSmart+solar+installers" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-ws-dark-green border border-ws-border rounded-btn px-3 py-1.5 hover:bg-ws-border transition-colors">
                Leave a Google review
              </a>
              <a href="https://trustpilot.com/review/wattsmart.co.uk" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-ws-dark-green border border-ws-border rounded-btn px-3 py-1.5 hover:bg-ws-border transition-colors">
                Leave a Trustpilot review
              </a>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-10 border-t border-ws-border text-center">
          <h2
            className="text-2xl font-bold text-ws-ink mb-2 font-display tracking-tight"
          >
            Ready for quotes you can trust?
          </h2>
          <p className="text-ws-muted text-sm mb-6">Free, anonymous, no obligation.</p>
          <Link href="/get-quotes">
            <Button size="lg" className="w-full sm:w-auto">
              Get up to 3 quotes →
            </Button>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-ws-border mt-4 py-8">
        <div className="max-w-content mx-auto px-5 flex flex-wrap items-center justify-between gap-4 text-sm text-ws-muted">
          <Logo />
          <nav className="flex flex-wrap gap-4">
            <Link href="/#how-it-works" className="hover:text-ws-body transition-colors">How it works</Link>
            <Link href="/contact"       className="hover:text-ws-body transition-colors">Contact us</Link>
            <Link href="/how-youre-protected" className="hover:text-ws-body transition-colors">How you&apos;re protected</Link>
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
