-- Add confirmed_date and customer_suggested_date to jobs
alter table jobs
  add column if not exists confirmed_date date,
  add column if not exists customer_suggested_date date;
