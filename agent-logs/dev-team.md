# WattSmart Codebase Audit
**Date:** 2026-06-29  
**Conducted by:** Development Team (Auditor + QA)  
**Scope:** Full read-only audit of `/Users/stevenmcintyre/Documents/WattSmart/src/`

---

## Tech Stack Confirmed

| Layer | Technology |
|---|---|
| Framework | Next.js 15 App Router (React 19) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) — project `uatumuckqctedkjawqdk`, EU West |
| Auth | Supabase Auth (magic link for customers, password for installers/admin) |
| Payments | Stripe (payment intents with `capture_method: 'manual'`) |
| Email | Nodemailer (SMTP) with branded HTML templates |
| CSS | Tailwind CSS + custom design tokens |
| AI | Anthropic API (claude-sonnet-4-6) — used only for review anonymisation |
| Testing | Playwright |
| Hosting | Vercel (vercel.json present) |

Schema is defined in two migrations (`001_initial_schema.sql`, `002_missing_tables.sql`). RLS is enabled on all tables.

---

## Customer Journey Audit

### Step 1 — Enquiry Submission (`/get-quotes`)
**Status: ✅ Working**

- `SmartForm` (6-step wizard) collects products, property, energy usage, goal, contact details.
- Recommendation calculation runs client-side (`lib/recommendation.ts`) before final step.
- Submits to `POST /api/enquiries/submit`.
- API: creates auth user (or finds existing), upserts `customers`, inserts `enquiries`, matches up to 3 active installers by postcode area + product overlap, creates `jobs`, emails each installer with anonymised brief.
- **Issue:** `SmartForm` step labels show "3 / 6" for the property step and "1 / 6" for products — the counter appears hardcoded as display text, not derived from `step`. Steps 0–5 map to labels 1, 3, 4, 5, 6, "Your recommendation" — step 2 label is missing. Minor UX but confusing.
- **Issue:** Postcode matching uses `getPostcodeArea()` which strips trailing digits (e.g. "NE1" → "NE"). Coverage postcodes stored as districts ("NE", "DH") so matching is at region level, not district. This is intentional per the brief but means a very large area is matched (e.g. all of NE).
- **Issue:** The `SmartForm` step 4 has a "Log in to autofill" button that does nothing (no `href`, no action).
- **Issue:** If fewer than 3 installers match, 1 or 2 jobs are created. Status stays `quotes_requested`. The status is only updated to `quotes_received` when `quoteCount >= 3` in `POST /api/quotes/submit`. If only 1–2 quotes are ever submitted, enquiry never transitions to `quotes_received` and customer never gets the "compare quotes" email. See also `one-quote` and `no-quotes` pages that exist but are never triggered automatically.

### Step 2 — Waiting for Quotes
**Status: ⚠️ Partial**

- Customer is redirected to confirmation screen with reference number. No redirect to `/customer/dashboard`.
- Customer must manually navigate to dashboard or use the login link in the confirmation email.
- Dashboard shows enquiries with status badges. Link to "Compare quotes →" only shown when `status === 'quotes_received'`.
- **Issue:** No `/auth/signout` API route exists. The customer dashboard has `<form action="/auth/signout" method="post">` which will 404. Customers cannot sign out.
- **Issue:** Customers log in via magic link (OTP). After submitting their enquiry as a new user, they get an account but are never prompted to set a password or given a magic link to access it. They must use the login page and trigger a new OTP — but they may not know they have an account yet.
- **Issue:** The `enquiry-confirm` email is sent, but contains no login link. It tells them "we'll email when quotes are ready" but doesn't link them to the dashboard.

### Step 3 — Viewing Quotes (`/customer/quotes/[enquiryId]`)
**Status: ✅ Working (with caveats)**

- Renders `QuoteComparison` component.
- Fetches `GET /api/quotes/[enquiryId]` — verifies customer owns enquiry, returns quotes without `installer_id`. Good.
- Displays quote label (A/B/C), price, deposit, specs, timeframe, notes.
- "Closest to your spec" badge highlights quote with nearest system kWp to recommendation.
- **Issue:** The API endpoint selects quotes with `status = 'submitted'`. After a quote is selected, the others become `rejected`. If a customer revisits this page after selecting, they will see 0 quotes because the selected quote also has status changed to `selected` (not `submitted`). There is no handling for this case — the component shows "Your quotes aren't ready yet" which is wrong.

### Step 4 — Selecting a Quote
**Status: ⚠️ Partial**

