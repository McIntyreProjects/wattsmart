import type { Metadata } from 'next'
import './globals.css'
import { CookieBanner } from '@/components/ui/CookieBanner'

export const metadata: Metadata = {
  title: 'WattSmart — Green Energy for Your Home',
  description:
    'Compare certified solar, battery, heat pump and EV charger installers in North East England & Yorkshire. Free, anonymous quotes — no cold calls.',
  metadataBase: new URL('https://wattsmart.co.uk'),
}

const isDev = process.env.NODE_ENV === 'development'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
            <span style={{ opacity: 0.6 }}>|</span>
            <span>customer@test.wattsmart.co.uk · TestCustomer123!</span>
            <span style={{ opacity: 0.6 }}>|</span>
            <span>installer@test.wattsmart.co.uk · TestInstaller123!</span>
            <span style={{ opacity: 0.6 }}>|</span>
            <span>admin@test.wattsmart.co.uk · TestAdmin123!</span>
            <span style={{ opacity: 0.6 }}>|</span>
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
