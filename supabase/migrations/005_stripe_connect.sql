alter table installers add column if not exists stripe_connect_account_id text;
alter table installers add column if not exists stripe_connect_onboarded boolean default false;
