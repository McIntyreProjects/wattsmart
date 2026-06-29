# WattSmart Installer Onboarding — UX Audit & Checklist

_Produced by Installer Growth & Engagement Team · June 2026_

---

## Current Flow Overview

There are two separate flows in the codebase with overlapping intent:

| Flow | Path | State |
|---|---|---|
| Registration form | `/installer/register` via `InstallerRegisterForm.tsx` | Connected to Supabase API (`/api/installers/register`). This appears to be the live public-facing flow. |
| Onboarding wizard | `/installer/onboarding/page.tsx` | A UI prototype/mockup. Data is not wired to any API. Step 5 (T&Cs) is not persisted. This page is currently unreachable from any nav link in the codebase. |

The registration form is the authoritative live flow. The onboarding page appears to be a design prototype that predates or runs parallel to the registration form, with the additional benefit of a sidebar progress indicator and a Terms & Conditions sign-off step.

---

## Audit: What's There

### Registration Form (InstallerRegisterForm.tsx) — 5 Steps

**Step 1 — Business Details**
- Company name (with Companies House guidance note)
- Trading name (with explanation of what customers will see)
- Companies House number (optional)
- Contact name, email, phone
- Base postcode
- Years trading

_Assessment: Good. The Companies House / Trading Name logic is well-handled. The explanation "this is what customers will see" is helpful._

**Step 2 — Products**
- Toggle selection: Solar panels, Battery storage, Heat pumps, EV chargers
- Each shows the certification requirement inline

_Assessment: Clean. Cert requirement text next to each product is a useful primer. No "none of the above" or "other" option — not a problem given the current product scope._

**Step 3 — Certification Numbers**
- Dynamically renders required cert fields based on product selection
- Required certs must be filled to proceed
- Optional certs can be added from a predefined list (TrustMark, NAPIT, Gas Safe, F-Gas, HIES, ELECSA, Other)
- Each cert field has an optional certificate upload (PDF/image)
- Upload is UI-only (no backend handler observed)
- Tip callout encouraging upload for faster verification

_Assessment: Strong design — dynamic cert fields based on product choice is correct. Weakness: the file upload has no backend. Uploaded files are silently dropped. This undermines the "upload to speed up verification" promise._

**Step 4 — Coverage Area**
- Free-text postcode area input (e.g. "NE, DH, SR")
- Optional Google Business name
- Optional Trustpilot URL

_Assessment: The free-text postcode entry is fragile. Installers will enter inconsistent formats ("NE1, NE2" vs "NE" vs "Newcastle"). No validation. The onboarding mockup had a better approach: postcode districts plus a radius selector. Also missing: coverage by product (a company might do solar across 6 districts but ASHP only in 2)._

**Step 5 — Password & Review**
- Password creation with confirmation
- Summary review of: company name, trading name, name shown to customers, email, products, coverage
- Submit button → POST to `/api/installers/register`

_Assessment: The review summary is good but sparse. It doesn't show the MCS number entered, the base postcode, or the cert verification status. Installers would benefit from seeing exactly what they submitted before hitting send._

### Post-Submission State
- Shows a "Application submitted" screen with a checkmark
- Says "We'll review your certifications and be in touch by email once your account is approved"

_Assessment: The message is clear. But there's no email confirmation sent (not observable in the frontend — would need to check the API route). The dashboard shows a "pending" state correctly, but there is no link from the submission screen to the dashboard — the installer is stranded._

### Dashboard (pending state)
- Shows "Application under review — we'll email you once approved, usually within 48 hours"
- Clean but minimal. No call to action. No progress indicator. No "while you wait" content.

### Profile Page (post-approval)
- Logo upload UI
- Services section (locked pending cert verification, shows amber warning)
- Certifications section (shows pending status per cert)
- T&C upload for their own installer terms
- Coverage editing
- Balance payment timing preference
- Payout account (Barclays ••••4471 — hardcoded, not dynamic)

_Assessment: Profile page is mostly UI scaffolding. Payout account is hardcoded. T&C upload (their own terms to share with customers) is a thoughtful differentiator but the backend is unclear. The "Preview anonymised version" button is non-functional._

---

## Audit: What's Missing or Confusing

### Critical Gaps (block go-live)

1. **Certificate upload has no backend.** The upload widget renders, but files are not sent to the API route (`/api/installers/register`). The form body is JSON-only. This means the "upload to speed up verification" call to action is broken and the verification team has no docs to check.

2. **No email confirmation on registration.** After submit, the installer has no email receipt. If they close the browser, they have no record of applying and no way back in without resetting a password they just created.

3. **No link from post-submit screen to dashboard.** The success screen is a dead end. The installer should be taken to (or linked to) `/installer/dashboard` immediately.

4. **Payout account setup is missing.** The profile page shows a hardcoded Barclays account. There is no flow for an installer to add their bank details or connect Stripe. Without this, they cannot receive payment when a job completes.

5. **Terms & Conditions agreement is not in the live registration flow.** The onboarding mockup has a full T&C sign-off (scroll-to-read, electronic signature with timestamp). The live registration form (the one connected to Supabase) has no T&C step at all. This is a legal and commercial gap — installers need to have agreed to terms before they can quote.

6. **The onboarding page (`/installer/onboarding`) is unreachable.** It has no nav links, no route from register or dashboard, and is a non-functional UI prototype. It should either be wired up or removed.

### Significant UX Gaps

7. **Coverage area free-text is unvalidated.** Installers will enter it differently every time. This will cause matching errors. Needs a structured input: postcode district multi-select or a radius + base postcode combination (as seen in the onboarding mockup).

8. **No coverage-by-product configuration.** A multi-tech installer covering solar across 8 districts but ASHP only in 2 cannot express this. The coverage setting is a single field applied to all products.

