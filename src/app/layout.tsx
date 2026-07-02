import type { Metadata } from 'next'
import { Bricolage_Grotesque, Figtree } from 'next/font/google'
import './globals.css'
import { CookieBanner } from '@/components/ui/CookieBanner'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-bricolage',
  display: 'swap',
})

const figtree = Figtree({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-figtree',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'WattSmart — Green Energy for Your Home',
  description:
    'Compare certified solar, battery, heat pump and EV charger installers in North East England & Yorkshire. Free, anonymous quotes — no cold calls.',
  metadataBase: new URL('https://wattsmart.co.uk'),
  openGraph: {
    title: 'WattSmart — Green Energy for Your Home',
    description:
      'Compare certified solar, battery, heat pump and EV charger installers in North East England & Yorkshire. Free, anonymous quotes — no cold calls.',
    url: 'https://wattsmart.co.uk',
    siteName: 'WattSmart',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WattSmart — Green Energy for Your Home',
    description:
      'Compare certified solar, battery, heat pump and EV charger installers in North East England & Yorkshire. Free, anonymous quotes — no cold calls.',
  },
}

const isDev = process.env.NODE_ENV === 'development'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${figtree.variable}`}>
      <body>
        {isDev && (
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 9999,
              background: '#1a1a2e',
              color: '#f0c040',
              fontSize: '12px',
              fontFamily: 'monospace',
              padding: '6px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              borderTop: '2px solid #f0c040',
            }}
          >
            <span>⚠ TEST MODE — not live</span>
            <span className="opacity-60">|</span>
            <span>customer@test.wattsmart.co.uk · TestCustomer123!</span>
            <span className="opacity-60">|</span>
            <span>installer@test.wattsmart.co.uk · TestInstaller123!</span>
            <span className="opacity-60">|</span>
            <span>admin@test.wattsmart.co.uk · TestAdmin123!</span>
            <span className="opacity-60">|</span>
            <span>Stripe: 4242 4242 4242 4242 · any expiry · any CVC</span>
          </div>
        )}
        <div style={isDev ? { paddingBottom: '34px' } : undefined}>
          {children}
        </div>
        <CookieBanner />
      </body>
    </html>
  )
}
