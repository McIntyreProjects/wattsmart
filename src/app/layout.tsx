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
// Public pre-launch notice — shown while NEXT_PUBLIC_PRELAUNCH=1 is set in the
// environment. At launch: remove the env var in Vercel and redeploy.
const isPrelaunch = process.env.NEXT_PUBLIC_PRELAUNCH === '1'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${figtree.variable}`}>
      <body>
        {isPrelaunch && (
          <div className="bg-[#FFF7E6] border-b border-[#F0DCA8] px-4 py-2.5 text-center text-sm font-semibold text-[#8A6D1A]">
            🚧 WattSmart is getting ready to launch — the service isn&apos;t live yet, and we can&apos;t take real enquiries or payments.
          </div>
        )}
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
