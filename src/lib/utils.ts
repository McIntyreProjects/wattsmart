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

export const LAUNCH_POSTCODES = ['NE', 'DH', 'SR', 'TS', 'YO', 'HG', 'HX', 'HD', 'BD', 'LS', 'WF', 'DN', 'S']

export function isLaunchPostcode(postcode: string): boolean {
  const area = getPostcodeArea(postcode)
  return LAUNCH_POSTCODES.some(p => area.startsWith(p))
}