- `POST /api/quotes/select`: marks quote as `selected`, others as `rejected`, updates job and enquiry status, fetches installer details, sends email to installer.
- **Critical issue:** The API returns full installer details (`company_name`, `contact_name`, `contact_email`, `contact_phone`) immediately after quote selection — BEFORE the customer has paid their deposit. Per the WattSmart USP, installer identity should only be revealed after deposit payment. This is a core anonymity breach.
- The component then shows installer name, email, and phone in a card and prompts deposit payment. Installer is revealed at click of "Choose" — not at payment completion.

### Step 5 — Deposit Payment
**Status: ❌ Broken**

- After selecting, `QuoteComparison` calls `POST /api/payments/create-intent` which creates a Stripe PaymentIntent and returns `clientSecret`.
- **Critical issue:** The component calls the create-intent API but does **nothing with `clientSecret`**. It sets `paymentDone = true` immediately after the fetch, without any Stripe Elements form or payment confirmation. No actual payment is taken. The "Pay deposit" button in `QuoteComparison` is a fake simulation.
- `/customer/checkout` is a **separate hardcoded mock page** with no real Stripe integration — plain HTML card inputs (not Stripe Elements), hardcoded values (`depositAmount = 250`, `quoteLabel = 'B'`, `totalPrice = 8990`), and the pay button just sets `failed = true` to demo the declined-card UI. This page is never reached from the real quote flow.
- `POST /api/payments/confirm` exists and would update payment status to `held` — but it is never called from the frontend (only intended to be called client-side after Stripe SDK confirms payment; that SDK flow is not wired up).
- The Stripe webhook (`/api/webhooks/stripe`) handles `payment_intent.succeeded` and updates payment to `held` — this would work if a real payment were made.

### Step 6 — Post-Payment: Reveal & Job Progress
**Status: ⚠️ Partial**

- `/customer/reveal/[enquiryId]` page exists but was not read in detail.
- `/customer/jobs/[jobId]` is entirely hardcoded mock data: job ref `#WS-2041`, installer "Northside Solar Co.", balance £8,740, dates hardcoded. No DB calls.
- `/customer/jobs/[jobId]/balance` page not read but exists.
- `/customer/jobs/[jobId]/date` and `/customer/jobs/[jobId]/support` exist.
- `/customer/cancel` is partially mocked: `withinCoolingOff = true` is hardcoded. Deposit amount hardcoded at `250`. Cancel button logs no action (no API call).
- `/customer/documents` page exists but not audited in detail.
- `/customer/refund-confirmed` page exists.
- `POST /api/payments/refund` exists (not read in detail).

---

## Installer Journey Audit

### Step 1 — Registration (`/installer/register`)
**Status: ✅ Working**

- `InstallerRegisterForm` submits to `POST /api/installers/register`.
- API creates auth user, resolves base postcode to lat/lng via `postcodes.io`, inserts `installers` record, inserts `certifications`, notifies admin by email.
- Rollback (delete auth user) on DB failure — good defensive coding.
- **Issue:** `installers` table in migration 001 does not have `trading_name`, `base_lat`, `base_lng`, `base_postcode` columns. Migration 002 does not add them either. The register API inserts these columns and will silently fail or error at runtime unless the schema was manually updated outside migrations.
- **Issue:** `installer-matching.ts` lib defines its own `Installer` type with `ProductType = 'solar' | 'heat_pump' | 'battery' | 'ev_charger'` — but the main `types/index.ts` defines `ProductType = 'solar' | 'battery' | 'heatpump' | 'ev'`. These are inconsistent. The lib is not used anywhere in production code (the enquiry submit API does its own matching inline) making it dead code, but the type mismatch is a maintenance hazard.

### Step 2 — Approval
**Status: ✅ Working**

- Pending installer sees "Application under review" holding screen on dashboard.
- Admin can approve via `POST /api/admin/approve-installer` (auth-checked: must be `role = 'admin'`).
- Approval sets status to `active`, sends email to installer.
- `POST /api/admin/reject-installer` also exists.
- **Issue:** There is no automated cert verification flow in the running app. `lib/cert-verification.ts` exists (not audited in detail) and `/api/cron/check-certs` exists, but the admin approve flow does not trigger cert verification — admin manually clicks approve. The `verify-certs` page under admin installer detail is partially rendered with mock data.

### Step 3 — Receiving Briefs
**Status: ✅ Working**

