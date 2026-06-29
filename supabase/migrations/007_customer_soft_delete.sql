-- Add soft-delete support to customers table
alter table customers add column if not exists deleted_at timestamptz;
