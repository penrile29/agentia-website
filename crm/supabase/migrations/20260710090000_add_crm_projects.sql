create table public.crm_projects (
  id text primary key,
  name text not null,
  account_id text references public.crm_accounts(id) on delete set null,
  opportunity_id text references public.crm_opportunities(id) on delete set null,
  primary_contact_id text references public.crm_contacts(id) on delete set null,
  status text not null default 'Planning' check (status in ('Not Started', 'Planning', 'In Progress', 'Blocked', 'At Risk', 'Completed', 'Cancelled')),
  health text not null default 'Green' check (health in ('Green', 'Yellow', 'Red')),
  start_date date,
  target_go_live_date date,
  actual_go_live_date date,
  deployment_type text not null default 'Production' check (deployment_type in ('Pilot', 'Production', 'Expansion', 'Internal')),
  description text,
  owner_id text references public.crm_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index crm_projects_account_id_idx on public.crm_projects(account_id);
create index crm_projects_opportunity_id_idx on public.crm_projects(opportunity_id);
create index crm_projects_primary_contact_id_idx on public.crm_projects(primary_contact_id);
create index crm_projects_status_idx on public.crm_projects(status);
create index crm_projects_owner_id_idx on public.crm_projects(owner_id);

drop trigger if exists crm_set_updated_at on public.crm_projects;
create trigger crm_set_updated_at
  before update on public.crm_projects
  for each row execute function public.crm_set_updated_at();

alter table public.crm_projects enable row level security;

grant select, insert, update, delete on public.crm_projects to authenticated, service_role;

create policy "crm_projects authenticated select"
  on public.crm_projects for select
  to authenticated
  using (true);

create policy "crm_projects authenticated insert"
  on public.crm_projects for insert
  to authenticated
  with check (true);

create policy "crm_projects authenticated update"
  on public.crm_projects for update
  to authenticated
  using (true)
  with check (true);

create policy "crm_projects authenticated delete"
  on public.crm_projects for delete
  to authenticated
  using (true);

create table public.crm_project_members (
  id text primary key,
  project_id text not null references public.crm_projects(id) on delete cascade,
  user_id text not null references public.crm_users(id) on delete cascade,
  role text not null default 'Project Lead' check (role in ('Project Lead', 'Solution Engineer', 'Developer', 'CSM', 'Sales', 'QA', 'Sponsor')),
  allocation_percent numeric(5, 2) not null default 100 check (allocation_percent >= 0 and allocation_percent <= 100),
  is_active boolean not null default true,
  owner_id text references public.crm_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index crm_project_members_project_user_role_idx on public.crm_project_members(project_id, user_id, role);
create index crm_project_members_project_id_idx on public.crm_project_members(project_id);
create index crm_project_members_user_id_idx on public.crm_project_members(user_id);
create index crm_project_members_owner_id_idx on public.crm_project_members(owner_id);

drop trigger if exists crm_set_updated_at on public.crm_project_members;
create trigger crm_set_updated_at
  before update on public.crm_project_members
  for each row execute function public.crm_set_updated_at();

alter table public.crm_project_members enable row level security;

grant select, insert, update, delete on public.crm_project_members to authenticated, service_role;

create policy "crm_project_members authenticated select"
  on public.crm_project_members for select
  to authenticated
  using (true);

create policy "crm_project_members authenticated insert"
  on public.crm_project_members for insert
  to authenticated
  with check (true);

create policy "crm_project_members authenticated update"
  on public.crm_project_members for update
  to authenticated
  using (true)
  with check (true);

create policy "crm_project_members authenticated delete"
  on public.crm_project_members for delete
  to authenticated
  using (true);

create table public.crm_project_milestones (
  id text primary key,
  project_id text not null references public.crm_projects(id) on delete cascade,
  name text not null,
  status text not null default 'Not Started' check (status in ('Not Started', 'In Progress', 'Blocked', 'Completed', 'Skipped')),
  start_date date,
  due_date date,
  completed_date date,
  sort_order integer not null default 0,
  description text,
  owner_id text references public.crm_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index crm_project_milestones_project_id_idx on public.crm_project_milestones(project_id);
create index crm_project_milestones_status_idx on public.crm_project_milestones(status);
create index crm_project_milestones_due_date_idx on public.crm_project_milestones(due_date);
create index crm_project_milestones_owner_id_idx on public.crm_project_milestones(owner_id);

drop trigger if exists crm_set_updated_at on public.crm_project_milestones;
create trigger crm_set_updated_at
  before update on public.crm_project_milestones
  for each row execute function public.crm_set_updated_at();

alter table public.crm_project_milestones enable row level security;

grant select, insert, update, delete on public.crm_project_milestones to authenticated, service_role;

create policy "crm_project_milestones authenticated select"
  on public.crm_project_milestones for select
  to authenticated
  using (true);

create policy "crm_project_milestones authenticated insert"
  on public.crm_project_milestones for insert
  to authenticated
  with check (true);

create policy "crm_project_milestones authenticated update"
  on public.crm_project_milestones for update
  to authenticated
  using (true)
  with check (true);

create policy "crm_project_milestones authenticated delete"
  on public.crm_project_milestones for delete
  to authenticated
  using (true);

alter table public.crm_tasks
  add column if not exists project_id text references public.crm_projects(id) on delete set null,
  add column if not exists milestone_id text references public.crm_project_milestones(id) on delete set null,
  add column if not exists priority text not null default 'Medium' check (priority in ('Low', 'Medium', 'High', 'Critical')),
  add column if not exists completed_date date,
  add column if not exists blocked_reason text;

create index if not exists crm_tasks_project_id_idx on public.crm_tasks(project_id);
create index if not exists crm_tasks_milestone_id_idx on public.crm_tasks(milestone_id);
create index if not exists crm_tasks_priority_idx on public.crm_tasks(priority);
create index if not exists crm_tasks_completed_date_idx on public.crm_tasks(completed_date);

create table public.crm_task_dependencies (
  id text primary key,
  project_id text references public.crm_projects(id) on delete cascade,
  predecessor_task_id text not null references public.crm_tasks(id) on delete cascade,
  successor_task_id text not null references public.crm_tasks(id) on delete cascade,
  relationship text not null default 'Finish to Start' check (relationship in ('Finish to Start', 'Start to Start', 'Blocks')),
  description text,
  owner_id text references public.crm_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (predecessor_task_id <> successor_task_id)
);

create unique index crm_task_dependencies_pair_idx on public.crm_task_dependencies(predecessor_task_id, successor_task_id);
create index crm_task_dependencies_project_id_idx on public.crm_task_dependencies(project_id);
create index crm_task_dependencies_predecessor_task_id_idx on public.crm_task_dependencies(predecessor_task_id);
create index crm_task_dependencies_successor_task_id_idx on public.crm_task_dependencies(successor_task_id);
create index crm_task_dependencies_owner_id_idx on public.crm_task_dependencies(owner_id);

drop trigger if exists crm_set_updated_at on public.crm_task_dependencies;
create trigger crm_set_updated_at
  before update on public.crm_task_dependencies
  for each row execute function public.crm_set_updated_at();

alter table public.crm_task_dependencies enable row level security;

grant select, insert, update, delete on public.crm_task_dependencies to authenticated, service_role;

create policy "crm_task_dependencies authenticated select"
  on public.crm_task_dependencies for select
  to authenticated
  using (true);

create policy "crm_task_dependencies authenticated insert"
  on public.crm_task_dependencies for insert
  to authenticated
  with check (true);

create policy "crm_task_dependencies authenticated update"
  on public.crm_task_dependencies for update
  to authenticated
  using (true)
  with check (true);

create policy "crm_task_dependencies authenticated delete"
  on public.crm_task_dependencies for delete
  to authenticated
  using (true);