9. **No password strength indicator or minimum requirements stated.** Step 5 asks for a password with no guidance. Weak passwords will be common.

10. **Cert number format validation is missing.** MCS numbers follow a predictable format (e.g. `NAP-XXXX-XXXX`). RECC numbers follow another. There is no validation or format hint beyond a placeholder. An installer who mistypes their number will have their account stuck in verification indefinitely.

11. **No "what happens next" explanation at the end of registration.** After the cert check, what triggers? What does approval look like? How long does each product take to verify? The post-submission screen says "we'll be in touch" but gives no process clarity.

12. **Companies House lookup not automated.** The form asks for a Companies House number as optional, but doesn't auto-fill company name or validate the number against the CH API. A lookup would catch typos and pre-fill data.

13. **No mobile responsiveness audit.** The onboarding mockup uses a sidebar layout (`w-56` fixed) that breaks on mobile. The registration form should be verified on mobile — many sole traders will register from their phone.

14. **Duplicate/conflicting flows.** Having both `/installer/register` and `/installer/onboarding` creates confusion. The onboarding page needs to be clearly deprecated, wired up, or merged into the registration flow.

### Minor / Polish

15. The "certName" state in `CertField` for "Other" certs is local component state and is never sent to the API. The custom cert name is lost on submit.

16. The optional cert picker uses a `<select>` that immediately closes after one selection. The pattern works but feels clunky — a checklist might be friendlier.

17. Step 4 asks for Google Business name and Trustpilot URL — these feel out of place in a coverage step. They'd sit better in a profile completion flow after approval.

---

## Ideal Onboarding Checklist

This is the full list of steps an installer must complete before they can receive job briefs and submit quotes. Steps marked **[Gate]** should block access to leads until complete.

### Phase 1 — Application (Public, Before Account Approval)

- [ ] **[Gate]** Company name and trading name submitted
- [ ] **[Gate]** Contact name, email, phone submitted
- [ ] **[Gate]** Base postcode submitted
- [ ] **[Gate]** At least one product selected
- [ ] **[Gate]** Required certification numbers entered for selected products
- [ ] Certificate documents uploaded (optional but accelerates verification)
- [ ] Coverage area defined (postcode districts or radius)
- [ ] Password created
- [ ] **[Gate]** Terms of Service agreed and electronically signed (with timestamp)
- [ ] Email confirmation received and link clicked (verify email address)

### Phase 2 — Admin Review (Manual, Internal)

- [ ] MCS number cross-checked against MCS register
- [ ] RECC/HIES number cross-checked
- [ ] NICEIC/OZEV checked for EV-only installers
- [ ] Companies House number verified (if provided)
- [ ] Account status set to `approved`
- [ ] Approval email sent to installer with login link

### Phase 3 — Post-Approval Profile Completion (In Portal)

- [ ] **[Gate for receiving leads]** At least one product service enabled (auto-unlocks after cert approval)
- [ ] **[Gate for receiving payment]** Bank account / Stripe payout details added
- [ ] **[Gate for quoting]** Own installer T&Cs uploaded (or confirmed they will use WattSmart standard terms)
- [ ] Coverage area reviewed and confirmed
- [ ] Logo uploaded (optional but improves trust when customer reveals selection)
- [ ] Trustpilot / Google Business URL added (optional — surfaces in customer view)
- [ ] Balance payment timing preference set
- [ ] Team members invited (if applicable)

### Phase 4 — First Brief (Activation Milestone)

- [ ] First job brief received
- [ ] Brief read and acknowledged
- [ ] Quote submitted (this is the activation milestone — installer is now truly engaged)

---

## Dev Backlog — Flagged Issues

| Priority | Item | Notes |
|---|---|---|
| P0 | Wire up certificate file upload to API | Currently silently dropped. Frontend uses hidden `<input type="file">` but JSON body doesn't include files. Need multipart form or pre-signed S3 upload. |
| P0 | Add Terms & Conditions agreement step to live registration | The T&C step exists only in the non-wired onboarding mockup. Registration has no T&C. Legal exposure until fixed. |
| P0 | Send email confirmation on registration | With a verification link or at minimum a "your application was received" confirmation. |
| P0 | Add Stripe/bank account setup flow | Payout account on profile is hardcoded. Installers cannot receive money without this. |
| P0 | Link success screen to dashboard | Post-submit dead end. Add "Track your application →" link to `/installer/dashboard`. |
| P1 | Replace free-text coverage with structured postcode district selector | Multi-select postcode districts + optional radius from base postcode. Validate against known UK district codes. |
| P1 | Add password strength requirements | Show minimum rules (length, special char) and a strength bar. |
| P1 | Add MCS number format validation | Client-side regex for known cert number formats. Show hint on mismatch. |
| P1 | Fix "Other" cert name not being sent to API | `certName` state in CertField is local and never serialised. |
| P1 | Cover-by-product configuration | Allow installers to set different coverage areas per product type. |
| P2 | Companies House lookup via API | Auto-validate CH number and pre-fill registered company name. |
| P2 | Add "what happens next" screen after submission | Timeline: email confirmation → cert verification (1 working day) → approval email → portal access. |
| P2 | Pending dashboard — add "while you wait" content | Suggest they prepare logo, T&Cs doc, bank details. Keep them engaged during the review window. |
| P2 | Deprecate or wire `/installer/onboarding` | Either integrate it into the live flow or remove it to avoid confusion. |
| P3 | Move Google Business / Trustpilot to post-approval profile | Out of place in the coverage step. Better as a profile completion prompt after approval. |
| P3 | Mobile audit of registration form | Particularly Step 1 (long scroll) and Step 3 (nested cert cards). |
