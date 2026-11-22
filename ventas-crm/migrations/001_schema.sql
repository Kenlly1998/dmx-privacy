-- Ventas CRM core schema

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency text not null default 'USD',
  timezone text not null default 'America/Lima',
  created_at timestamptz not null default now()
);

create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_sub text not null,
  email text not null default '',
  display_name text not null default '',
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  unique (org_id, user_sub)
);

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  industry text not null default '',
  website text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  account_id uuid references accounts(id) on delete set null,
  full_name text not null,
  email text not null default '',
  phone text not null default '',
  source text not null default 'manual',
  tags text[] not null default '{}',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  sku text not null default '',
  name text not null,
  description text not null default '',
  unit_price numeric(12,2) not null default 0,
  unit text not null default 'unidad',
  category text not null default 'general',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  account_id uuid references accounts(id) on delete set null,
  title text not null,
  stage text not null default 'lead',
  amount numeric(12,2) not null default 0,
  currency text not null default 'USD',
  probability int not null default 10,
  expected_close date,
  event_date date,
  source text not null default 'manual',
  owner_sub text not null default '',
  notes text not null default '',
  lost_reason text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  deal_id uuid references deals(id) on delete set null,
  contact_id uuid references contacts(id) on delete set null,
  quote_number text not null,
  version int not null default 1,
  status text not null default 'draft',
  currency text not null default 'USD',
  subtotal numeric(12,2) not null default 0,
  tax_rate numeric(5,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  valid_until date,
  notes text not null default '',
  terms text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  accepted_at timestamptz
);

create table if not exists quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  line_total numeric(12,2) not null default 0,
  sort_order int not null default 0
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  deal_id uuid references deals(id) on delete set null,
  quote_id uuid references quotes(id) on delete set null,
  contact_id uuid references contacts(id) on delete set null,
  amount numeric(12,2) not null,
  currency text not null default 'USD',
  method text not null default 'transfer',
  status text not null default 'confirmed',
  paid_at date not null default current_date,
  reference text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  deal_id uuid references deals(id) on delete set null,
  channel text not null,
  external_thread_id text not null default '',
  status text not null default 'open',
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  direction text not null,
  body text not null,
  sender_name text not null default '',
  external_id text not null default '',
  status text not null default 'delivered',
  created_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  deal_id uuid references deals(id) on delete set null,
  name text not null,
  status text not null default 'planned',
  start_date date,
  end_date date,
  location text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  due_date date,
  sort_order int not null default 0
);

create table if not exists ai_actions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  deal_id uuid references deals(id) on delete set null,
  contact_id uuid references contacts(id) on delete set null,
  action_type text not null,
  prompt text not null default '',
  proposal text not null,
  status text not null default 'pending',
  model text not null default 'grok',
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  summary text not null,
  actor_sub text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists integration_settings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  provider text not null,
  enabled boolean not null default false,
  config jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  unique (org_id, provider)
);

create index if not exists idx_contacts_org on contacts(org_id);
create index if not exists idx_deals_org_stage on deals(org_id, stage);
create index if not exists idx_quotes_org on quotes(org_id);
create index if not exists idx_payments_org on payments(org_id);
create index if not exists idx_messages_conversation on messages(conversation_id);
create index if not exists idx_conversations_org on conversations(org_id);
create index if not exists idx_memberships_user on memberships(user_sub);
