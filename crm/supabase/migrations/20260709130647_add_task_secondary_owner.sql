alter table public.crm_tasks
  add column if not exists secondary_owner_id text references public.crm_users(id) on delete set null;

create index if not exists crm_tasks_secondary_owner_id_idx on public.crm_tasks(secondary_owner_id);