- Active installer dashboard (`/installer/dashboard`) fetches real jobs via Supabase.
- Jobs listed with reference, property type/age, products, deadline.
- Link to submit quote shown for `brief_sent` jobs.
- `GET /api/installers/jobs` exists and strips customer PII (returns `postcode_area` not full postcode). Good.
- **Issue:** The installer dashboard does NOT check `installer.status`. If an installer is `paused` or `rejected`, they still see the dashboard and their jobs. (The pending check is done but paused/rejected is not handled.)

### Step 4 — Submitting a Quote
**Status: ✅ Working**

- `/installer/jobs/[jobId]` fetches job + enquiry details (no customer PII — only property specs).
- `QuoteSubmitForm` submits to `POST /api/quotes/submit`.
- API validates job ownership, assigns label A/B/C based on existing quote count, inserts quote, updates job to `quote_submitted`.
- When 3 quotes received, updates enquiry to `quotes_received` and emails customer.
- **Issue:** If `count` is `null` or 3+, label falls back to `'A'`, which could duplicate labels. `labels[count ?? 0]` with count=3 → `labels[3]` → `undefined || 'A'`. Should be validated.
- **Issue:** `QuoteSubmitForm` was not read in detail; form validation not verified.

### Step 5 — Being Selected
**Status: ⚠️ Partial**

- `POST /api/quotes/select` sends installer an email "you've been chosen."
- Email says "The customer's deposit has been received and is being held securely" — but this email fires on quote selection, BEFORE any deposit is taken. This is misleading/incorrect.
- Installer job page (`/installer/jobs/[jobId]`) shows status — "revealed" status is defined but no explicit reveal step in the job view was found.

### Step 6 — Scheduling & Completion
**Status: ❌ Broken/Mock**

- `/installer/jobs/[jobId]/schedule` page exists with date picker UI but submit button does nothing (sets local `submitted` state, no API call). No API endpoint for proposing dates exists.
- The `jobs` table has `proposed_date`, `date_proposed_at`, `date_accepted_at`, `date_declined_at` columns (added in migration 002) but no API routes for date proposal/acceptance.
- `/installer/fees` is entirely hardcoded mock data (const FEES array).
- `/installer/performance` is hardcoded mock data (metrics hardcoded) with `const userRole = 'member'` — always shows "Access restricted" view regardless of real role.
- `/installer/profile` is entirely hardcoded mock data (company name "Northside Solar Co.", all certs "pending", bank "Barclays ••••4471"). No DB calls.
- `/installer/team` has `const INITIAL_MEMBERS` hardcoded with fake members and `const userRole: Role = 'manager'` always set to manager. The invite functionality calls the real API but the member list is never loaded from DB.
- `/installer/onboarding` exists but was not audited.
- `/installer/cert-expiring` and `/installer/cert-lapsed` pages exist.

### Team Invite Flow
**Status: ⚠️ Partial**

- `POST /api/installers/invite` creates an invite in `installer_invites` table and sends email.
- **Critical issue:** `installer_invites` table is NOT defined in either migration. The route will fail at runtime with a Supabase "relation does not exist" error. Similarly `installer_users` table is not in migrations.
- `GET/POST /api/installers/accept-invite` references `installer_invites` and `installer_users` — same issue.
- `/installer/accept-invite` page exists and calls the real API.
- `/installer/team` page sends real invite API calls but displays only the hardcoded `INITIAL_MEMBERS`.

---

## Anonymity Audit

| Check | Status | Notes |
|---|---|---|
| Customer name/email hidden from installer brief email | ✅ | Brief email contains only postcode area, property type, usage, goal |
| Customer postcode stripped in installer jobs API | ✅ | `GET /api/installers/jobs` returns `postcode_area` not full postcode |
| Installer identity hidden during quote comparison | ✅ | `GET /api/quotes/[enquiryId]` explicitly omits `installer_id`; quotes shown as A/B/C labels only |
| **Installer revealed before deposit payment** | ❌ **CRITICAL** | `POST /api/quotes/select` returns full installer details immediately upon quote selection — company name, contact name, email, phone. This is before any deposit is taken. The core USP is broken here. |
| Review anonymisation | ✅ | Reviews are anonymised via Claude API before storage; `review_text_anonymised` is what customers see |
| Installer terms anonymisation | ⚠️ | UI shows the concept exists (profile page) but no API route for uploading/anonymising T&Cs was found |
| RLS: installers cannot query customer PII | ⚠️ | RLS policy `installers_no_pii_enquiries` on `enquiries` grants SELECT to all installers — they can read full postcode, ownership, electricity_supplier, notes. This is more than what the job brief email exposes. An active installer can query all enquiries. |
| RLS: customers cannot see quotes from other enquiries | ✅ | `quotes_customer_see_blind` policy correctly scopes by enquiry ownership |

