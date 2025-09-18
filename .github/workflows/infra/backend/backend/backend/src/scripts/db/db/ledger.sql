create table if not exists ledger (
  id bigserial primary key,
  event_type text,
  amount_gbp numeric(12,2),
  currency text default 'GBP',
  user_id uuid,
  stripe_id text,
  meta jsonb,
  ts timestamptz default now()
);

create index if not exists idx_ledger_ts on ledger(ts);
