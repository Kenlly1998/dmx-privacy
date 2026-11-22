-- Features inspired by HubSpot / Pipedrive / Kommo

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  due_at timestamptz,
  status text not null default 'open',
  priority text not null default 'normal',
  deal_id uuid references deals(id) on delete set null,
  contact_id uuid references contacts(id) on delete set null,
  owner_sub text not null default '',
  notes text not null default '',
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists message_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  channel text not null default 'whatsapp',
  body text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_tasks_org_status on tasks(org_id, status);
create index if not exists idx_tasks_due on tasks(org_id, due_at);
create index if not exists idx_templates_org on message_templates(org_id);
create index if not exists idx_activity_org_created on activity_log(org_id, created_at desc);
create index if not exists idx_accounts_org_name on accounts(org_id, name);
