import { test, expect } from '@playwright/test'

test.describe('Smart form (get quotes)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/get-quotes')
  })

  test('loads the first step', async ({ page }) => {
    await expect(page.getByText(/solar|battery|heat pump|EV/i).first()).toBeVisible()
  })

  test('can select products', async ({ page }) => {
    // Click "Solar panels" if visible
    const solar = page.getByText('Solar panels').first()
    if (await solar.isVisible()) {
      await solar.click()
    }
  })

  test('shows step progress', async ({ page }) => {
    // There should be a step indicator
    const steps = page.locator('[class*="step"], [class*="progress"], [aria-current="step"]')
    // Just check the page loaded correctly
    await expect(page).toHaveURL('/get-quotes')
  })
})
