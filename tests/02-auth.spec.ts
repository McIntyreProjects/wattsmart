import { test, expect } from '@playwright/test'
import { TEST_ACCOUNTS } from './helpers'

test.describe('Authentication', () => {
  test('login page loads for customers', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in|log in|send|magic/i })).toBeVisible()
  })

  test('protected customer routes redirect to login when not signed in', async ({ page }) => {
    await page.goto('/customer/dashboard')
    await expect(page).toHaveURL(/auth\/login/)
  })

  test('protected installer routes redirect to login when not signed in', async ({ page }) => {
    await page.goto('/installer/dashboard')
    await expect(page).toHaveURL(/auth\/login/)
  })

  test('protected admin routes redirect to login when not signed in', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await expect(page).toHaveURL(/auth\/login/)
  })

  test('password reset page loads', async ({ page }) => {
    await page.goto('/auth/reset')
    await expect(page.getByText('Reset your password')).toBeVisible()
    await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible()
  })

  test('password reset shows check email after submit', async ({ page }) => {
    await page.goto('/auth/reset')
    await page.getByPlaceholder('sarah.m@email.com').fill('anyone@example.com')
    await page.getByRole('button', { name: /send reset link/i }).click()
    await expect(page.getByText('Check your email')).toBeVisible({ timeout: 10_000 })
  })

  test('set new password page has strength meter', async ({ page }) => {
    await page.goto('/auth/reset/new')
    const input = page.locator('input[type="password"]').first()
    await input.fill('weak')
    await expect(page.getByText('Weak password')).toBeVisible()
    await input.fill('StrongPass1!')
    await expect(page.getByText('Strong password')).toBeVisible()
  })

  test('admin 2FA recovery page loads', async ({ page }) => {
    await page.goto('/auth/recover')
    await expect(page.getByText('Owner account recovery')).toBeVisible()
  })
})
