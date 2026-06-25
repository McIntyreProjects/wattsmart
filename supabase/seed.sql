-- WattSmart test seed data
-- Run in Supabase SQL editor AFTER creating the auth users below.
--
-- STEP 1: Create auth users via Supabase dashboard or CLI:
--   supabase auth admin create-user \
--     --email customer@test.wattsmart.co.uk \
--     --password TestCustomer123! \
--     --user-metadata '{"role":"customer"}'
--
--   supabase auth admin create-user \
--     --email installer@test.wattsmart.co.uk \
--     --password TestInstaller123! \
--     --user-metadata '{"role":"installer"}'
--
--   supabase auth admin create-user \
--     --email admin@test.wattsmart.co.uk \
--     --password TestAdmin123! \
--     --user-metadata '{"role":"admin"}'
--
-- STEP 2: Run this file in the SQL editor.
-- It uses auth.users to look up the IDs automatically.

-- ─── Helper: get auth user id by email ───────────────────────────────────────
-- (used inline below)

-- ─── CUSTOMERS ───────────────────────────────────────────────────────────────
insert into customers (id, user_id, first_name, last_name, phone, preferred_contact)
select
  '11111111-1111-1111-1111-111111111111'::uuid,
  id,
  'Sarah',
  'Mills',
  '07700 900 001',
  array['email','sms']
from auth.users where email = 'customer@test.wattsmart.co.uk'
on conflict (id) do nothing;

-- ─── INSTALLERS ──────────────────────────────────────────────────────────────
-- Installer 1 — active, solar+battery, North East
insert into installers (
  id, user_id, company_name, companies_house_number,
  contact_name, contact_email, contact_phone, years_trading,
  products, coverage_postcodes,
  status
)
select
  '22222222-2222-2222-2222-222222222222'::uuid,
  id,
  'Northside Solar Co. Ltd',
  '08842210',
  'Daniel Okafor',
  'daniel@northsidesolar.co.uk',
  '0191 555 0142',
  12,
  array['solar','battery'],
  array['NE','DH','SR','TS'],
  'active'
from auth.users where email = 'installer@test.wattsmart.co.uk'
on conflict (id) do nothing;

-- Installer 2 — active, heat pumps + EV, Yorkshire (static — no auth user needed for testing)
insert into installers (
  id, user_id, company_name, companies_house_number,
  contact_name, contact_email, contact_phone, years_trading,
  products, coverage_postcodes,
  status
) values (
  '33333333-3333-3333-3333-333333333333',
  null,
  'Greenvolt Renewables Ltd',
  '11293847',
  'Priya Patel',
  'priya@greenvolt.co.uk',
  '0113 555 0289',
  8,
  array['heat','ev'],
  array['LS','WF','BD','HX','HG'],
  'active'
) on conflict (id) do nothing;

-- Installer 3 — active, all products, wider coverage
insert into installers (
  id, user_id, company_name, companies_house_number,
  contact_name, contact_email, contact_phone, years_trading,
  products, coverage_postcodes,
  status
) values (
  '44444444-4444-4444-4444-444444444444',
  null,
  'Brightwatt Energy Solutions',
  '09182736',
  'Tom Baines',
  'tom@brightwatt.co.uk',
  '0191 555 0388',
  6,
  array['solar','battery','ev'],
  array['NE','DH','SR','TS','YO'],
  'active'
) on conflict (id) do nothing;

-- ─── CERTIFICATIONS ──────────────────────────────────────────────────────────
insert into certifications (installer_id, type, certification_number, status, expires_at, last_checked_at, register_source) values
  ('22222222-2222-2222-2222-222222222222', 'mcs',       'MCS-TEST-0001',   'verified', '2027-04-30', now(), 'test-mode'),
  ('22222222-2222-2222-2222-222222222222', 'recc',      'RECC-TEST-0001',  'verified', '2027-09-30', now(), 'test-mode'),
  ('22222222-2222-2222-2222-222222222222', 'trustmark', 'TM-TEST-0001',    'verified', '2027-12-31', now(), 'test-mode'),
  ('33333333-3333-3333-3333-333333333333', 'mcs',       'MCS-TEST-0001',   'verified', '2027-06-30', now(), 'test-mode'),
  ('33333333-3333-3333-3333-333333333333', 'niceic',    'NICEIC-TEST-0001','verified', '2027-01-31', now(), 'test-mode'),
  ('33333333-3333-3333-3333-333333333333', 'ozev',      'OZEV-TEST-0001',  'verified', '2026-11-30', now(), 'test-mode'),
  ('44444444-4444-4444-4444-444444444444', 'mcs',       'MCS-TEST-0001',   'verified', '2026-11-30', now(), 'test-mode'),
  ('44444444-4444-4444-4444-444444444444', 'recc',      'RECC-TEST-0001',  'verified', '2027-02-28', now(), 'test-mode'),
  ('44444444-4444-4444-4444-444444444444', 'napit',     'NAPIT-TEST-0001', 'verified', '2027-08-31', now(), 'test-mode')
