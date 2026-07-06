import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(pence: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(pence / 100)
}

export function generateJobRef(seq: number): string {
  return `WS-${String(seq).padStart(4, '0')}`
}

// Postcode AREA: the leading 1–2 letters of the outward code.
//   "S1 4XD"   → "S"    (Sheffield)
//   "SW1A 1AA" → "SW"   (London — must NOT be confused with "S")
//   "NE14XD"   → "NE"   (no space still works: letters end where digits begin)
// Callers must compare areas with exact equality, never startsWith —
// otherwise "S" (Sheffield) would swallow SW/SO/SA/SR/SS/ST etc.
export function getPostcodeArea(postcode: string): string {
  const cleaned = postcode.trim().toUpperCase().replace(/\s+/g, '')
  const match = cleaned.match(/^([A-Z]{1,2})\d/)
  // Malformed input: return the cleaned string so it can never
  // accidentally equal a real area.
  return match ? match[1] : cleaned
}

// Outward code (district), e.g. "NE1" from "NE1 4XD". The most granular
// location installers are allowed to see before a quote is accepted.
export function getPostcodeDistrict(postcode: string): string {
  const cleaned = postcode.trim().toUpperCase()
  if (cleaned.includes(' ')) return cleaned.split(/\s+/)[0]
  // No space (e.g. "NE14XD"): the inward code is always digit + 2 letters
  const match = cleaned.match(/^(.+?)\d[A-Z]{2}$/)
  return match ? match[1] : cleaned
}

// Compass point (8-way) from an azimuth in degrees clockwise from north,
// e.g. 135 -> "SE". Used to describe roof segments to installers.
export function azimuthToCompass(degrees: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  const normalised = ((degrees % 360) + 360) % 360
  return dirs[Math.round(normalised / 45) % 8]
}

// Launch areas: North East England & Yorkshire postcode AREAS.
// "S" is Sheffield; "SR" is Sunderland. Both are legitimately in the list.
// Full North East England + Yorkshire coverage:
// NE Newcastle, DH Durham, SR Sunderland, DL Darlington, TS Teesside,
// YO York, HU Hull, HG Harrogate, LS Leeds, BD Bradford, WF Wakefield,
// HX Halifax, HD Huddersfield, S Sheffield, DN Doncaster
export const LAUNCH_POSTCODES = ['NE', 'DH', 'SR', 'DL', 'TS', 'YO', 'HU', 'HG', 'HX', 'HD', 'BD', 'LS', 'WF', 'DN', 'S']

// Exact area equality, NOT prefix matching:
//   isLaunchPostcode('S1 4XD')   → true   (area "S", Sheffield ∈ launch list)
//   isLaunchPostcode('SW1A 1AA') → false  (area "SW", London — previously
//                                          passed because "SW".startsWith("S"))
//   isLaunchPostcode('SO15 2AB') → false  (area "SO", Southampton)
//   isLaunchPostcode('SR2 7DX')  → true   (area "SR", Sunderland)
export function isLaunchPostcode(postcode: string): boolean {
  return LAUNCH_POSTCODES.includes(getPostcodeArea(postcode))
}
