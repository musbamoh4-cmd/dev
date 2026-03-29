create table if not exists inbound (
  id text primary key,
  record jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists outbound (
  id text primary key,
  record jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists inventory (
  id text primary key,
  record jsonb not null,
  quantity numeric not null,
  created_at timestamptz not null default now()
);
