import { Page } from '@playwright/test'

export const TEST_ACCOUNTS = {
  customer: {
    email: 'customer@test.wattsmart.co.uk',
    password: 'TestCustomer123!',
  },
  installer: {
    email: 'installer@test.wattsmart.co.uk',
    password: 'TestInstaller123!',
  },
  admin: {
    email: 'admin@test.wattsmart.co.uk',
    password: 'TestAdmin123!',
  },
}

export const TEST_CERTS = {
  mcs: 'MCS-TEST-0001',
  recc: 'RECC-TEST-0001',
  niceic: 'NICEIC-TEST-0001',
  napit: 'NAPIT-TEST-0001',
  ozev: 'OZEV-TEST-0001',
  trustmark: 'TM-TEST-0001',
}

export const STRIPE_TEST_CARD = {
  number: '4242 4242 4242 4242',
  expiry: '12/30',
  cvc: '123',
}

export async function loginAs(page: Page, role: 'customer' | 'installer' | 'admin') {
  const account = TEST_ACCOUNTS[role]
  await page.goto('/auth/login')
  await page.getByLabel(/email/i).fill(account.email)
  await page.getByLabel(/password/i).fill(account.password)
  await page.getByRole('button', { name: /sign in|log in/i }).click()
  await page.waitForURL(/dashboard|home/, { timeout: 10_000 })
}

export async function expectTestModeBanner(page: Page) {
  await page.waitForSelector('text=TEST MODE', { timeout: 5_000 })
}
