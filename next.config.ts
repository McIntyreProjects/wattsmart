import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              // *.supabase.co: signed roof-layout images from private storage
              "img-src 'self' data: blob: https://lh3.googleusercontent.com https://*.supabase.co",
              "frame-src https://js.stripe.com https://hooks.stripe.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://api.postcodes.io https://api.anthropic.com https://maps.googleapis.com https://api.uk.trustpilot.com https://*.ingest.de.sentry.io",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  org: 'wattsmart',
  project: 'javascript-nextjs',
  silent: true,
  sourcemaps: { disable: true },
})
