-- Safe upgrade for an existing Cleanbuddy project.
-- Does not delete daily_entries or product_calculations.

alter table public.daily_entries
  add column if not exists ops jsonb not null default '{}'::jsonb;

alter table public.product_calculations
  add column if not exists ops jsonb not null default '{}'::jsonb;

create table if not exists public.workspace_records (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  title text not null default '',
  body text not null default '',
  amount numeric(14, 4) not null default 0,
  currency text not null default 'CAD'
    check (currency in ('MXN', 'USD', 'CAD')),
  entry_date date,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workspace_records drop constraint if exists workspace_records_kind_check;
alter table public.workspace_records add constraint workspace_records_kind_check
  check (kind in (
    'journal', 'goal', 'cash', 'supplier',
    'checklist', 'bill', 'payout', 'creative', 'review', 'expense', 'shop'
  ));

create index if not exists workspace_records_kind_idx
  on public.workspace_records (kind, created_at desc);

alter table public.workspace_records enable row level security;

drop policy if exists "workspace_records_all" on public.workspace_records;
create policy "workspace_records_all"
  on public.workspace_records
  for all
  using (true)
  with check (true);