on conflict do nothing;

-- ─── ENQUIRY 1 — comparing quotes (active) ───────────────────────────────────
insert into enquiries (
  id, customer_id, reference, products, postcode,
  property_type, property_age, ownership, roof_type, roof_orientation,
  monthly_elec_kwh, goal, status
) values (
  'eeeeeeee-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'WS-0001',
  array['solar','battery'],
  'DH1 3JZ',
  'Semi-detached',
  '1970s',
  'owned',
  'Pitched',
  'South',
  317,
  'cover',
  'client_deciding'
) on conflict (id) do nothing;

-- Jobs for enquiry 1
insert into jobs (id, enquiry_id, installer_id, status, brief_sent_at, quote_deadline_at)
values
  ('bbbbbbbb-1111-1111-1111-111111111111', 'eeeeeeee-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'quote_submitted', now() - interval '3 days', now() + interval '2 days'),
  ('bbbbbbbb-2222-1111-1111-111111111111', 'eeeeeeee-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'quote_submitted', now() - interval '3 days', now() + interval '2 days'),
  ('bbbbbbbb-3333-1111-1111-111111111111', 'eeeeeeee-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'quote_submitted', now() - interval '3 days', now() + interval '2 days')
on conflict (id) do nothing;

-- Quotes for enquiry 1
insert into quotes (
  id, job_id, enquiry_id, installer_id,
  panel_count, system_kwp, battery_kwh,
  panel_brand, inverter_brand, battery_brand,
  line_items, total_price, deposit_amount, deposit_percentage,
  estimated_install_timeframe, warranty_years, est_annual_saving_pence,
  match_score, label, status
) values
  (
    'cccccccc-1111-1111-1111-111111111111',
    'bbbbbbbb-1111-1111-1111-111111111111',
    'eeeeeeee-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    10, 3.5, 5.0,
    'Sunpower', 'SolarEdge', 'Tesla Powerwall',
    '[{"qty":10,"brand":"Sunpower","model":"Maxeon 6 AC","description":"400W monocrystalline"},{"qty":1,"brand":"Tesla","model":"Powerwall 2","description":"13.5kWh battery"},{"qty":1,"brand":"SolarEdge","model":"SE3680H","description":"3.68kW hybrid inverter"}]',
    842000, 25000, 2.97,
    '2–3 weeks', 25, 95000,
    82, 'A', 'submitted'
  ),
  (
    'cccccccc-2222-1111-1111-111111111111',
    'bbbbbbbb-2222-1111-1111-111111111111',
    'eeeeeeee-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333333',
    10, 3.5, 5.0,
    'Jinko Solar', 'Fronius', 'GivEnergy',
    '[{"qty":10,"brand":"Jinko Solar","model":"Tiger Neo","description":"400W monocrystalline"},{"qty":1,"brand":"GivEnergy","model":"5.0 kWh","description":"Lithium battery storage"},{"qty":1,"brand":"Fronius","model":"Primo 3.5-1","description":"3.5kW string inverter"}]',
    899000, 25000, 2.78,
    '2 weeks', 20, 98000,
    91, 'B', 'submitted'
  ),
  (
    'cccccccc-3333-1111-1111-111111111111',
    'bbbbbbbb-3333-1111-1111-111111111111',
    'eeeeeeee-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444444',
    10, 3.5, 4.0,
    'Canadian Solar', 'SMA', 'Pylontech',
    '[{"qty":10,"brand":"Canadian Solar","model":"HiKu6","description":"415W monocrystalline"},{"qty":1,"brand":"Pylontech","model":"US5000","description":"4.8kWh battery storage"},{"qty":1,"brand":"SMA","model":"Sunny Boy 3.6","description":"3.6kW inverter"}]',
    785000, 25000, 3.18,
    '3 weeks', 20, 88000,
    76, 'C', 'submitted'
  )
on conflict (id) do nothing;

-- ─── ENQUIRY 2 — completed job ────────────────────────────────────────────────
insert into enquiries (
  id, customer_id, reference, products, postcode,
  property_type, property_age, ownership, roof_type, roof_orientation,
  monthly_elec_kwh, goal, status
) values (
  'eeeeeeee-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'WS-0002',
  array['solar'],
  'NE3 4AB',
  'Detached',
  '1990s',
  'owned',
  'Pitched',
  'South-west',
  350,
  'cover',
  'complete'
) on conflict (id) do nothing;

insert into jobs (id, enquiry_id, installer_id, status, brief_sent_at, quote_deadline_at, proposed_date, date_accepted_at)
values (
  'bbbbbbbb-4444-4444-4444-444444444444',
  'eeeeeeee-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222',
  'complete',
  now() - interval '60 days',
  now() - interval '55 days',
  (now() - interval '14 days')::date,
  now() - interval '20 days'
) on conflict (id) do nothing;

insert into quotes (
  id, job_id, enquiry_id, installer_id,
  panel_count, system_kwp, panel_brand, inverter_brand,
  line_items, total_price, deposit_amount, deposit_percentage,
  estimated_install_timeframe, warranty_years, est_annual_saving_pence,
  match_score, label, status, selected_at
) values (
  'cccccccc-4444-4444-4444-444444444444',
  'bbbbbbbb-4444-4444-4444-444444444444',
  'eeeeeeee-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222',
  12, 4.2, 'Sunpower', 'SolarEdge',
  '[{"qty":12,"brand":"Sunpower","model":"Maxeon 6","description":"400W monocrystalline"},{"qty":1,"brand":"SolarEdge","model":"SE4000H","description":"4kW inverter"}]',
  698000, 25000, 3.58,
  '2 weeks', 25, 82000,
  88, 'A', 'selected', now() - interval '50 days'
) on conflict (id) do nothing;

insert into payments (
  id, enquiry_id, quote_id, installer_id,
  type, amount, wattsmart_fee, installer_amount,
  stripe_payment_intent_id, payment_method, status, paid_at
) values
  (
    'dddddddd-1111-1111-1111-111111111111',
    'eeeeeeee-2222-2222-2222-222222222222',
    'cccccccc-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222222',
    'deposit', 25000, 1250, 23750,
    'pi_test_deposit_001', 'platform', 'released', now() - interval '50 days'
  ),
  (
    'dddddddd-2222-2222-2222-222222222222',
    'eeeeeeee-2222-2222-2222-222222222222',
    'cccccccc-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222222',
    'final', 673000, 33650, 639350,
    'pi_test_balance_001', 'platform', 'released', now() - interval '15 days'
  )
on conflict (id) do nothing;

-- Documents for completed job
insert into documents (enquiry_id, installer_id, type, filename, storage_path, uploaded_by, visible_to_customer) values
  ('eeeeeeee-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'quote',           'Quote-WS0002-A.pdf',        'test/quote-ws0002.pdf',    'system',    true),
  ('eeeeeeee-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'deposit_receipt', 'Deposit-receipt-WS0002.pdf','test/deposit-ws0002.pdf',  'system',    true),
  ('eeeeeeee-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'survey_report',   'Survey-report-WS0002.pdf',  'test/survey-ws0002.pdf',   'installer', true),
  ('eeeeeeee-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'dno_approval',    'G99-approval-WS0002.pdf',   'test/g99-ws0002.pdf',      'installer', true),
  ('eeeeeeee-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'mcs_cert',        'MCS-cert-WS0002.pdf',       'test/mcs-ws0002.pdf',      'installer', true),
  ('eeeeeeee-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'electrical_cert', 'EIC-WS0002.pdf',            'test/eic-ws0002.pdf',      'installer', true),
  ('eeeeeeee-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'final_invoice',   'Invoice-WS0002.pdf',        'test/invoice-ws0002.pdf',  'system',    true)
on conflict do nothing;

-- ─── SAMPLE REVIEWS for installer 1 ──────────────────────────────────────────
insert into reviews (installer_id, source, rating, review_text, review_text_anonymised, reviewer_date, product_mentioned, confidence_score) values
  (
    '22222222-2222-2222-2222-222222222222',
    'google', 5,
    'Northside Solar were brilliant — Daniel explained everything clearly and the install was done in a day. Really tidy work.',
    '[installer] were brilliant — [name] explained everything clearly and the install was done in a day. Really tidy work.',
    '2026-04-12', 'solar', 0.98
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'trustpilot', 5,
    'I got three quotes through WattSmart and Northside came in with the best spec. On time, clean, and the app was great for tracking progress.',
    'I got three quotes through WattSmart and [installer] came in with the best spec. On time, clean, and the app was great for tracking progress.',
    '2026-03-28', 'solar', 0.97
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'google', 4,
    'Good installation, took slightly longer than quoted but the quality is excellent. Would use again.',
    'Good installation, took slightly longer than quoted but the quality is excellent. Would use again.',
    '2026-02-14', 'battery', 1.0
  )
on conflict do nothing;
