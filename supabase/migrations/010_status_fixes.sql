-- Migration 010: status fixes + deposit-email idempotency
--
-- 1. The app writes jobs.status = 'install_scheduled' (customer accepts an
--    install date) and 'install_complete' (installer marks the install done),
--    and the UI reads both, but the 001 check constraint doesn't allow them —
--    every such update failed silently at the DB layer. Extend the constraint
--    rather than shoehorning into 'installation_confirmed'/'complete'.
--
-- 2. payments.emails_sent_at: claim column so the deposit-confirmation emails
--    are sent exactly once whichever path (Stripe webhook or /api/payments/
--    reveal) confirms the payment first. A path "claims" the send with
--    UPDATE ... WHERE emails_sent_at IS NULL RETURNING; only the claimer sends.

alter table jobs drop constraint if exists jobs_status_check;
alter table jobs add constraint jobs_status_check check (status in (
  'brief_sent','quote_submitted','quote_selected','revealed',
  'survey_booked','install_scheduled','installation_confirmed',
  'install_complete','complete','withdrawn'
));

alter table payments add column if not exists emails_sent_at timestamptz;
