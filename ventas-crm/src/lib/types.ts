export const DEAL_STAGES = [
  "lead",
  "qualified",
  "quoted",
  "negotiation",
  "won",
  "lost",
] as const;

export type DealStage = (typeof DEAL_STAGES)[number];

export const STAGE_LABELS: Record<DealStage, string> = {
  lead: "Lead",
  qualified: "Calificado",
  quoted: "Cotizado",
  negotiation: "Negociación",
  won: "Ganado",
  lost: "Perdido",
};

export const STAGE_PROBABILITY: Record<DealStage, number> = {
  lead: 10,
  qualified: 30,
  quoted: 50,
  negotiation: 70,
  won: 100,
  lost: 0,
};

export type Org = {
  id: string;
  name: string;
  currency: string;
  timezone: string;
};

export type Contact = {
  id: string;
  org_id: string;
  account_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  source: string;
  tags: string[];
  notes: string;
  created_at: string;
  account_name?: string | null;
};

export type Account = {
  id: string;
  org_id: string;
  name: string;
  industry: string;
  website: string;
  notes: string;
};

export type Product = {
  id: string;
  org_id: string;
  sku: string;
  name: string;
  description: string;
  unit_price: number | string;
  unit: string;
  category: string;
  active: boolean;
};

export type Deal = {
  id: string;
  org_id: string;
  contact_id: string | null;
  account_id: string | null;
  title: string;
  stage: DealStage;
  amount: number | string;
  currency: string;
  probability: number;
  expected_close: string | null;
  event_date: string | null;
  source: string;
  owner_sub: string;
  notes: string;
  lost_reason: string;
  contact_name?: string | null;
  account_name?: string | null;
};

export type Quote = {
  id: string;
  org_id: string;
  deal_id: string | null;
  contact_id: string | null;
  quote_number: string;
  version: number;
  status: string;
  currency: string;
  subtotal: number | string;
  tax_rate: number | string;
  tax_amount: number | string;
  total: number | string;
  valid_until: string | null;
  notes: string;
  terms: string;
  created_at: string;
  contact_name?: string | null;
  deal_title?: string | null;
};

export type QuoteItem = {
  id: string;
  quote_id: string;
  product_id: string | null;
  description: string;
  quantity: number | string;
  unit_price: number | string;
  line_total: number | string;
  sort_order: number;
};

export type Payment = {
  id: string;
  org_id: string;
  deal_id: string | null;
  quote_id: string | null;
  contact_id: string | null;
  amount: number | string;
  currency: string;
  method: string;
  status: string;
  paid_at: string;
  reference: string;
  notes: string;
  contact_name?: string | null;
  deal_title?: string | null;
};

export type Conversation = {
  id: string;
  org_id: string;
  contact_id: string | null;
  deal_id: string | null;
  channel: string;
  status: string;
  last_message_at: string;
  contact_name?: string | null;
  preview?: string | null;
};

export type Message = {
  id: string;
  conversation_id: string;
  direction: string;
  body: string;
  sender_name: string;
  status: string;
  created_at: string;
};

export type Project = {
  id: string;
  org_id: string;
  deal_id: string | null;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  location: string;
  notes: string;
  deal_title?: string | null;
};

export type AiAction = {
  id: string;
  org_id: string;
  deal_id: string | null;
  contact_id: string | null;
  action_type: string;
  prompt: string;
  proposal: string;
  status: string;
  model: string;
  created_at: string;
};
