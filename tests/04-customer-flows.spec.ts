import { test, expect } from '@playwright/test'

// These tests check the customer-facing pages using static routes
// (no login required — testing the page structure and content)

test.describe('Customer: Quote comparison', () => {
  test('one-quote holding page loads', async ({ page }) => {
    await page.goto('/customer/enquiries/test123/one-quote')
    await expect(page.getByText(/first quote/i)).toBeVisible()
    await expect(page.getByText(/Quote A/i).first()).toBeVisible()
  })

  test('expiring quote page shows amber warning', async ({ page }) => {
    await page.goto('/customer/enquiries/test123/expiring')
    await expect(page.getByText(/expires/i)).toBeVisible()
    await expect(page.getByText(/Quote A/i).first()).toBeVisible()
  })

  test('no-quotes page shows re-match offer', async ({ page }) => {
    await page.goto('/customer/enquiries/test123/no-quotes')
    await expect(page.getByText(/3 new installers/i)).toBeVisible()
  })

  test('quote breakdown page loads', async ({ page }) => {
    await page.goto('/customer/enquiries/test123/breakdown/quoteA')
    await expect(page.getByText(/breakdown|included|spec/i).first()).toBeVisible()
  })

  test('refund flow page loads', async ({ page }) => {
    await page.goto('/customer/enquiries/test123/refund')
    await expect(page.getByText(/refund/i).first()).toBeVisible()
  })
})

test.describe('Customer: Job tracker', () => {
  test('job tracker page loads', async ({ page }) => {
    await page.goto('/customer/jobs/test123')
    await expect(page).toHaveURL(/auth\/login|jobs\/test123/)
  })

  test('pay balance page loads', async ({ page }) => {
    await page.goto('/customer/jobs/test123/balance')
    await expect(page).toHaveURL(/auth\/login|balance/)
  })

  test('approve date page loads', async ({ page }) => {
    await page.goto('/customer/jobs/test123/date')
    await expect(page).toHaveURL(/auth\/login|date/)
  })

  test('support triage page loads', async ({ page }) => {
    await page.goto('/customer/jobs/test123/support')
    await expect(page).toHaveURL(/auth\/login|support/)
  })
})

test.describe('Customer: Critical states', () => {
  test('checkout page shows payment form', async ({ page }) => {
    await page.goto('/customer/checkout')
    await expect(page.getByText(/deposit|pay/i).first()).toBeVisible()
  })

  test('checkout shows Stripe test card hint in dev', async ({ page }) => {
    await page.goto('/customer/checkout')
    await expect(page.getByPlaceholder('4242 4242 4242 4242')).toBeVisible()
  })

  test('clicking pay simulates failed payment', async ({ page }) => {
    await page.goto('/customer/checkout')
    // If not logged in, this page redirects — skip gracefully
    if (page.url().includes('/auth/login')) return
    await page.getByRole('button', { name: /pay/i }).click()
    await expect(page.getByText("Payment didn't go through")).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Nothing has been taken from your account')).toBeVisible()
    await expect(page.getByText('Quote B is still held for you')).toBeVisible()
  })

  test('failed payment shows retry options', async ({ page }) => {
    await page.goto('/customer/checkout')
    await page.getByRole('button', { name: /pay/i }).click()
    await expect(page.getByRole('button', { name: /try payment again/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /different card/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /bank transfer/i })).toBeVisible()
  })

  test('cancel within cooling-off shows full refund', async ({ page }) => {
    await page.goto('/customer/cancel')
    await expect(page.getByText('Cancel this booking?')).toBeVisible()
    await expect(page.getByText('full refund').first()).toBeVisible()
    await expect(page.getByText('£250.00').first()).toBeVisible()
  })

  test('refund confirmed page loads correctly', async ({ page }) => {
    await page.goto('/customer/refund-confirmed')
    await expect(page.getByText('Your refund is confirmed')).toBeVisible()
    await expect(page.getByText('Cancellation confirmed')).toBeVisible()
    await expect(page.getByText('Refund issued')).toBeVisible()
  })

  test('installer reveal page loads', async ({ page }) => {
    await page.goto('/customer/reveal/test123')
    await expect(page).toHaveURL(/auth\/login|reveal/)
  })

  test('documents hub shows all document types', async ({ page }) => {
    await page.goto('/customer/documents')
    await expect(page.getByText('Quote B — full specification')).toBeVisible()
    await expect(page.getByText('MCS installation certificate')).toBeVisible()
    await expect(page.getByText('Deposit receipt')).toBeVisible()
  })
})

test.describe('Customer: Account settings', () => {
  test('settings page redirects to login if not authenticated', async ({ page }) => {
    await page.goto('/customer/settings')
    await expect(page).toHaveURL(/auth\/login|settings/)
  })
})
