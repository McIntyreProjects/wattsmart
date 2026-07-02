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

export function getPostcodeArea(postcode: string): string {
  return postcode.trim().toUpperCase().split(' ')[0].replace(/\d+$/, '')
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

export const LAUNCH_POSTCODES = ['NE', 'DH', 'SR', 'TS', 'YO', 'HG', 'HX', 'HD', 'BD', 'LS', 'WF', 'DN', 'S']

export function isLaunchPostcode(postcode: string): boolean {
  const area = getPostcodeArea(postcode)
  return LAUNCH_POSTCODES.some(p => area.startsWith(p))
}
