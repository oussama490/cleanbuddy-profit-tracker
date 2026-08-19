-- Cleanbuddy profit tracker
-- Run this in the Supabase SQL editor.
-- Safe to re-run: existing daily/product data is kept.
-- Adds workspace_records for journal, goals, cash, and suppliers.
-- Adds jobs, pr_criteria, personal_budget for the personal life modules.

create table if not exists public.daily_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null unique,
  new_orders integer not null default 0 check (new_orders >= 0),
  confirmed integer not null default 0 check (confirmed >= 0),
  delivered integer not null default 0 check (delivered >= 0),
  returned integer not null default 0 check (returned >= 0),
  revenue_amount numeric(14, 4) not null default 0,
  revenue_currency text not null default 'MXN'
    check (revenue_currency in ('MXN', 'USD', 'CAD')),
  ads_cost_amount numeric(14, 4) not null default 0,
  ads_cost_currency text not null default 'USD'
    check (ads_cost_currency in ('MXN', 'USD', 'CAD')),
  exchange_rate_snapshot jsonb not null,
  ops jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_calculations (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  supplier_cost_amount numeric(14, 4) not null default 0,
  supplier_cost_currency text not null default 'MXN'
    check (supplier_cost_currency in ('MXN', 'USD', 'CAD')),
  shipping_cost_amount numeric(14, 4) not null default 0,
  shipping_cost_currency text not null default 'MXN'
    check (shipping_cost_currency in ('MXN', 'USD', 'CAD')),
  dropi_commission_pct numeric(8, 4) not null default 0,
  sale_price_amount numeric(14, 4) not null default 0,
  sale_price_currency text not null default 'MXN'
    check (sale_price_currency in ('MXN', 'USD', 'CAD')),
  ads_cost_per_order_amount numeric(14, 4) not null default 0,
  ads_cost_per_order_currency text not null default 'USD'
    check (ads_cost_per_order_currency in ('MXN', 'USD', 'CAD')),
  exchange_rate_snapshot jsonb not null,
  ops jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists daily_entries_entry_date_idx
  on public.daily_entries (entry_date desc);

create index if not exists product_calculations_created_at_idx
  on public.product_calculations (created_at desc);

alter table public.daily_entries enable row level security;
alter table public.product_calculations enable row level security;

drop policy if exists "daily_entries_all" on public.daily_entries;
create policy "daily_entries_all"
  on public.daily_entries
  for all
  using (true)
  with check (true);

drop policy if exists "product_calculations_all" on public.product_calculations;
create policy "product_calculations_all"
  on public.product_calculations
  for all
  using (true)
  with check (true);

-- Personal workspace: journal, goals, cash movements, suppliers
create table if not exists public.workspace_records (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in (
    'journal', 'goal', 'cash', 'supplier',
    'checklist', 'bill', 'payout', 'creative', 'review', 'expense', 'shop'
  )),
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

create index if not exists workspace_records_kind_idx
  on public.workspace_records (kind, created_at desc);

alter table public.workspace_records enable row level security;

drop policy if exists "workspace_records_all" on public.workspace_records;
create policy "workspace_records_all"
  on public.workspace_records
  for all
  using (true)
  with check (true);

-- Personal life: Express Entry jobs + Montréal budget (see also supabase/life.sql)
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  job_title text not null,
  employer text not null default '',
  start_date date not null,
  end_date date,
  noc_code text not null default '',
  teer text not null default '3'
    check (teer in ('0', '1', '2', '3', '4', '5')),
  hours_per_week numeric(8, 2) not null default 0 check (hours_per_week >= 0),
  hourly_wage numeric(14, 4) not null default 0 check (hourly_wage >= 0),
  annual_salary numeric(14, 4) not null default 0 check (annual_salary >= 0),
  wage_currency text not null default 'CAD'
    check (wage_currency in ('MXN', 'USD', 'CAD')),
  status text not null default 'active'
    check (status in ('active', 'ended', 'pending')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_start_date_idx
  on public.jobs (start_date desc);

create table if not exists public.pr_criteria (
  id uuid primary key default gen_random_uuid(),
  age integer not null default 0 check (age >= 0 and age <= 120),
  education_level text not null default 'bachelor'
    check (education_level in (
      'high_school', 'one_year', 'two_year', 'bachelor',
      'two_or_more', 'master', 'phd'
    )),
  french_clb integer not null default 0 check (french_clb >= 0 and french_clb <= 12),
  english_clb integer not null default 0 check (english_clb >= 0 and english_clb <= 12),
  experience_months_override integer check (experience_months_override is null or experience_months_override >= 0),
  current_status text not null default 'pgwp',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.personal_budget (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null,
  category text not null
    check (category in ('transport', 'food', 'housing', 'gym', 'leisure', 'other')),
  amount numeric(14, 4) not null default 0 check (amount >= 0),
  currency text not null default 'CAD'
    check (currency in ('MXN', 'USD', 'CAD')),
  income_source text not null default 'other'
    check (income_source in ('job', 'dropshipping', 'other')),
  job_id uuid references public.jobs (id) on delete set null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists personal_budget_entry_date_idx
  on public.personal_budget (entry_date desc);

alter table public.jobs enable row level security;
alter table public.pr_criteria enable row level security;
alter table public.personal_budget enable row level security;

drop policy if exists "jobs_all" on public.jobs;
create policy "jobs_all"
  on public.jobs
  for all
  using (true)
  with check (true);

drop policy if exists "pr_criteria_all" on public.pr_criteria;
create policy "pr_criteria_all"
  on public.pr_criteria
  for all
  using (true)
  with check (true);

drop policy if exists "personal_budget_all" on public.personal_budget;
create policy "personal_budget_all"
  on public.personal_budget
  for all
  using (true)
  with check (true);
