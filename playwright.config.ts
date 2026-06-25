import { defineConfig, devices } from '@playwright/test'
import path from 'path'

const STORAGE = {
  customer:  path.join(__dirname, 'tests/.auth/customer.json'),
  installer: path.join(__dirname, 'tests/.auth/installer.json'),
  admin:     path.join(__dirname, 'tests/.auth/admin.json'),
}

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 1,
  reporter: [['html', { open: 'on-failure' }], ['list']],

  use: {
    baseURL: 'http://localhost:3000',
    headless: false,      // show the browser so you can watch
    slowMo: 200,          // slow enough to see what's happening
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    // ── Step 1: log in as all three roles ──────────────────────────
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
    },

    // ── Public pages (no login needed) ─────────────────────────────
    {
      name: 'public',
      testMatch: [
        '**/01-homepage.spec.ts',
        '**/02-auth.spec.ts',
        '**/03-smart-form.spec.ts',
        '**/07-public-pages.spec.ts',
      ],
    },

    // ── Customer (logged in as customer) ───────────────────────────
    {
      name: 'customer',
      testMatch: '**/04-customer-flows.spec.ts',
      use: { storageState: STORAGE.customer },
      dependencies: ['setup'],
    },

    // ── Installer (logged in as installer) ─────────────────────────
    {
      name: 'installer',
      testMatch: '**/05-installer-flows.spec.ts',
      use: { storageState: STORAGE.installer },
      dependencies: ['setup'],
    },

    // ── Admin (logged in as admin) ─────────────────────────────────
    {
      name: 'admin',
      testMatch: '**/06-admin-flows.spec.ts',
      use: { storageState: STORAGE.admin },
      dependencies: ['setup'],
    },
  ],

  // Start the dev server automatically
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
