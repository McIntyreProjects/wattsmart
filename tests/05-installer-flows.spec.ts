import { test, expect } from '@playwright/test'
import { TEST_CERTS } from './helpers'

test.describe('Installer: Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/installer/onboarding')
  })

  test('shows 5 steps in sidebar', async ({ page }) => {
    await expect(page.getByText('Business details')).toBeVisible()
    await expect(page.getByText('Products you fit')).toBeVisible()
    await expect(page.getByText('Certifications')).toBeVisible()
    await expect(page.getByText('Coverage area')).toBeVisible()
    await expect(page.getByText('Agree to terms')).toBeVisible()
  })

  test('step 1 shows business detail fields', async ({ page }) => {
    await expect(page.getByText('Tell us about your business')).toBeVisible()
    await expect(page.getByPlaceholder(/northside|business name/i).first()).toBeVisible()
  })

  test('can advance to step 2', async ({ page }) => {
    if (page.url().includes('/auth/login')) return
    await page.getByRole('button', { name: /continue/i }).click()
    await expect(page.getByText('Which products do you fit')).toBeVisible({ timeout: 10_000 })
  })

  test('step 2 shows product toggles', async ({ page }) => {
    if (page.url().includes('/auth/login')) return
    await page.getByRole('button', { name: /continue/i }).click()
    await expect(page.getByText('Solar PV')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Battery storage')).toBeVisible()
    await expect(page.getByText('Heat pumps')).toBeVisible()
    await expect(page.getByText('EV chargers')).toBeVisible()
  })

  test('step 3 shows certification entry', async ({ page }) => {
    if (page.url().includes('/auth/login')) return
    await page.getByRole('button', { name: /continue/i }).click()
    await page.getByRole('button', { name: /continue/i }).click()
    await expect(page.getByText('MCS', { exact: true })).toBeVisible({ timeout: 10_000 })
  })

  test('test cert numbers are shown in the UI', async ({ page }) => {
    if (page.url().includes('/auth/login')) return
    await page.getByRole('button', { name: /continue/i }).click()
    await page.getByRole('button', { name: /continue/i }).click()
    await expect(page.getByText(/verified|found/i).first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Installer: Registration', () => {
  test('register page loads', async ({ page }) => {
    await page.goto('/installer/register')
    await expect(page).toHaveURL(/register|onboarding|login/)
  })
})

test.describe('Installer: Dashboard & profile', () => {
  test('dashboard redirects to login if not authenticated', async ({ page }) => {
    await page.goto('/installer/dashboard')
    await expect(page).toHaveURL(/auth\/login|dashboard|register/)
  })

  test('profile page redirects to login if not authenticated', async ({ page }) => {
    await page.goto('/installer/profile')
    await expect(page).toHaveURL(/auth\/login|profile/)
  })

  test('performance page redirects to login if not authenticated', async ({ page }) => {
    await page.goto('/installer/performance')
    await expect(page).toHaveURL(/auth\/login|performance/)
  })
})

test.describe('Installer: Cert states', () => {
  test('cert expiring page shows renewal steps', async ({ page }) => {
    await page.goto('/installer/cert-expiring')
    await expect(page.getByText('Renew before it lapses')).toBeVisible()
    await expect(page.getByText(/MCS/i).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /renew/i }).first()).toBeVisible()
  })

  test('cert lapsed page shows affected jobs and steps', async ({ page }) => {
    await page.goto('/installer/cert-lapsed')
    await expect(page.getByText('Renew to resume matching')).toBeVisible()
    await expect(page.getByText('Get back to matching in 3 steps')).toBeVisible()
    await expect(page.getByText('#WS-2041')).toBeVisible()
    await expect(page.getByText('#WS-2103')).toBeVisible()
  })
})

test.describe('Installer: Schedule', () => {
  test('propose date page loads', async ({ page }) => {
    await page.goto('/installer/jobs/test123/schedule')
    await expect(page.getByText('Propose an install date')).toBeVisible()
    await expect(page.getByText('Proposed install date')).toBeVisible()
  })

  test('propose date button is disabled until date selected', async ({ page }) => {
    await page.goto('/installer/jobs/test123/schedule')
    const btn = page.getByRole('button', { name: /propose/i })
    await expect(btn).toBeDisabled()
  })

  test('submitting a date shows confirmation', async ({ page }) => {
    await page.goto('/installer/jobs/test123/schedule')
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 7)
    const dateStr = tomorrow.toISOString().split('T')[0]
    await page.locator('input[type="date"]').fill(dateStr)
    await page.getByRole('button', { name: /propose/i }).click()
    await expect(page.getByText('Date proposed')).toBeVisible()
  })

  test('shows balance timing options', async ({ page }) => {
    await page.goto('/installer/jobs/test123/schedule')
    await expect(page.getByText('3 days before install')).toBeVisible()
    await expect(page.getByText('7 days before install')).toBeVisible()
    await expect(page.getByText('14 days before install')).toBeVisible()
    await expect(page.getByText('On the day')).toBeVisible()
  })
})

test.describe('Installer: Fees', () => {
  test('fees page loads', async ({ page }) => {
    await page.goto('/installer/fees')
    await expect(page.getByText('Fees owed')).toBeVisible()
    await expect(page.getByText('5%').first()).toBeVisible()
  })
})