---

## Auth/Security Audit

### Middleware
- `src/middleware.ts` → `updateSession()` checks for authenticated user on `/customer/*`, `/installer/*` (except register and accept-invite), and `/admin/*` routes.
- **Issue:** Middleware only checks authentication (user exists), not **role**. An authenticated installer could visit `/customer/dashboard` or `/admin/dashboard` — they would pass the middleware check. Role enforcement is per-page (done correctly on admin pages: `user.user_metadata?.role !== 'admin'`), but not consistent across all pages.
- **Issue:** `/customer/*` routes only check for any logged-in user, not that the user is a customer. An admin user could access customer pages.
- **Issue:** `/installer/*` routes only check for any logged-in user. A customer could visit `/installer/dashboard`.

### Admin API Security
- `POST /api/admin/approve-installer` and reject: correctly check `user.user_metadata?.role !== 'admin'`. ✅
- `GET /api/admin/overview`: same check. ✅
- Admin dashboard page: same check. ✅

### Payments/API Security
- `POST /api/payments/confirm`: **No auth check at all.** Any unauthenticated request with a valid `paymentIntentId` can mark a payment as held. This is a security hole — should be called from Stripe webhook only, or at minimum require admin auth.
- `POST /api/payments/release`: **No auth check.** Any caller with a valid `paymentId` can trigger deposit release and Stripe capture. Serious.
- `POST /api/payments/refund`: Not audited in detail.
- `POST /api/payments/report-final`: Not audited in detail.
- Stripe webhook (`/api/webhooks/stripe`): correctly validates signature with `stripe.webhooks.constructEvent`. ✅

### Installer Registration
- Registration is open to anyone — no invite or gating mechanism for initial signup. Installers go into `pending` state and require admin approval. ✅

### Cron Routes
- `POST /api/cron/quote-deadlines`: No auth check — anyone can POST and trigger deadline processing. Should be protected by a cron secret header.
- `POST /api/cron/check-certs`: Same issue.

### RLS Gaps
- `installers_no_pii_enquiries` on `enquiries` table allows any `installer` role user to SELECT all enquiries. In practice they get full postcode, customer notes, electricity supplier — more than the anonymised brief they should see.
- No RLS restriction prevents one installer from reading another installer's quotes or jobs.
- `quotes_customer_see_blind` allows customer to SELECT any quote for their enquiry including `installer_id` column — the API-level exclusion is the only protection. If a customer queries Supabase directly with their JWT, they can read `installer_id`.

### Input Validation
- Enquiry submit: validates required fields (products, postcode, etc.) — basic checks only, no Zod schema.
- Quote submit: validates required fields — basic checks.
- No CSRF protection beyond Supabase session cookies (Next.js Server Actions would have CSRF built-in; these are API routes using body JSON, no CSRF risk for JSON POST but the signout `<form>` POST to a non-existent route is also unprotected).

---

## Prioritised Issue List

### P1 — Critical (platform-breaking or security)

1. **Installer identity revealed before deposit payment** (`/api/quotes/select` returns installer details immediately). Must delay reveal until `POST /api/payments/confirm` is called successfully. The "installer chosen" email also fires prematurely.

2. **`/customer/checkout` and QuoteComparison deposit flow are both broken mocks.** No real Stripe payment is taken anywhere. `QuoteComparison.handlePayDeposit()` creates a payment intent but discards `clientSecret` and immediately shows "confirmed." Customers cannot actually pay.

3. **`/auth/signout` route does not exist.** The customer dashboard POST form will 404. Customers cannot sign out.

4. **`installer_invites` and `installer_users` tables not in migrations.** The team invite flow (`/api/installers/invite`, `/api/installers/accept-invite`) will fail with DB errors at runtime.

