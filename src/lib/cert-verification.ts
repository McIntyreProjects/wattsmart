export type CertVerificationResult = {
  verified: boolean
  expiresAt?: string
  reason?: string
  source: string
  testMode?: boolean
}

// Test numbers that auto-pass in development only — never active in production
const DEV_TEST_NUMBERS: Record<string, string> = {
  'MCS-TEST-0001':   'mcs',
  'RECC-TEST-0001':  'recc',
  'NICEIC-TEST-0001':'niceic',
  'NAPIT-TEST-0001': 'napit',
  'OZEV-TEST-0001':  'ozev',
  'TM-TEST-0001':    'trustmark',
}

function checkTestMode(certNumber: string): CertVerificationResult | null {
  if (process.env.NODE_ENV !== 'development') return null
  const normalised = certNumber.trim().toUpperCase()
  if (Object.keys(DEV_TEST_NUMBERS).includes(normalised)) {
    return {
      verified: true,
      expiresAt: '2027-12-31',
      source: 'test-mode',
      testMode: true,
    }
  }
  return null
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 8000): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(id)
  }
}

export async function verifyMCS(certNumber: string): Promise<CertVerificationResult> {
  const test = checkTestMode(certNumber)
  if (test) return test
  const source = 'https://mcscertified.com/find-an-installer/'
  try {
    const res = await fetchWithTimeout(
      `https://mcscertified.com/api/search?q=${encodeURIComponent(certNumber)}`,
      { headers: { 'User-Agent': 'WattSmart/1.0' } }
    )
    if (res.ok) {
      const data = await res.json()
      if (data?.results?.length > 0) {
        return { verified: true, source, expiresAt: data.results[0]?.expiry_date }
      }
    }
  } catch {}
  // Fallback: flag for manual check
  return { verified: false, reason: 'Could not verify automatically — please check manually at mcscertified.com', source }
}

export async function verifyRECC(certNumber: string): Promise<CertVerificationResult> {
  const test = checkTestMode(certNumber)
  if (test) return test
  const source = 'https://www.recc.org.uk/consumers/find-a-member'
  try {
    const res = await fetchWithTimeout(
      `https://www.recc.org.uk/api/member?ref=${encodeURIComponent(certNumber)}`,
      { headers: { 'User-Agent': 'WattSmart/1.0' } }
    )
    if (res.ok) {
      const data = await res.json()
      if (data?.member) {
        return { verified: true, source }
      }
    }
  } catch {}
  return { verified: false, reason: 'Could not verify automatically — please check manually at recc.org.uk', source }
}

export async function verifyNICEIC(certNumber: string): Promise<CertVerificationResult> {
  const test = checkTestMode(certNumber)
  if (test) return test
  const source = 'https://www.niceic.com/find-a-contractor'
  try {
    const res = await fetchWithTimeout(
      `https://www.niceic.com/api/contractor?ref=${encodeURIComponent(certNumber)}`,
      { headers: { 'User-Agent': 'WattSmart/1.0' } }
    )
    if (res.ok) {
      const data = await res.json()
      if (data?.contractor) {
        return { verified: true, source }
      }
    }
  } catch {}
  return { verified: false, reason: 'Could not verify automatically — please check manually at niceic.com', source }
}

export async function verifyNAPIT(certNumber: string): Promise<CertVerificationResult> {
  const test = checkTestMode(certNumber)
  if (test) return test
  const source = 'https://www.napit.org.uk/find-an-installer'
  try {
    const res = await fetchWithTimeout(
      `https://www.napit.org.uk/api/installer?ref=${encodeURIComponent(certNumber)}`,
      { headers: { 'User-Agent': 'WattSmart/1.0' } }
    )
    if (res.ok) {
      const data = await res.json()
      if (data?.installer) {
        return { verified: true, source }
      }
    }
  } catch {}
  return { verified: false, reason: 'Could not verify automatically — please check manually at napit.org.uk', source }
}

export async function verifyTrustMark(certNumber: string): Promise<CertVerificationResult> {
  const test = checkTestMode(certNumber)
  if (test) return test
  const source = 'https://www.trustmark.org.uk/find-a-tradesperson'
  try {
    const res = await fetchWithTimeout(
      `https://www.trustmark.org.uk/api/search?ref=${encodeURIComponent(certNumber)}`,
      { headers: { 'User-Agent': 'WattSmart/1.0' } }
    )
    if (res.ok) {
      const data = await res.json()
      if (data?.results?.length > 0) {
        return { verified: true, source }
      }
    }
  } catch {}
  return { verified: false, reason: 'Could not verify automatically — please check manually at trustmark.org.uk', source }
}

export async function verifyOZEV(authNumber: string): Promise<CertVerificationResult> {
  const test = checkTestMode(authNumber)
  if (test) return test
  const source = 'https://www.gov.uk/guidance/residential-and-commercial-chargepoints-become-an-authorised-installer'
  // OZEV register is not available via public API — flag for manual check
  return {
    verified: false,
    reason: 'OZEV authorisation requires manual verification — please check the government register',
    source,
  }
}

export async function verifyCert(type: string, number: string): Promise<CertVerificationResult> {
  switch (type) {
    case 'mcs': return verifyMCS(number)
    case 'recc': return verifyRECC(number)
    case 'hies': return verifyRECC(number) // HIES uses similar structure
    case 'niceic': return verifyNICEIC(number)
    case 'napit': return verifyNAPIT(number)
    case 'trustmark': return verifyTrustMark(number)
    case 'ozev': return verifyOZEV(number)
    default: return { verified: false, reason: 'Unknown certification type', source: '' }
  }
}
