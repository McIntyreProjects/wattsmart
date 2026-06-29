-- Migration 004: RLS fixes — tighten enquiry and quote access

-- ============================================================
-- 1. ENQUIRIES: restrict installer access to assigned jobs only
-- ============================================================

-- Drop the overly-broad policy that let all active installers read all enquiries
drop policy if exists "installers_no_pii_enquiries" on enquiries;

-- New policy: installers can only SELECT an enquiry if they have a job for it
create policy "installers_assigned_enquiries" on enquiries
  for select using (
    exists (
      select 1
      from jobs j
      join installers i on i.id = j.installer_id
      where j.enquiry_id = enquiries.id
        and i.user_id = auth.uid()
    )
  );

-- ============================================================
-- 2. QUOTES: customers may only read quotes for their own enquiries
-- ============================================================

-- Drop any existing customer quotes SELECT policy before recreating
drop policy if exists "customers_own_quotes" on quotes;

-- Customers can SELECT quotes only for enquiries they own.
-- NOTE: RLS cannot hide individual columns, so the API layer MUST strip
-- installer_id from any quote response sent to customers. This policy
-- constrains which rows are visible; stripping installer_id is enforced
-- in the application (e.g. /api/quotes and any customer-facing endpoints).
create policy "customers_own_quotes" on quotes
  for select using (
    exists (
      select 1
      from enquiries e
      join customers c on c.id = e.customer_id
      where e.id = quotes.enquiry_id
        and c.user_id = auth.uid()
    )
  );