5. **`trading_name`, `base_lat`, `base_lng` columns not in migrations.** Installer registration will fail to insert these fields (Supabase will error if columns don't exist, or silently ignore if not strict).

6. **`POST /api/payments/confirm` and `POST /api/payments/release` have no auth checks.** Any HTTP client can trigger payment state changes or Stripe captures.

7. **Cron routes have no auth protection.** `POST /api/cron/quote-deadlines` and `check-certs` can be triggered by anyone.

### P2 — Important (broken features, wrong behaviour)

8. **Enquiry never reaches `quotes_received` if fewer than 3 quotes submitted.** Customers with 1 or 2 quotes are stuck in `quotes_requested` forever (unless the 3rd installer eventually quotes). The `one-quote` and `no-quotes` edge-case pages exist but are never automatically triggered.

9. **`installer_chosen` email to installer says deposit has been received** — this fires at quote selection, before deposit. Misleading copy that could cause operational confusion.

10. **RLS on `enquiries` gives all active installers read access to full enquiry PII** (postcode, customer notes, electricity supplier). Should be scoped to only jobs assigned to that installer.

11. **RLS: `quotes` table returns `installer_id` to customers via direct Supabase query.** Client-side anonymity depends solely on API-layer exclusion. A customer with their JWT can bypass the API.

12. **`/customer/jobs/[jobId]`** is fully hardcoded. No customer can see their actual job progress.

13. **`/installer/profile`** is fully hardcoded. Installers cannot see or update real profile data.

14. **`/installer/fees`** is fully hardcoded. Overdue fee UI is non-functional.

15. **`/installer/performance`** is fully hardcoded and role check is hardcoded to `'member'` — always blocks access.

16. **`/installer/team`** shows hardcoded members, not real DB data. Invite sends correctly but list never refreshes.

17. **`/installer/jobs/[jobId]/schedule` submit button** does not call any API. Date proposals do not work.

18. **`/customer/cancel`** is hardcoded. Cancel action does not call an API. Refund cannot actually be triggered.

19. **Enquiry submission success screen does not link to dashboard or prompt login.** Customer is left at confirmation with no clear next step.

20. **Middleware role checks missing.** Authenticated users of any role can access any role's protected pages.

### P3 — Nice to have / polish

21. `SmartForm` step counter labels are hardcoded ("3 / 6", "4 / 6") not derived from `step` — step 2 label is skipped entirely.

22. `SmartForm` "Log in to autofill" button has no action.

23. `installer-matching.ts` lib uses different `ProductType` values to main types — dead code with type inconsistency.

24. Quote label assignment falls back to `'A'` if count ≥ 3, potentially creating duplicate labels.

25. `admin/installers/[installerId]` detail page is hardcoded to "Northside Solar Co." — not dynamic.

26. `admin/installers/[installerId]/verify-certs` page was not fully audited but appears to be a manual cert verification UI.

27. The `reviews` table has a unique constraint on `installer_id, source, reviewer_date` (per the upsert) but `reviewer_date` alone is not a reliable unique key per review.

28. No customer-facing sign-up confirmation or login link is sent after enquiry. Customers don't know their account exists.

29. Trustpilot reviews API — the `TRUSTPILOT_API_KEY` env var requirement is not documented; free Trustpilot API access is limited.

30. `lib/cert-verification.ts` exists but its integration with the admin approval flow is unclear — the auto-approve automation_rule is seeded but the triggering mechanism was not found.

---

## Summary

The **enquiry submission → installer matching → quote delivery** flow is substantially implemented and working. The **quote comparison UI** is functional with good anonymity. However, the platform has two critical product failures:

1. **Payment is not wired up at all** — no customer can pay a deposit.
2. **Installer identity is leaked before payment** — the core USP is violated.

Additionally, the **post-deposit journey** (job progress, scheduling, balance payment, completion) and most installer-portal features (profile, fees, performance, team) are prototype/mock UIs with no backend connectivity. The platform as-is could receive enquiries and show quotes, but cannot complete any transaction.

Security requires immediate attention on the payment/cron API routes and the RLS policies for enquiries and quotes.

---

## 2026-06-29 — Security fixes (RLS + middleware + email timing)

### 1. RLS: enquiry access scoped to assigned installers
- Created `supabase/migrations/004_rls_fixes.sql`
- Dropped `installers_no_pii_enquiries` policy (gave all active installers read access to all enquiries)
- Added `installers_assigned_enquiries`: installer can only SELECT an enquiry if a `jobs` row links them to it
- Added `customers_own_quotes`: customers can only SELECT quotes for enquiries they own
- Left a code comment: RLS cannot hide columns, so API layer must strip `installer_id` from customer-facing quote responses

### 2. Middleware: role-based route protection
- Edited `src/lib/supabase/middleware.ts`
- `/customer/*` — requires `role === 'customer'` or no role set (backwards compat)
- `/installer/*` — requires `role === 'installer'` (public paths `/installer/register` and `/installer/accept-invite` still unprotected)
- `/admin/*` — requires `role === 'admin'` (strict — no backwards compat fallback)
- Role mismatches redirect to `/auth/login`, not a 404

### 3. Installer chosen email timing — no change needed
- Verified `src/app/api/quotes/select/route.ts` does NOT call `sendInstallerChosen`
- `sendInstallerChosen` is correctly called only in `src/app/api/payments/reveal/route.ts` after payment confirmation

---

## Customer-Facing Page Fixes — 2026-06-29

### 1. Enquiry success screen — dashboard CTA added
- File: `src/components/forms/SmartForm.tsx`
- Added a "Track your quotes →" button linking to `/customer/dashboard` on the `submitted` success screen
- Added a note explaining the customer has an account with the email they just provided, and a magic link is coming

### 2. /customer/jobs/[jobId] — wired to real data
- File: `src/app/customer/jobs/[jobId]/page.tsx`
- Converted from a static Server Component to an async Server Component using `createClient` + `createAdminClient`
- Fetches job joined to `enquiries` (reference, products, total_price, status) and `installers` (name, contact details)
- Verifies auth session and that `enquiry.customers.user_id === user.id` before rendering — returns 404 otherwise
- Fetches `payments` table for captured deposit amount; derives balance from `total_price - depositAmount`
- Installer contact details only shown when enquiry status is `deposit_paid` or later; otherwise shows "Installer details will appear after deposit is paid"
- Replaced all hardcoded values (job ref, installer name, dates, balance) with real data

### 3. /customer/cancel — cancel button wired to refund API
- File: `src/app/customer/cancel/page.tsx`
- Now reads `paymentId`, `paidAt`, `deposit`, `installerName`, `installerPhone`, `installerEmail` from URL search params
- Cancel button calls `POST /api/payments/refund` with `{ paymentId }` and redirects to `/customer/refund-confirmed` on success
- Cooling-off period derived from `paidAt` param vs now (14-day window)
- Deposit amount and installer details shown from params passed by the caller (e.g. dashboard)
- Added error state with user-friendly message; button shows "Processing…" while loading
- Wrapped in Suspense boundary for `useSearchParams()` compatibility

### 4. Cron job — transition stalled enquiries after 5 days
- File: `src/app/api/cron/quote-deadlines/route.ts`
- After existing expired-job reassignment logic, new block queries enquiries in `quotes_requested` status older than 5 days
- If any such enquiry has ≥1 submitted quote, transitions it to `quotes_received`
- Emails customer via `sendQuotesReady()` using auth admin to look up email from user_id
- Returns `transitioned` count alongside existing `reassigned` count in the response JSON

---

## 2026-06-29 — Wire installer portal pages to real Supabase data

### New API routes created
- `GET /api/installers/team` (`src/app/api/installers/team/route.ts`)
  - Returns `{ members, currentUserRole, companyName }` for the logged-in installer
  - Primary lookup: `installer_users` join; fallback to `installers.user_id` (treats primary holder as manager)
  - Bulk-fetches auth user name/email via admin client `getUserById`
- `GET /api/installers/me` (`src/app/api/installers/me/route.ts`)
  - Returns `{ installer, certifications, currentUserRole, metrics }`
  - Metrics from `jobs` + `quotes` tables; gracefully zeroes if tables absent
- `POST /api/installers/jobs/[jobId]/schedule` (`src/app/api/installers/jobs/[jobId]/schedule/route.ts`)
  - Validates installer owns the job, updates `jobs.proposed_date` + `jobs.date_proposed_at`

### Pages updated
- `/installer/profile` — now fetches real installer record from `/api/installers/me`; shows real company_name/trading_name, contact details, products, certifications (with verified/pending styling), coverage postcodes
- `/installer/team` — removed `INITIAL_MEMBERS` and hardcoded `userRole = 'manager'`; fetches real members + role from `/api/installers/team` on mount
- `/installer/performance` — removed hardcoded `userRole = 'member'`; fetches real role + metrics from `/api/installers/me`; access restriction now works correctly; metrics show real data (zeros gracefully if platform is new); fund figures show "—" until Stripe is connected
- `/installer/jobs/[jobId]/schedule` — submit button now calls `POST /api/installers/jobs/[jobId]/schedule`; shows loading state and surfaces API errors

### Notes
- All four pages handle the "no `installer_users` row yet" case by falling back to `installers.user_id` check and granting manager role
- Fund payouts still show "—" — will need Stripe integration separately
