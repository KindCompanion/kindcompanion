create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  phone text unique,
  name text,
  preferences jsonb default '{}'::jsonb,
  session_context jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists messages (
  id bigserial primary key,
  user_id uuid references users(id) on delete set null,
  phone text,
  role text check (role in ('user','bot')),
  text text,
  ts timestamptz default now(),
  flags text[]
);

create index if not exists idx_messages_userid_ts on messages(user_id, ts);
