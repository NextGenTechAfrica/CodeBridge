// src/lib/db/schema.ts

export const CREATE_TABLES_SQL = `
-- Countries table (multi-country architecture: NG, KE, and future expansion)
CREATE TABLE IF NOT EXISTS countries (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- e.g. 'NG', 'KE'
  name TEXT NOT NULL,
  currency TEXT NOT NULL, -- 'NGN', 'KES'
  phone_code TEXT NOT NULL, -- '+234', '+254'
  timezone TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Core Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'COUNTRY_MANAGER', 'REPRESENTATIVE', 'DEVELOPER', 'CLIENT')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED')),
  google_id TEXT,
  email_verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  country_id TEXT REFERENCES countries(id),
  timezone TEXT NOT NULL DEFAULT 'Africa/Lagos',
  avatar_url TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Representatives (Tracks country assignment, approval status, and configurable commission rate)
CREATE TABLE IF NOT EXISTS representatives (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  country_id TEXT NOT NULL REFERENCES countries(id),
  approval_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (approval_status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED')),
  commission_rate_bps INTEGER NOT NULL DEFAULT 2000, -- 2000 basis points = 20.00%
  referral_code TEXT UNIQUE,
  approved_at TEXT,
  approved_by TEXT REFERENCES users(id),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lead_id TEXT,
  company_name TEXT NOT NULL,
  industry TEXT,
  country_id TEXT NOT NULL REFERENCES countries(id),
  representative_id TEXT REFERENCES representatives(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Leads (Lead lifecycle: NEW -> CONTACTED -> QUALIFIED -> REQUIREMENTS_COLLECTED -> PROPOSAL -> WON / LOST)
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id),
  business_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  country_id TEXT NOT NULL REFERENCES countries(id),
  business_type TEXT NOT NULL,
  requirements TEXT NOT NULL,
  service_id TEXT REFERENCES services(id),
  timeline TEXT,
  estimated_budget_minor INTEGER NOT NULL DEFAULT 0, -- Minor currency units (no float)
  currency TEXT NOT NULL DEFAULT 'NGN',
  referral_source TEXT NOT NULL DEFAULT 'DIRECT',
  representative_id TEXT REFERENCES representatives(id),
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'REQUIREMENTS_COLLECTED', 'PROPOSAL', 'WON', 'LOST')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Services Catalog (14 business digital products + Mobile App Services)
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  base_price_minor INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  item_type TEXT NOT NULL DEFAULT 'CODEBRIDGE_SERVICE' CHECK (item_type IN ('CODEBRIDGE_SERVICE', 'THIRD_PARTY_FEE', 'REIMBURSABLE_EXPENSE')),
  platform TEXT NOT NULL DEFAULT 'ALL' CHECK (platform IN ('ALL', 'WEB', 'MOBILE', 'ANDROID', 'IOS', 'CROSS_PLATFORM', 'CLOUD')),
  billing_type TEXT NOT NULL DEFAULT 'PROJECT' CHECK (billing_type IN ('PROJECT', 'MILESTONE', 'MONTHLY', 'YEARLY', 'ONE_OFF')),
  is_price_configured INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  client_id TEXT NOT NULL REFERENCES clients(id),
  representative_id TEXT REFERENCES representatives(id),
  lead_id TEXT REFERENCES leads(id),
  service_id TEXT REFERENCES services(id),
  status TEXT NOT NULL DEFAULT 'PLANNING' CHECK (status IN (
    'DRAFT', 'AWAITING_PAYMENT', 'PLANNING', 'DEVELOPMENT', 'INTERNAL_REVIEW',
    'CLIENT_REVIEW', 'REVISION', 'APPROVED', 'DEPLOYMENT',
    'COMPLETED', 'MAINTENANCE'
  )),
  payment_status TEXT NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID')),
  budget_minor INTEGER NOT NULL DEFAULT 0,
  total_paid_minor INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  country_id TEXT NOT NULL REFERENCES countries(id),
  start_date TEXT,
  started_at TEXT,
  target_completion_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Project Members (Assigning developers, managers to projects)
CREATE TABLE IF NOT EXISTS project_members (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_in_project TEXT NOT NULL,
  assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(project_id, user_id)
);

-- Project Milestones
CREATE TABLE IF NOT EXISTS project_milestones (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')),
  due_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Proposals (Phase 2A Commercial Engine: Version-safe, Deliverables, Status Lifecycle)
CREATE TABLE IF NOT EXISTS proposals (
  id TEXT PRIMARY KEY,
  proposal_number TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_current INTEGER NOT NULL DEFAULT 1,
  lead_id TEXT REFERENCES leads(id),
  client_id TEXT NOT NULL REFERENCES clients(id),
  project_id TEXT REFERENCES projects(id),
  representative_id TEXT REFERENCES representatives(id),
  title TEXT NOT NULL,
  scope_of_work TEXT NOT NULL,
  deliverables_json TEXT NOT NULL DEFAULT '[]',
  line_items_json TEXT NOT NULL DEFAULT '[]',
  codebridge_total_minor INTEGER NOT NULL DEFAULT 0,
  third_party_total_minor INTEGER NOT NULL DEFAULT 0,
  app_store_ownership TEXT DEFAULT 'CLIENT_OWNED' CHECK (app_store_ownership IN ('CLIENT_OWNED', 'CODEBRIDGE_MANAGED')),
  store_approval_disclaimer TEXT,
  payment_structure_type TEXT NOT NULL DEFAULT 'FULL_UPFRONT' CHECK (payment_structure_type IN ('FULL_UPFRONT', 'DEPOSIT_MILESTONES', 'CUSTOM')),
  payment_schedule_json TEXT NOT NULL DEFAULT '[]',
  total_amount_minor INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'KES',
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'VIEWED', 'CLIENT_APPROVED', 'CLIENT_REJECTED', 'EXPIRED', 'CANCELLED')),
  valid_until TEXT,
  terms_notes TEXT,
  rejection_reason TEXT,
  created_by TEXT REFERENCES users(id),
  sent_at TEXT,
  viewed_at TEXT,
  approved_at TEXT,
  approved_version INTEGER,
  rejected_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(proposal_number, version)
);

CREATE INDEX IF NOT EXISTS idx_proposals_client ON proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_proposals_number ON proposals(proposal_number);
CREATE INDEX IF NOT EXISTS idx_proposals_rep ON proposals(representative_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);

-- Payment Schedules (Phase 2B: Milestone/Custom breakdown with explicit billing triggers)
CREATE TABLE IF NOT EXISTS payment_schedules (
  id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES projects(id),
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('FULL_UPFRONT', 'DEPOSIT_MILESTONES', 'CUSTOM')),
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 1,
  percentage_bps INTEGER NOT NULL,
  amount_minor INTEGER NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('KES', 'NGN')),
  is_required_to_start INTEGER NOT NULL DEFAULT 0,
  billing_trigger TEXT NOT NULL CHECK (billing_trigger IN ('UPFRONT_APPROVAL', 'MILESTONE_STARTED', 'MILESTONE_COMPLETED', 'MANUAL_RELEASE')),
  status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'INVOICEABLE', 'INVOICED', 'PAID', 'OVERDUE', 'CANCELLED')),
  invoice_id TEXT REFERENCES invoices(id),
  milestone_id TEXT REFERENCES project_milestones(id),
  due_date TEXT,
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_payment_schedules_proposal ON payment_schedules(proposal_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_project ON payment_schedules(project_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_status ON payment_schedules(status);

-- Invoices (Phase 2B Commercial Billing Engine)
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  proposal_id TEXT REFERENCES proposals(id),
  project_id TEXT NOT NULL REFERENCES projects(id),
  client_id TEXT NOT NULL REFERENCES clients(id),
  representative_id TEXT REFERENCES representatives(id),
  payment_schedule_id TEXT REFERENCES payment_schedules(id),
  title TEXT NOT NULL,
  description TEXT,
  amount_minor INTEGER NOT NULL DEFAULT 0,
  amount_paid_minor INTEGER NOT NULL DEFAULT 0,
  codebridge_amount_minor INTEGER NOT NULL DEFAULT 0,
  third_party_reimbursement_minor INTEGER NOT NULL DEFAULT 0,
  line_items_json TEXT,
  currency TEXT NOT NULL CHECK (currency IN ('KES', 'NGN')),
  status TEXT NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED')),
  due_date TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  paid_at TEXT,
  notes TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

-- Payments (Flutterwave and Verified Financial Transactions)
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id),
  project_id TEXT NOT NULL REFERENCES projects(id),
  client_id TEXT REFERENCES clients(id),
  provider_id TEXT REFERENCES users(id),
  amount_minor INTEGER NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('KES', 'NGN')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('BANK_TRANSFER', 'CASH', 'OTHER_MANUAL', 'GATEWAY_SIMULATION', 'MPESA', 'CARD', 'FLUTTERWAVE')),
  verification_source TEXT NOT NULL CHECK (verification_source IN (
    'MANUAL_VERIFICATION', 'BANK_TRANSFER_CONFIRMATION', 'GATEWAY_SIMULATION',
    'FLUTTERWAVE_WEBHOOK', 'M_PESA_CALLBACK'
  )),
  status TEXT NOT NULL DEFAULT 'INITIATED' CHECK (status IN (
    'INITIATED', 'PENDING_VERIFICATION', 'VERIFIED', 'SETTLED', 'FAILED', 'EXPIRED',
    'CONFIRMED', 'SUCCESSFUL', 'CANCELLED', 'REFUNDED'
  )),
  reference TEXT UNIQUE NOT NULL,
  gateway TEXT NOT NULL DEFAULT 'flutterwave',
  gateway_transaction_id TEXT,
  gateway_reference TEXT,
  gross_amount_minor INTEGER,
  gateway_fee_minor INTEGER DEFAULT 0,
  net_amount_minor INTEGER,
  transaction_currency TEXT,
  amount_transaction_minor INTEGER,
  settlement_status TEXT DEFAULT 'PENDING' CHECK (settlement_status IN ('PENDING', 'SETTLED', 'NOT_APPLICABLE')),
  settlement_currency TEXT,
  settlement_amount_minor INTEGER,
  settlement_exchange_rate REAL,
  exchange_rate_source TEXT,
  settlement_destination TEXT,
  amount_refunded_minor INTEGER DEFAULT 0,
  remaining_refundable_minor INTEGER,
  payout_status TEXT DEFAULT 'RESERVED' CHECK (payout_status IN ('RESERVED', 'ELIGIBLE', 'PARTIALLY_RELEASED', 'RELEASED')),
  metadata_json TEXT,
  paid_at TEXT,
  verified_at TEXT NOT NULL,
  verified_by TEXT NOT NULL REFERENCES users(id),
  verification_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (amount_refunded_minor <= amount_minor)
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_tx ON payments(gateway_transaction_id);

-- Commission Events (Phase 2B -> Phase 2D Handoff: Immutable Financial Facts)
CREATE TABLE IF NOT EXISTS commission_events (
  id TEXT PRIMARY KEY,
  payment_id TEXT UNIQUE NOT NULL REFERENCES payments(id),
  invoice_id TEXT NOT NULL REFERENCES invoices(id),
  project_id TEXT NOT NULL REFERENCES projects(id),
  proposal_id TEXT REFERENCES proposals(id),
  representative_id TEXT NOT NULL REFERENCES representatives(id),
  currency TEXT NOT NULL CHECK (currency IN ('KES', 'NGN')),
  verified_amount_minor INTEGER NOT NULL,
  commission_rate_bps_at_time_of_payment INTEGER NOT NULL,
  calculated_commission_amount_minor INTEGER NOT NULL,
  verified_at TEXT NOT NULL,
  idempotency_key TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'RECORDED' CHECK (status IN ('RECORDED', 'PROCESSED', 'FLAGGED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_commission_events_rep ON commission_events(representative_id);
CREATE INDEX IF NOT EXISTS idx_commission_events_payment ON commission_events(payment_id);
CREATE INDEX IF NOT EXISTS idx_commission_events_idempotency ON commission_events(idempotency_key);

-- Commissions (Tracks calculated representative commissions; NO live money movement)
CREATE TABLE IF NOT EXISTS commissions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  representative_id TEXT NOT NULL REFERENCES representatives(id),
  rate_bps INTEGER NOT NULL DEFAULT 2000, -- e.g. 2000 = 20%
  base_amount_minor INTEGER NOT NULL DEFAULT 0,
  commission_amount_minor INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'AVAILABLE', 'PROCESSING', 'PAID', 'CANCELLED', 'DISPUTED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Commission Ledger (Audit ledger of commission credits and balances)
CREATE TABLE IF NOT EXISTS commission_ledger (
  id TEXT PRIMARY KEY,
  commission_id TEXT REFERENCES commissions(id),
  representative_id TEXT NOT NULL REFERENCES representatives(id),
  type TEXT NOT NULL CHECK (type IN ('CREDIT', 'DEBIT', 'HOLD')),
  amount_minor INTEGER NOT NULL,
  currency TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'INFO',
  is_read INTEGER NOT NULL DEFAULT 0,
  link_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Messages / Project Discussions
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL DEFAULT 'CHAT',
  sender_id TEXT NOT NULL REFERENCES users(id),
  recipient_id TEXT REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Message Read Cursors
CREATE TABLE IF NOT EXISTS message_read_cursors (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  last_read_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Change Requests
CREATE TABLE IF NOT EXISTS change_requests (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  proposal_id TEXT REFERENCES proposals(id),
  requested_by TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact_assessment TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN (
    'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'IMPLEMENTED'
  )),
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TEXT,
  review_notes TEXT,
  requires_proposal_revision INTEGER NOT NULL DEFAULT 0,
  new_proposal_id TEXT REFERENCES proposals(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Project Documents / Files
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  uploader_id TEXT NOT NULL REFERENCES users(id),
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- System Audit Logs (Mandatory for tracking sensitive administrative & role changes)
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  metadata_json TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Territories
CREATE TABLE IF NOT EXISTS territories (
  id TEXT PRIMARY KEY,
  country_name TEXT NOT NULL,
  currency TEXT NOT NULL,
  default_payout_method TEXT NOT NULL DEFAULT 'BANK',
  default_commission_rate_bps INTEGER NOT NULL DEFAULT 2000,
  direct_admin INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Ledger Accounts (Chart of accounts for internal double-entry)
CREATE TABLE IF NOT EXISTS ledger_accounts (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE', 'CONTRA_REVENUE')),
  normal_balance TEXT NOT NULL CHECK (normal_balance IN ('DEBIT', 'CREDIT')),
  currency TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Immutable Double-Entry Ledger Table
CREATE TABLE IF NOT EXISTS ledger_entries (
  id TEXT PRIMARY KEY,
  entry_type TEXT NOT NULL,
  account_debited TEXT NOT NULL,
  account_credited TEXT NOT NULL,
  currency TEXT NOT NULL,
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  invoice_id TEXT,
  payment_id TEXT,
  sales_rep_id TEXT,
  project_id TEXT,
  client_id TEXT,
  reference TEXT NOT NULL,
  notes TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ledger_invoice ON ledger_entries(invoice_id);
CREATE INDEX IF NOT EXISTS idx_ledger_payment ON ledger_entries(payment_id);
CREATE INDEX IF NOT EXISTS idx_ledger_rep ON ledger_entries(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_ledger_reference ON ledger_entries(reference);
CREATE INDEX IF NOT EXISTS idx_ledger_type ON ledger_entries(entry_type);

-- Commission Payouts Table
CREATE TABLE IF NOT EXISTS commission_payouts (
  id TEXT PRIMARY KEY,
  sales_rep_id TEXT NOT NULL,
  commission_id TEXT,
  currency TEXT NOT NULL,
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  payout_method TEXT NOT NULL DEFAULT 'MPESA',
  payout_destination TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NOT_ELIGIBLE' CHECK (status IN (
    'NOT_ELIGIBLE', 'ELIGIBLE', 'QUEUED', 'INITIATED', 'CONFIRMED', 'PAID', 'PROCESSING', 'FAILED', 'ACTION_REQUIRED', 'MANUAL_REVIEW', 'CANCELLED'
  )),
  idempotency_key TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'flutterwave',
  provider_transfer_id TEXT,
  provider_reference TEXT,
  failure_reason TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TEXT,
  paid_at TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_payouts_rep ON commission_payouts(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON commission_payouts(status);

-- Refunds Table
CREATE TABLE IF NOT EXISTS refunds (
  id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL,
  invoice_id TEXT NOT NULL,
  project_id TEXT,
  client_id TEXT,
  sales_rep_id TEXT,
  currency TEXT NOT NULL,
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  completed_amount_minor INTEGER NOT NULL DEFAULT 0,
  requested_amount_minor INTEGER,
  approved_amount_minor INTEGER DEFAULT 0,
  commission_reversal_minor INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (status IN (
    'REQUESTED', 'UNDER_REVIEW', 'REJECTED', 'APPROVED', 'INSUFFICIENT_FUNDS',
    'INITIATED', 'PROCESSING', 'SUCCESSFUL', 'FAILED', 'MANUAL_INTERVENTION_REQUIRED',
    'ABANDONED', 'COMPLETED', 'CANCELLED'
  )),
  refund_reference TEXT NOT NULL UNIQUE,
  provider_refund_id TEXT,
  provider_reference TEXT,
  reason TEXT,
  failure_reason TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  original_refund_id TEXT REFERENCES refunds(id),
  idempotency_key TEXT UNIQUE,
  shortfall_minor INTEGER DEFAULT 0,
  operational_block_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  approved_at TEXT,
  initiated_at TEXT,
  completed_at TEXT,
  failed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_refunds_payment ON refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_invoice ON refunds(invoice_id);

-- Commission Adjustments Table
CREATE TABLE IF NOT EXISTS commission_adjustments (
  id TEXT PRIMARY KEY,
  sales_rep_id TEXT NOT NULL,
  commission_id TEXT NOT NULL,
  refund_id TEXT,
  adjustment_type TEXT NOT NULL,
  currency TEXT NOT NULL,
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  recovery_status TEXT NOT NULL DEFAULT 'NONE',
  notes TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_comm_adj_rep ON commission_adjustments(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_comm_adj_comm ON commission_adjustments(commission_id);

-- Disputes Table
CREATE TABLE IF NOT EXISTS disputes (
  id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL,
  invoice_id TEXT NOT NULL,
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPENED' CHECK (status IN ('OPENED', 'EVIDENCE_REQUIRED', 'EVIDENCE_SUBMITTED', 'WON', 'LOST', 'DISPUTE_OPEN', 'DISPUTE_WON', 'DISPUTE_LOST')),
  provider_dispute_id TEXT,
  evidence_status TEXT DEFAULT 'EVIDENCE_REQUIRED',
  evidence_submitted_at TEXT,
  reason TEXT,
  resolution_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT
);

-- Webhook Events (Raw event audit & deduplication)
CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  signature TEXT,
  status TEXT NOT NULL DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED', 'PROCESSED', 'FAILED', 'IGNORED')),
  processed_at TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_event ON webhook_events(provider, event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);

-- Exchange Rates (Audit records for currency conversions)
CREATE TABLE IF NOT EXISTS exchange_rates (
  id TEXT PRIMARY KEY,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate REAL NOT NULL,
  rate_source TEXT NOT NULL,
  source_timestamp TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Reconciliation Runs (Automated comparison runs)
CREATE TABLE IF NOT EXISTS reconciliation_runs (
  id TEXT PRIMARY KEY,
  run_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  discrepancy_count INTEGER NOT NULL DEFAULT 0,
  metrics_json TEXT,
  discrepancies_json TEXT,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

-- Provider Payouts (Fulfillment/developer payouts decoupled from client payment)
CREATE TABLE IF NOT EXISTS provider_payouts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  provider_id TEXT NOT NULL REFERENCES users(id),
  milestone_id TEXT REFERENCES project_milestones(id),
  currency TEXT NOT NULL,
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  status TEXT NOT NULL DEFAULT 'NOT_ELIGIBLE' CHECK (status IN (
    'NOT_ELIGIBLE', 'ELIGIBLE', 'QUEUED', 'INITIATED', 'CONFIRMED', 'FAILED', 'MANUAL_REVIEW'
  )),
  idempotency_key TEXT UNIQUE NOT NULL,
  eligible_at TEXT,
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_provider_payouts_project ON provider_payouts(project_id);
CREATE INDEX IF NOT EXISTS idx_provider_payouts_status ON provider_payouts(status);

-- Provider Recoveries (Clawback obligations from providers/reps)
CREATE TABLE IF NOT EXISTS provider_recoveries (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('REPRESENTATIVE', 'PROVIDER')),
  entity_id TEXT NOT NULL,
  refund_id TEXT REFERENCES refunds(id),
  dispute_id TEXT REFERENCES disputes(id),
  currency TEXT NOT NULL,
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  recovered_amount_minor INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PARTIALLY_RECOVERED', 'RECOVERED', 'WRITTEN_OFF')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_leads_rep ON leads(representative_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_country ON leads(country_id);
CREATE INDEX IF NOT EXISTS idx_leads_client ON leads(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_referral_source ON leads(referral_source);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_rep ON projects(representative_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_commissions_rep ON commissions(representative_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rep_referral_code ON representatives(referral_code);
CREATE INDEX IF NOT EXISTS idx_messages_lead ON messages(lead_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_read_cursor_user_lead
  ON message_read_cursors(user_id, lead_id) WHERE lead_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_read_cursor_user_project
  ON message_read_cursors(user_id, project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_change_requests_project ON change_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_status ON change_requests(status);

-- Immutability Triggers (Prevent accidental hard deletes of financial records in SQLite)
CREATE TRIGGER IF NOT EXISTS prevent_delete_payments BEFORE DELETE ON payments
BEGIN
  SELECT RAISE(ABORT, 'Financial Immutability Violation: DELETE is prohibited on payments table.');
END;

CREATE TRIGGER IF NOT EXISTS prevent_delete_refunds BEFORE DELETE ON refunds
BEGIN
  SELECT RAISE(ABORT, 'Financial Immutability Violation: DELETE is prohibited on refunds table.');
END;

CREATE TRIGGER IF NOT EXISTS prevent_delete_ledger_entries BEFORE DELETE ON ledger_entries
BEGIN
  SELECT RAISE(ABORT, 'Financial Immutability Violation: DELETE is prohibited on ledger_entries table.');
END;

CREATE TRIGGER IF NOT EXISTS prevent_delete_commission_payouts BEFORE DELETE ON commission_payouts
BEGIN
  SELECT RAISE(ABORT, 'Financial Immutability Violation: DELETE is prohibited on commission_payouts table.');
END;

CREATE TRIGGER IF NOT EXISTS prevent_delete_provider_payouts BEFORE DELETE ON provider_payouts
BEGIN
  SELECT RAISE(ABORT, 'Financial Immutability Violation: DELETE is prohibited on provider_payouts table.');
END;

CREATE TRIGGER IF NOT EXISTS prevent_delete_webhook_events BEFORE DELETE ON webhook_events
BEGIN
  SELECT RAISE(ABORT, 'Financial Immutability Violation: DELETE is prohibited on webhook_events table.');
END;

-- Triggers for syncing refunds to payments (SQLite)
CREATE TRIGGER IF NOT EXISTS trg_sync_payment_refund_cache_insert_sqlite
AFTER INSERT ON refunds
WHEN NEW.status IN ('SUCCESSFUL', 'COMPLETED')
BEGIN
  UPDATE payments
  SET amount_refunded_minor = (
        SELECT COALESCE(SUM(completed_amount_minor), 0)
        FROM refunds
        WHERE payment_id = NEW.payment_id
          AND status IN ('SUCCESSFUL', 'COMPLETED')
      ),
      remaining_refundable_minor = MAX(0, amount_minor - (
        SELECT COALESCE(SUM(completed_amount_minor), 0)
        FROM refunds
        WHERE payment_id = NEW.payment_id
          AND status IN ('SUCCESSFUL', 'COMPLETED')
      )),
      status = CASE 
                 WHEN (
                   SELECT COALESCE(SUM(completed_amount_minor), 0)
                   FROM refunds
                   WHERE payment_id = NEW.payment_id
                     AND status IN ('SUCCESSFUL', 'COMPLETED')
                 ) >= amount_minor THEN 'REFUNDED'
                 ELSE status
               END,
      updated_at = datetime('now')
  WHERE id = NEW.payment_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_payment_refund_cache_update_sqlite
AFTER UPDATE ON refunds
WHEN NEW.status IN ('SUCCESSFUL', 'COMPLETED') OR OLD.status IN ('SUCCESSFUL', 'COMPLETED')
BEGIN
  UPDATE payments
  SET amount_refunded_minor = (
        SELECT COALESCE(SUM(completed_amount_minor), 0)
        FROM refunds
        WHERE payment_id = NEW.payment_id
          AND status IN ('SUCCESSFUL', 'COMPLETED')
      ),
      remaining_refundable_minor = MAX(0, amount_minor - (
        SELECT COALESCE(SUM(completed_amount_minor), 0)
        FROM refunds
        WHERE payment_id = NEW.payment_id
          AND status IN ('SUCCESSFUL', 'COMPLETED')
      )),
      status = CASE 
                 WHEN (
                   SELECT COALESCE(SUM(completed_amount_minor), 0)
                   FROM refunds
                   WHERE payment_id = NEW.payment_id
                     AND status IN ('SUCCESSFUL', 'COMPLETED')
                 ) >= amount_minor THEN 'REFUNDED'
                 ELSE status
               END,
      updated_at = datetime('now')
  WHERE id = NEW.payment_id;
END;

-- Since SQLite doesn't allow bypassing triggers natively via something like session config, 
-- and we no longer explicitly update amount_refunded_minor from app code, we can just block it
-- unless the update is exactly what the trigger calculates? Actually we can just leave it out in SQLite
-- or rely on the fact that we removed the manual UPDATE from application code.
-- For true equivalence we just let the DB maintain it.

`;



