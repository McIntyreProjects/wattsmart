/**
 * Playwright auth setup — logs in as each role once and saves browser state.
 * All auth-dependent tests reuse this so they don't need to log in themselves.
 *
 * REQUIRES Supabase test accounts to exist first. Run once:
 *   bash supabase/create-test-users.sh <your-project-id>
 *
 * If accounts don't exist yet, setup writes an empty state and
 * auth-protected tests will simply redirect to login (and fail with
 * a clear message pointing you here).
 */
import { test as setup } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const STORAGE = {
  customer:  path.join(__dirname, '.auth/customer.json'),
  installer: path.join(__dirname, '.auth/installer.json'),
  admin:     path.join(__dirname, '.auth/admin.json'),
}

async function loginAndSave(
  page: import('@playwright/test').Page,
  url: string,
  email: string,
  password: string,
  storagePath: string,
  role: string
) {
  try {
    await page.goto(url)
    await page.getByPlaceholder('you@example.com').fill(email)
    await page.locator('input[type="password"]').fill(password)
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    await page.waitForURL(url => !url.pathname.includes('/auth/login'), { timeout: 10_000 })
    await page.context().storageState({ path: storagePath })
    console.log(`✓ Logged in as ${role}`)
  } catch {
    console.warn(`\n⚠ Could not log in as ${role} (${email}).`)
    console.warn(`  Run: bash supabase/create-test-users.sh <your-project-id>`)
    console.warn(`  Then re-run the tests.\n`)
    // Write empty state so Playwright doesn't crash
    fs.writeFileSync(storagePath, JSON.stringify({ cookies: [], origins: [] }))
  }
}

setup('log in as customer', async ({ page }) => {
  await loginAndSave(
    page,
    '/auth/login?type=customer',
    'customer@test.wattsmart.co.uk',
    'TestCustomer123!',
    STORAGE.customer,
    'customer'
  )
})

setup('log in as installer', async ({ page }) => {
  await loginAndSave(
    page,
    '/auth/login?type=installer',
    'installer@test.wattsmart.co.uk',
    'TestInstaller123!',
    STORAGE.installer,
    'installer'
  )
})

setup('log in as admin', async ({ page }) => {
  await loginAndSave(
    page,
    '/auth/login?type=admin',
    'admin@test.wattsmart.co.uk',
    'TestAdmin123!',
    STORAGE.admin,
    'admin'
  )
})
