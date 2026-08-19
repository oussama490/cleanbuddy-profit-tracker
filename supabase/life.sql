-- Personal life modules: PR tracker + Montréal budget.
-- Safe to re-run. Does not alter daily_entries, product_calculations, or workspace_records.

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
