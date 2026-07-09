alter table public.crm_tasks
  add column if not exists account_id text references public.crm_accounts(id) on delete set null,
  add column if not exists contact_id text references public.crm_contacts(id) on delete set null,
  add column if not exists opportunity_id text references public.crm_opportunities(id) on delete set null;

create index if not exists crm_tasks_account_id_idx on public.crm_tasks(account_id);
create index if not exists crm_tasks_contact_id_idx on public.crm_tasks(contact_id);
create index if not exists crm_tasks_opportunity_id_idx on public.crm_tasks(opportunity_id);
