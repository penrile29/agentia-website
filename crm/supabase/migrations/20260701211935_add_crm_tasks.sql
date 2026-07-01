create table public.crm_tasks (
  id text primary key,
  subject text not null,
  status text not null default 'Not Started' check (status in ('Not Started', 'In Progress', 'Waiting', 'Completed', 'Deferred')),
  due_date date,
  description text,
  owner_id text references public.crm_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index crm_tasks_owner_id_idx on public.crm_tasks(owner_id);
create index crm_tasks_status_idx on public.crm_tasks(status);
create index crm_tasks_due_date_idx on public.crm_tasks(due_date);

drop trigger if exists crm_set_updated_at on public.crm_tasks;
create trigger crm_set_updated_at
  before update on public.crm_tasks
  for each row execute function public.crm_set_updated_at();

alter table public.crm_tasks enable row level security;

grant select, insert, update, delete on public.crm_tasks to authenticated, service_role;

create policy "crm_tasks authenticated select"
  on public.crm_tasks for select
  to authenticated
  using (true);

create policy "crm_tasks authenticated insert"
  on public.crm_tasks for insert
  to authenticated
  with check (true);

create policy "crm_tasks authenticated update"
  on public.crm_tasks for update
  to authenticated
  using (true)
  with check (true);

create policy "crm_tasks authenticated delete"
  on public.crm_tasks for delete
  to authenticated
  using (true);
