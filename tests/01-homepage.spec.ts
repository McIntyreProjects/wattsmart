import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('shows the hero headline', async ({ page }) => {
    await expect(page.getByText('Green-energy quotes without the 20 phone calls')).toBeVisible()
  })

  test('shows the correct trust bar copy', async ({ page }) => {
    await expect(page.getByText('Free to use')).toBeVisible()
    await expect(page.getByText('getting quotes costs nothing')).toBeVisible()
    await expect(page.getByText('Certified', { exact: true })).toBeVisible()
    await expect(page.getByText('Private', { exact: true })).toBeVisible()
  })

  test('Get quotes button links to smart form', async ({ page }) => {
    await page.getByRole('link', { name: /get quotes/i }).first().click()
    await expect(page).toHaveURL('/get-quotes')
  })

  test('Installer portal link is visible in nav', async ({ page }) => {
    await expect(page.getByRole('link', { name: /installer portal/i }).first()).toBeVisible()
  })

  test('How it works section shows 4 steps', async ({ page }) => {
    await expect(page.getByText('Tell us about your home')).toBeVisible()
    await expect(page.getByText('Get up to 3 anonymous quotes')).toBeVisible()
    await expect(page.getByText('Choose & pay securely')).toBeVisible()
    await expect(page.getByText('Meet your installer')).toBeVisible()
  })

  test('shows test mode banner in development', async ({ page }) => {
    await expect(page.getByText('TEST MODE')).toBeVisible()
  })

  test('footer links to privacy and terms', async ({ page }) => {
    await page.getByRole('link', { name: /privacy/i }).click()
    await expect(page).toHaveURL('/privacy')
  })
})
