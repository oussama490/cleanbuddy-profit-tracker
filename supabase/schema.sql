-- Cleanbuddy profit tracker
-- Run this in the Supabase SQL editor.

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
