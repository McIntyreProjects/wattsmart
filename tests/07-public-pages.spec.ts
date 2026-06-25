import { test, expect } from '@playwright/test'

test.describe('Public pages', () => {
  test('privacy policy loads', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page.getByRole('heading', { name: /privacy/i })).toBeVisible()
  })

  test('terms and conditions loads', async ({ page }) => {
    await page.goto('/terms')
    await expect(page.getByRole('heading', { name: /terms/i })).toBeVisible()
  })

  test('contact page loads with form', async ({ page }) => {
    await page.goto('/contact')
    await expect(page.getByText('Get in touch')).toBeVisible()
    await expect(page.getByPlaceholder('Sarah Mills')).toBeVisible()
    await expect(page.getByPlaceholder('sarah@example.com')).toBeVisible()
    await expect(page.getByPlaceholder('How can we help?')).toBeVisible()
  })

  test('contact form has a send button', async ({ page }) => {
    await page.goto('/contact')
    await expect(page.getByRole('button', { name: /send/i })).toBeVisible()
  })

  test('404 page shows for unknown routes', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist')
    expect(response?.status()).toBe(404)
  })
})
