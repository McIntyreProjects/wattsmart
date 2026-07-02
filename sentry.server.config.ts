import * as Sentry from '@sentry/nextjs'

// Outgoing calls to Google APIs carry customer PII in the query string
// (full address for geocoding, rooftop lat/lng for Solar API) plus the API
// key — exclude them from breadcrumbs and trace spans entirely.
const isGoogleApiUrl = (url: string) => url.includes('googleapis.com')

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  debug: false,
  beforeBreadcrumb(breadcrumb) {
    const url = breadcrumb.data?.url
    if (breadcrumb.category === 'http' && typeof url === 'string' && isGoogleApiUrl(url)) {
      return null
    }
    return breadcrumb
  },
  integrations: [
    Sentry.httpIntegration({ ignoreOutgoingRequests: isGoogleApiUrl }),
    Sentry.nativeNodeFetchIntegration({ ignoreOutgoingRequests: isGoogleApiUrl }),
  ],
})
