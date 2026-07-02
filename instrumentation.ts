import * as Sentry from '@sentry/nextjs'

export const onRequestError = Sentry.captureRequestError

// Outgoing calls to Google APIs carry customer PII in the query string
// (full address for geocoding, rooftop lat/lng for Solar API) plus the API
// key. Sentry's default http/fetch instrumentation attaches query strings to
// breadcrumbs and trace spans, so those requests must be excluded entirely.
const isGoogleApiUrl = (url: string) => url.includes('googleapis.com')

const piiSafeOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  debug: false,
  beforeBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
    const url = breadcrumb.data?.url
    if (breadcrumb.category === 'http' && typeof url === 'string' && isGoogleApiUrl(url)) {
      return null
    }
    return breadcrumb
  },
}

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      ...piiSafeOptions,
      integrations: [
        Sentry.httpIntegration({ ignoreOutgoingRequests: isGoogleApiUrl }),
        Sentry.nativeNodeFetchIntegration({ ignoreOutgoingRequests: isGoogleApiUrl }),
      ],
    })
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init(piiSafeOptions)
  }
}
