-- Reventa, agenda, facturación SUNAT, adjuntos, automatización

alter table accounts add column if not exists account_type text not null default 'customer';
-- customer | supplier | both

alter table products add column if not exists brand text not null default '';
alter table products add column if not exists supplier_account_id uuid references accounts(id) on delete set null;
alter table products add column if not exists cost_price numeric(12,2) not null default 0;
alter table products add column if not exists tax_affect text not null default 'gravado';
-- gravado | exonerado | inafecto

alter table quote_items add column if not exists cost_price numeric(12,2) not null default 0;

create table if not exists calendar_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  event_type text not null default 'job',
  -- job | training | delivery | meeting | other
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text not null default '',
  deal_id uuid references deals(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  contact_id uuid references contacts(id) on delete set null,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  deal_id uuid references deals(id) on delete set null,
  quote_id uuid references quotes(id) on delete set null,
  contact_id uuid references contacts(id) on delete set null,
  doc_type text not null default 'boleta',
  -- boleta | factura | nota_credito
  series text not null default 'B001',
  number text not null default '',
  currency text not null default 'PEN',
  subtotal numeric(12,2) not null default 0,
  igv numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  customer_doc_type text not null default '1',
  -- 1 DNI | 6 RUC
  customer_doc_number text not null default '',
  customer_name text not null default '',
  status text not null default 'draft',
  -- draft | queued | accepted | rejected | demo
  sunat_ticket text not null default '',
  pdf_url text not null default '',
  xml_url text not null default '',
  cdr_status text not null default '',
  provider text not null default 'demo_pse',
  payload jsonb not null default '{}',
  issued_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  cost_price numeric(12,2) not null default 0,
  line_total numeric(12,2) not null default 0,
  sort_order int not null default 0
);

create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  file_name text not null,
  file_url text not null default '',
  content_type text not null default 'text/plain',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_products_brand on products(org_id, brand);
create index if not exists idx_calendar_org_starts on calendar_events(org_id, starts_at);
create index if not exists idx_invoices_org on invoices(org_id, created_at desc);
create index if not exists idx_attachments_entity on attachments(org_id, entity_type, entity_id);
