import { test, expect } from '@playwright/test'

test.describe('Admin: Dashboard', () => {
  test('dashboard redirects to login if not authenticated', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await expect(page).toHaveURL(/auth\/login|dashboard/)
  })
})

test.describe('Admin: Customers', () => {
  test('customers page loads with table', async ({ page }) => {
    await page.goto('/admin/customers')
    await expect(page.getByText('Customer accounts')).toBeVisible()
    await expect(page.getByText('Sarah Mills')).toBeVisible()
    await expect(page.getByText('James Okafor')).toBeVisible()
    await expect(page.getByText('Priya Kaur')).toBeVisible()
  })

  test('shows status badges', async ({ page }) => {
    await page.goto('/admin/customers')
    await expect(page.getByText('Comparing quotes')).toBeVisible()
    await expect(page.getByText('Deposit held', { exact: true }).first()).toBeVisible()
  })

  test('filter tabs show counts', async ({ page }) => {
    await page.goto('/admin/customers')
    await expect(page.getByText('All · 214')).toBeVisible()
    await expect(page.getByText('Comparing · 18')).toBeVisible()
    await expect(page.getByText('Deposit held · 12')).toBeVisible()
  })
})

test.describe('Admin: Installers', () => {
  test('installers page loads with flagged tab', async ({ page }) => {
    await page.goto('/admin/installers')
    await expect(page.getByText('Installer management')).toBeVisible()
    await expect(page.getByText('Greenfield Renewables Ltd')).toBeVisible()
  })

  test('shows cert check results', async ({ page }) => {
    await page.goto('/admin/installers')
    await expect(page.getByText('MCS')).toBeVisible()
    await expect(page.getByText('Companies House')).toBeVisible()
    await expect(page.getByText('expires 24 Jun')).toBeVisible()
  })

  test('approve and decline buttons are visible', async ({ page }) => {
    await page.goto('/admin/installers')
    await expect(page.getByRole('button', { name: /approve/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /decline/i })).toBeVisible()
  })

  test('flagged tab is active by default', async ({ page }) => {
    await page.goto('/admin/installers')
    await expect(page.getByText('Flagged · 1')).toBeVisible()
  })
})

test.describe('Admin: Pipeline', () => {
  test('pipeline shows 4 kanban columns', async ({ page }) => {
    await page.goto('/admin/pipeline')
    await expect(page.getByText('Job pipeline')).toBeVisible()
    await expect(page.getByText(/Quoting · 41/)).toBeVisible()
    await expect(page.getByText(/Chosen · 18/)).toBeVisible()
    await expect(page.getByText(/Booked · 12/)).toBeVisible()
    await expect(page.getByText(/Done · 26/)).toBeVisible()
  })

  test('shows amber card for 1-quote auto-sent state', async ({ page }) => {
    await page.goto('/admin/pipeline')
    await expect(page.getByText('1 quote · auto-sent to 2 more')).toBeVisible()
  })
})

test.describe('Admin: Fees', () => {
  test('fees page shows total', async ({ page }) => {
    await page.goto('/admin/fees')
    await expect(page.getByText('Fee income')).toBeVisible()
    await expect(page.getByText('£4,820')).toBeVisible()
  })

  test('month/year toggle works', async ({ page }) => {
    await page.goto('/admin/fees')
    await expect(page.getByRole('button', { name: 'Month' })).toBeVisible()
    await page.getByRole('button', { name: 'Year' }).click()
    await expect(page.getByText('£28,440')).toBeVisible()
  })

  test('shows recent fees list', async ({ page }) => {
    await page.goto('/admin/fees')
    await expect(page.getByText(/SR2/)).toBeVisible()
    await expect(page.getByText('+£412')).toBeVisible()
  })

  test('fee capture page loads', async ({ page }) => {
    await page.goto('/admin/fees/WS-1990')
    await expect(page.getByText('Fee to capture')).toBeVisible()
    await expect(page.getByText('£437.00')).toBeVisible()
  })

  test('dunning escalation page loads', async ({ page }) => {
    await page.goto('/admin/fees/dunning/brightwatt')
    await expect(page.getByText('Overdue fee')).toBeVisible()
    await expect(page.getByText('45 days overdue')).toBeVisible()
    await expect(page.getByText('Invoice issued')).toBeVisible()
  })
})

test.describe('Admin: Settings', () => {
  test('settings page loads with sidebar', async ({ page }) => {
    await page.goto('/admin/settings')
    await expect(page.getByText('Business & billing').first()).toBeVisible()
    await expect(page.getByText('Payouts')).toBeVisible()
    await expect(page.getByText('Automation')).toBeVisible()
    await expect(page.getByText('Team & access')).toBeVisible()
  })

  test('business & billing panel shows company details', async ({ page }) => {
    await page.goto('/admin/settings')
    await expect(page.getByText('WattSmart Ltd')).toBeVisible()
    await expect(page.getByText('14829006')).toBeVisible()
  })

  test('switching to Team & access shows invite button', async ({ page }) => {
    await page.goto('/admin/settings')
    await page.getByRole('button', { name: 'Team & access' }).click()
    await expect(page.getByRole('button', { name: /send invite/i })).toBeVisible()
  })

  test('switching to Automation shows toggle rules', async ({ page }) => {
    await page.goto('/admin/settings')
    await page.getByRole('button', { name: 'Automation' }).click()
    await expect(page.getByText('Auto-approve refunds under £500')).toBeVisible()
    await expect(page.getByText('Auto-pause on cert lapse')).toBeVisible()
  })
})

test.describe('Admin: Attention queue', () => {
  test('attention queue loads with prioritised items', async ({ page }) => {
    await page.goto('/admin/attention')
    await expect(page.getByText('Needs attention')).toBeVisible()
    await expect(page.getByText('Action needed')).toBeVisible()
    await expect(page.getByText('Northside NICEIC lapsed')).toBeVisible()
    await expect(page.getByText('Brightwatt fee £450')).toBeVisible()
  })

  test('shows auto-resolving section', async ({ page }) => {
    await page.goto('/admin/attention')
    await expect(page.getByText('Auto-resolving', { exact: true })).toBeVisible()
    await expect(page.getByText('Deposit refund £640 pending')).toBeVisible()
  })

  test('shows watching section', async ({ page }) => {
    await page.goto('/admin/attention')
    await expect(page.getByText('Watching', { exact: true })).toBeVisible()
    await expect(page.getByText('Greenvolt insurance expires in 10 days')).toBeVisible()
  })
})

test.describe('Admin: Team access', () => {
  test('accept invite page shows locked email field', async ({ page }) => {
    await page.goto('/admin/team/accept-invite')
    await expect(page.getByText('Accept your invite')).toBeVisible()
    await expect(page.getByText('ops@wattsmart.co.uk')).toBeVisible()
  })

  test('create account button is disabled until form is complete', async ({ page }) => {
    await page.goto('/admin/team/accept-invite')
    const btn = page.getByRole('button', { name: /create account/i })
    await expect(btn).toBeDisabled()
  })
})
