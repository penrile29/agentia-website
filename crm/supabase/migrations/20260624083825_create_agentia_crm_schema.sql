create extension if not exists citext;

create or replace function public.crm_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.crm_users (
  id text primary key,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  email citext not null unique,
  role text not null default 'Ventas',
  is_admin boolean not null default false,
  password_hash text,
  password_salt text,
  password_updated_at timestamptz,
  owner_id text references public.crm_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.crm_accounts (
  id text primary key,
  name text not null,
  parent_account_id text references public.crm_accounts(id) on delete set null,
  type text not null default 'Prospect',
  industry text not null default 'Other',
  rating text not null default 'Warm',
  phone text,
  website text,
  billing_city text,
  billing_country text,
  description text,
  owner_id text references public.crm_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.crm_contacts (
  id text primary key,
  first_name text,
  last_name text not null,
  account_id text references public.crm_accounts(id) on delete set null,
  title text,
  email citext,
  phone text,
  lead_source text,
  description text,
  owner_id text references public.crm_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.crm_products (
  id text primary key,
  name text not null,
  product_code text not null default '',
  family text not null default 'Agentic Ops',
  revenue_type text not null default 'oneOff' check (revenue_type in ('oneOff', 'mrr')),
  is_active boolean not null default true,
  list_price numeric(14, 2) not null default 0,
  currency_iso_code text not null default 'EUR' check (currency_iso_code = 'EUR'),
  description text,
  owner_id text references public.crm_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.crm_opportunities (
  id text primary key,
  name text not null,
  account_id text references public.crm_accounts(id) on delete set null,
  contact_id text references public.crm_contacts(id) on delete set null,
  stage_name text not null default 'Prospecting',
  close_date date not null,
  one_off_amount numeric(14, 2) not null default 0,
  mrr_amount numeric(14, 2) not null default 0,
  amount numeric(14, 2) not null default 0,
  amount_mode text not null default 'manual' check (amount_mode in ('manual', 'syncProducts', 'syncPrimaryProposal')),
  synced_proposal_id text,
  probability numeric(5, 2) not null default 10,
  type text not null default 'New Business',
  lead_source text,
  currency_iso_code text not null default 'EUR' check (currency_iso_code = 'EUR'),
  description text,
  owner_id text references public.crm_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.crm_leads (
  id text primary key,
  first_name text,
  last_name text not null,
  company text not null,
  status text not null default 'Open - Not Contacted',
  lead_source text not null default 'Web',
  rating text not null default 'Warm',
  email citext,
  phone text,
  website text,
  is_converted boolean not null default false,
  converted_date timestamptz,
  converted_account_id text references public.crm_accounts(id) on delete set null,
  converted_contact_id text references public.crm_contacts(id) on delete set null,
  converted_opportunity_id text references public.crm_opportunities(id) on delete set null,
  description text,
  owner_id text references public.crm_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.crm_opportunity_line_items (
  id text primary key,
  opportunity_id text not null references public.crm_opportunities(id) on delete cascade,
  product_id text not null references public.crm_products(id) on delete restrict,
  revenue_type text not null default 'oneOff' check (revenue_type in ('oneOff', 'mrr')),
  quantity numeric(14, 2) not null default 1,
  unit_price numeric(14, 2) not null default 0,
  discount_percent numeric(5, 2) not null default 0,
  total_price numeric(14, 2) not null default 0,
  service_date date,
  owner_id text references public.crm_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.crm_proposals (
  id text primary key,
  name text not null,
  proposal_number text not null unique,
  opportunity_id text references public.crm_opportunities(id) on delete set null,
  account_id text references public.crm_accounts(id) on delete set null,
  contact_id text references public.crm_contacts(id) on delete set null,
  status text not null default 'Draft',
  expiration_date date,
  total_price numeric(14, 2) not null default 0,
  currency_iso_code text not null default 'EUR' check (currency_iso_code = 'EUR'),
  is_syncing boolean not null default false,
  description text,
  owner_id text references public.crm_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.crm_opportunities
  add constraint crm_opportunities_synced_proposal_id_fkey
  foreign key (synced_proposal_id) references public.crm_proposals(id) on delete set null;

create table public.crm_proposal_line_items (
  id text primary key,
  proposal_id text not null references public.crm_proposals(id) on delete cascade,
  product_id text not null references public.crm_products(id) on delete restrict,
  revenue_type text not null default 'oneOff' check (revenue_type in ('oneOff', 'mrr')),
  quantity numeric(14, 2) not null default 1,
  unit_price numeric(14, 2) not null default 0,
  discount_percent numeric(5, 2) not null default 0,
  total_price numeric(14, 2) not null default 0,
  service_date date,
  owner_id text references public.crm_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.crm_invoices (
  id text primary key,
  invoice_number text not null unique,
  account_id text references public.crm_accounts(id) on delete set null,
  opportunity_id text references public.crm_opportunities(id) on delete set null,
  proposal_id text references public.crm_proposals(id) on delete set null,
  status text not null default 'Draft',
  settlement_status text not null default 'Not Settled',
  invoice_date date not null default current_date,
  due_date date,
  total_amount numeric(14, 2) not null default 0,
  currency_iso_code text not null default 'EUR' check (currency_iso_code = 'EUR'),
  description text,
  owner_id text references public.crm_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.crm_invoice_lines (
  id text primary key,
  invoice_id text not null references public.crm_invoices(id) on delete cascade,
  product_id text references public.crm_products(id) on delete set null,
  description text not null default 'Servicio',
  quantity numeric(14, 2) not null default 1,
  unit_price numeric(14, 2) not null default 0,
  total_amount numeric(14, 2) not null default 0,
  owner_id text references public.crm_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.crm_cases (
  id text primary key,
  case_number text not null unique,
  subject text not null,
  account_id text references public.crm_accounts(id) on delete set null,
  contact_id text references public.crm_contacts(id) on delete set null,
  status text not null default 'New',
  priority text not null default 'Medium',
  origin text not null default 'Email',
  type text not null default 'Question',
  is_escalated boolean not null default false,
  closed_date timestamptz,
  description text,
  owner_id text references public.crm_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.crm_path_steps (
  object_key text not null check (object_key in ('leads', 'opportunities', 'cases')),
  position integer not null,
  value text not null,
  label text not null,
  probability numeric(5, 2),
  is_closed boolean,
  is_won boolean,
  is_converted boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (object_key, value)
);

create index crm_accounts_owner_id_idx on public.crm_accounts(owner_id);
create index crm_contacts_account_id_idx on public.crm_contacts(account_id);
create index crm_leads_owner_id_idx on public.crm_leads(owner_id);
create index crm_opportunities_account_id_idx on public.crm_opportunities(account_id);
create index crm_opportunities_stage_name_idx on public.crm_opportunities(stage_name);
create index crm_opportunities_close_date_idx on public.crm_opportunities(close_date);
create index crm_opportunity_line_items_opportunity_id_idx on public.crm_opportunity_line_items(opportunity_id);
create index crm_proposals_opportunity_id_idx on public.crm_proposals(opportunity_id);
create index crm_proposal_line_items_proposal_id_idx on public.crm_proposal_line_items(proposal_id);
create index crm_invoices_account_id_idx on public.crm_invoices(account_id);
create index crm_invoice_lines_invoice_id_idx on public.crm_invoice_lines(invoice_id);
create index crm_cases_status_idx on public.crm_cases(status);

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'crm_users',
    'crm_accounts',
    'crm_contacts',
    'crm_products',
    'crm_opportunities',
    'crm_leads',
    'crm_opportunity_line_items',
    'crm_proposals',
    'crm_proposal_line_items',
    'crm_invoices',
    'crm_invoice_lines',
    'crm_cases',
    'crm_path_steps'
  ]
  loop
    execute format('drop trigger if exists crm_set_updated_at on public.%I', target_table);
    execute format(
      'create trigger crm_set_updated_at before update on public.%I for each row execute function public.crm_set_updated_at()',
      target_table
    );
    execute format('alter table public.%I enable row level security', target_table);
    execute format('grant select, insert, update, delete on public.%I to authenticated, service_role', target_table);
    execute format('create policy "%s authenticated select" on public.%I for select to authenticated using (true)', target_table, target_table);
    execute format('create policy "%s authenticated insert" on public.%I for insert to authenticated with check (true)', target_table, target_table);
    execute format('create policy "%s authenticated update" on public.%I for update to authenticated using (true) with check (true)', target_table, target_table);
    execute format('create policy "%s authenticated delete" on public.%I for delete to authenticated using (true)', target_table, target_table);
  end loop;
end;
$$;

grant usage on schema public to authenticated, service_role;
grant execute on function public.crm_set_updated_at() to authenticated, service_role;
