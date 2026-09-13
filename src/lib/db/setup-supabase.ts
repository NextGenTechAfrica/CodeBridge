// src/lib/db/setup-supabase.ts
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import postgres from 'postgres';

function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}
loadEnvFile();

function getFallbackDbUrl() {
  if (process.env.DIRECT_URL) return process.env.DIRECT_URL;
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  return null;
}

export const FOUNDATIONAL_SERVICES: [string, string, string, string, string, number, string, string, string, string, number, number][] = [
  // id, code, name, description, category, base_price_minor, currency, item_type, platform, billing_type, is_price_configured, is_active
  ['srv_biz_web', 'BIZ-WEB', 'Business Websites', 'Modern, high-converting corporate and brand websites engineered for market credibility and lead generation.', 'Websites', 45000000, 'NGN', 'CODEBRIDGE_SERVICE', 'WEB', 'PROJECT', 1, 1],
  ['srv_ecom', 'E-COMM', 'E-commerce Websites', 'Scalable online storefronts with cart management, inventory tracking, and seamless checkout flows.', 'E-commerce', 85000000, 'NGN', 'CODEBRIDGE_SERVICE', 'WEB', 'PROJECT', 1, 1],
  ['srv_rest', 'REST-ORDER', 'Restaurant Websites & Ordering Systems', 'Custom restaurant digital hubs with real-time digital menus, table reservation, and direct order workflows.', 'Hospitality', 65000000, 'NGN', 'CODEBRIDGE_SERVICE', 'WEB', 'PROJECT', 1, 1],
  ['srv_prop', 'PROP-AIRBNB', 'Property & Airbnb Websites', 'Direct booking and showcase platforms for real estate developers, short-let operators, and property managers.', 'Real Estate', 75000000, 'NGN', 'CODEBRIDGE_SERVICE', 'WEB', 'PROJECT', 1, 1],
  ['srv_book', 'BOOK-SYS', 'Booking Systems', 'Automated reservation, appointment scheduling, calendar integration, and client notification engines.', 'Applications', 55000000, 'NGN', 'CODEBRIDGE_SERVICE', 'WEB', 'PROJECT', 1, 1],
  ['srv_land', 'LAND-PAGES', 'Landing Pages', 'Precision-crafted single-page experiences optimized for paid ad campaigns and maximum conversion velocity.', 'Marketing', 25000000, 'NGN', 'CODEBRIDGE_SERVICE', 'WEB', 'PROJECT', 1, 1],
  ['srv_webapp', 'WEB-APP', 'Custom Web Applications', 'Purpose-built software applications engineered to streamline core business operations and customer self-service.', 'Applications', 120000000, 'NGN', 'CODEBRIDGE_SERVICE', 'WEB', 'PROJECT', 1, 1],
  ['srv_port', 'CUST-PORTAL', 'Customer Portals', 'Secure client-facing dashboards for document exchange, service requests, invoicing, and account management.', 'Applications', 90000000, 'NGN', 'CODEBRIDGE_SERVICE', 'WEB', 'PROJECT', 1, 1],
  ['srv_dash', 'ADMIN-DASH', 'Admin Dashboards', 'Comprehensive control panels with operational metrics, analytics, permissions, and business management tools.', 'Dashboards', 80000000, 'NGN', 'CODEBRIDGE_SERVICE', 'WEB', 'PROJECT', 1, 1],
  ['srv_soft', 'CUSTOM-SW', 'Custom Business Software', 'Tailor-made software solutions built around proprietary business workflows and operational bottlenecks.', 'Enterprise', 150000000, 'NGN', 'CODEBRIDGE_SERVICE', 'ALL', 'PROJECT', 1, 1],
  ['srv_mgmt', 'BIZ-MGMT', 'Business Management Systems', 'End-to-end digital operating systems integrating CRM, resource planning, and internal communications.', 'Enterprise', 180000000, 'NGN', 'CODEBRIDGE_SERVICE', 'ALL', 'PROJECT', 1, 1],
  ['srv_redesign', 'SITE-REDESIGN', 'Website Redesigns', 'Complete architectural overhaul, performance upgrade, and visual modernization of legacy corporate sites.', 'Websites', 40000000, 'NGN', 'CODEBRIDGE_SERVICE', 'WEB', 'PROJECT', 1, 1],
  ['srv_maint', 'TECH-SUPPORT', 'Maintenance & Technical Support', 'Ongoing code upkeep, security patches, uptime monitoring, and SLA-backed engineering support.', 'Support', 20000000, 'NGN', 'CODEBRIDGE_SERVICE', 'ALL', 'MONTHLY', 1, 1],
  ['srv_host', 'HOST-INFRA', 'Hosting & Domain Assistance', 'High-availability cloud deployment, DNS configuration, SSL provisioning, and cloud infrastructure setup.', 'Infrastructure', 15000000, 'NGN', 'CODEBRIDGE_SERVICE', 'CLOUD', 'ONE_OFF', 1, 1],
  // Mobile App Services (CodeBridge Services - Price Unconfigured until business owner sets price)
  ['srv_mob_android', 'MOB-ANDROID', 'Mobile App Development (Android)', 'Native or optimized Android mobile application development engineered for high performance, material design, and offline capability.', 'Mobile Apps', 0, 'KES', 'CODEBRIDGE_SERVICE', 'ANDROID', 'PROJECT', 0, 1],
  ['srv_mob_ios', 'MOB-IOS', 'Mobile App Development (iOS)', 'Premium iOS mobile application development engineered according to Apple Human Interface Guidelines and Swift/modern standards.', 'Mobile Apps', 0, 'KES', 'CODEBRIDGE_SERVICE', 'IOS', 'PROJECT', 0, 1],
  ['srv_mob_cross', 'MOB-CROSS', 'Cross-Platform Mobile App Development (Android + iOS)', 'Unified React Native / Flutter cross-platform mobile application engineering serving both Google Play Store and Apple App Store.', 'Mobile Apps', 0, 'KES', 'CODEBRIDGE_SERVICE', 'CROSS_PLATFORM', 'PROJECT', 0, 1],
  ['srv_pub_play', 'PUB-PLAY', 'Google Play Store Publishing Assistance', 'Release preparation, APK/AAB generation, Google Play Console listing configuration, privacy policy checklist, and submission assistance. Note: Final approval is strictly controlled by Google.', 'Store Publishing', 0, 'KES', 'CODEBRIDGE_SERVICE', 'ANDROID', 'ONE_OFF', 0, 1],
  ['srv_pub_apple', 'PUB-APPLE', 'Apple App Store Publishing Assistance', 'iOS production build signing, App Store Connect metadata & screenshots setup, TestFlight configuration, and App Store review submission assistance. Note: Final approval is strictly controlled by Apple.', 'Store Publishing', 0, 'KES', 'CODEBRIDGE_SERVICE', 'IOS', 'ONE_OFF', 0, 1],
  ['srv_mob_maint', 'MOB-MAINT', 'Mobile App Maintenance & SLA Support', 'Continuous OS compatibility updates (new Android/iOS releases), library dependency maintenance, bug fixes, and store compliance monitoring.', 'Mobile Maintenance', 0, 'KES', 'CODEBRIDGE_SERVICE', 'MOBILE', 'MONTHLY', 0, 1],
  // Third-Party Fees (Paid directly by client or reimbursable; NEVER CodeBridge revenue)
  ['fee_play_dev', 'FEE-PLAY-DEV', 'Google Play Developer Account Fee', 'One-time registration fee ($25 USD reference) paid directly by the client to Google for their Google Play Console developer account.', 'Third-Party Accounts', 0, 'USD', 'THIRD_PARTY_FEE', 'ANDROID', 'ONE_OFF', 1, 1],
  ['fee_apple_dev', 'FEE-APPLE-DEV', 'Apple Developer Program Annual Membership', 'Annual membership fee ($99 USD/yr reference) paid directly by the client to Apple to maintain their App Store Developer organization account.', 'Third-Party Accounts', 0, 'USD', 'THIRD_PARTY_FEE', 'IOS', 'YEARLY', 1, 1],
  ['fee_cloud_infra', 'FEE-CLOUD-INFRA', 'Cloud Infrastructure & Hosting Services', 'Third-party cloud infrastructure (Vercel, Supabase, AWS, GCP, domain registrar) fees paid directly according to usage and selected tier.', 'Infrastructure', 0, 'USD', 'THIRD_PARTY_FEE', 'CLOUD', 'MONTHLY', 1, 1],
];

export const POSTGRES_SCHEMA_SQL = `
-- Compatibility helpers for seamless SQLite -> PostgreSQL migration
CREATE OR REPLACE FUNCTION datetime(val text DEFAULT 'now') RETURNS timestamptz AS $$
  SELECT NOW();
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION date(val text DEFAULT 'now', mod text DEFAULT NULL) RETURNS date AS $$
  SELECT CURRENT_DATE;
$$ LANGUAGE SQL IMMUTABLE;

-- Countries table
CREATE TABLE IF NOT EXISTS countries (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(8) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  currency VARCHAR(8) NOT NULL,
  phone_code VARCHAR(16) NOT NULL,
  timezone TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Core Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(32) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'COUNTRY_MANAGER', 'REPRESENTATIVE', 'DEVELOPER', 'CLIENT')),
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED')),
  google_id VARCHAR(255),
  email_verified INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotently ensure google_id column exists on existing production tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);

-- User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  country_id VARCHAR(64) REFERENCES countries(id),
  timezone TEXT NOT NULL DEFAULT 'Africa/Lagos',
  avatar_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Representatives
CREATE TABLE IF NOT EXISTS representatives (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  country_id VARCHAR(64) NOT NULL REFERENCES countries(id),
  approval_status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (approval_status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED')),
  commission_rate_bps INTEGER NOT NULL DEFAULT 2000,
  approved_at TIMESTAMPTZ,
  approved_by VARCHAR(64) REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lead_id VARCHAR(64),
  company_name TEXT NOT NULL,
  industry TEXT,
  country_id VARCHAR(64) NOT NULL REFERENCES countries(id),
  representative_id VARCHAR(64) REFERENCES representatives(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leads
CREATE TABLE IF NOT EXISTS leads (
  id VARCHAR(64) PRIMARY KEY,
  business_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone TEXT NOT NULL,
  country_id VARCHAR(64) NOT NULL REFERENCES countries(id),
  business_type TEXT NOT NULL,
  requirements TEXT NOT NULL,
  estimated_budget_minor BIGINT NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT 'NGN',
  representative_id VARCHAR(64) REFERENCES representatives(id),
  status VARCHAR(32) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'REQUIREMENTS_COLLECTED', 'PROPOSAL', 'WON', 'LOST')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Services Catalog
CREATE TABLE IF NOT EXISTS services (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(32) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  base_price_minor BIGINT NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT 'NGN',
  item_type VARCHAR(32) NOT NULL DEFAULT 'CODEBRIDGE_SERVICE' CHECK (item_type IN ('CODEBRIDGE_SERVICE', 'THIRD_PARTY_FEE', 'REIMBURSABLE_EXPENSE')),
  platform VARCHAR(32) NOT NULL DEFAULT 'ALL' CHECK (platform IN ('ALL', 'WEB', 'MOBILE', 'ANDROID', 'IOS', 'CROSS_PLATFORM', 'CLOUD')),
  billing_type VARCHAR(32) NOT NULL DEFAULT 'PROJECT' CHECK (billing_type IN ('PROJECT', 'MILESTONE', 'MONTHLY', 'YEARLY', 'ONE_OFF')),
  is_price_configured INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(64) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  client_id VARCHAR(64) NOT NULL REFERENCES clients(id),
  representative_id VARCHAR(64) REFERENCES representatives(id),
  lead_id VARCHAR(64) REFERENCES leads(id),
  service_id VARCHAR(64) REFERENCES services(id),
  status VARCHAR(32) NOT NULL DEFAULT 'PLANNING' CHECK (status IN (
    'DRAFT', 'AWAITING_PAYMENT', 'PLANNING', 'IN_PROGRESS', 'DEVELOPMENT', 'INTERNAL_REVIEW',
    'CLIENT_REVIEW', 'REVISION', 'APPROVED', 'DEPLOYMENT',
    'COMPLETED', 'MAINTENANCE'
  )),
  payment_status VARCHAR(32) NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID')),
  budget_minor BIGINT NOT NULL DEFAULT 0,
  total_paid_minor BIGINT NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT 'NGN',
  country_id VARCHAR(64) NOT NULL REFERENCES countries(id),
  start_date DATE,
  started_at TIMESTAMPTZ,
  target_completion_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project Members
CREATE TABLE IF NOT EXISTS project_members (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_in_project TEXT NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Project Milestones
CREATE TABLE IF NOT EXISTS project_milestones (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')),
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Proposals
CREATE TABLE IF NOT EXISTS proposals (
  id VARCHAR(64) PRIMARY KEY,
  proposal_number VARCHAR(64) NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_current INTEGER NOT NULL DEFAULT 1,
  lead_id VARCHAR(64) REFERENCES leads(id),
  client_id VARCHAR(64) NOT NULL REFERENCES clients(id),
  project_id VARCHAR(64) REFERENCES projects(id),
  representative_id VARCHAR(64) REFERENCES representatives(id),
  title TEXT NOT NULL,
  scope_of_work TEXT NOT NULL,
  deliverables_json TEXT NOT NULL DEFAULT '[]',
  line_items_json TEXT NOT NULL DEFAULT '[]',
  codebridge_total_minor BIGINT NOT NULL DEFAULT 0,
  third_party_total_minor BIGINT NOT NULL DEFAULT 0,
  app_store_ownership VARCHAR(32) DEFAULT 'CLIENT_OWNED' CHECK (app_store_ownership IN ('CLIENT_OWNED', 'CODEBRIDGE_MANAGED')),
  store_approval_disclaimer TEXT,
  payment_structure_type VARCHAR(32) NOT NULL DEFAULT 'FULL_UPFRONT' CHECK (payment_structure_type IN ('FULL_UPFRONT', 'DEPOSIT_MILESTONES', 'CUSTOM')),
  payment_schedule_json TEXT NOT NULL DEFAULT '[]',
  total_amount_minor BIGINT NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT 'KES',
  status VARCHAR(32) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'VIEWED', 'CLIENT_APPROVED', 'CLIENT_REJECTED', 'EXPIRED', 'CANCELLED')),
  valid_until TIMESTAMPTZ,
  terms_notes TEXT,
  rejection_reason TEXT,
  created_by VARCHAR(64) REFERENCES users(id),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_version INTEGER,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(proposal_number, version)
);

CREATE INDEX IF NOT EXISTS idx_proposals_client ON proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_proposals_number ON proposals(proposal_number);
CREATE INDEX IF NOT EXISTS idx_proposals_rep ON proposals(representative_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);

-- Payment Schedules
CREATE TABLE IF NOT EXISTS payment_schedules (
  id VARCHAR(64) PRIMARY KEY,
  proposal_id VARCHAR(64) NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  project_id VARCHAR(64) REFERENCES projects(id),
  schedule_type VARCHAR(32) NOT NULL CHECK (schedule_type IN ('FULL_UPFRONT', 'DEPOSIT_MILESTONES', 'CUSTOM')),
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 1,
  percentage_bps INTEGER NOT NULL,
  amount_minor BIGINT NOT NULL,
  currency VARCHAR(8) NOT NULL CHECK (currency IN ('KES', 'NGN')),
  is_required_to_start INTEGER NOT NULL DEFAULT 0,
  billing_trigger VARCHAR(32) NOT NULL CHECK (billing_trigger IN ('IMMEDIATE', 'MILESTONE_COMPLETION', 'MANUAL_RELEASE')),
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'DUE', 'PAID', 'CANCELLED')),
  invoice_id VARCHAR(64),
  milestone_id VARCHAR(64) REFERENCES project_milestones(id),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_schedules_proposal ON payment_schedules(proposal_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_project ON payment_schedules(project_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_status ON payment_schedules(status);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(64) PRIMARY KEY,
  invoice_number VARCHAR(64) UNIQUE NOT NULL,
  proposal_id VARCHAR(64) REFERENCES proposals(id),
  project_id VARCHAR(64) NOT NULL REFERENCES projects(id),
  client_id VARCHAR(64) NOT NULL REFERENCES clients(id),
  representative_id VARCHAR(64) REFERENCES representatives(id),
  payment_schedule_id VARCHAR(64) REFERENCES payment_schedules(id),
  title TEXT NOT NULL,
  description TEXT,
  amount_minor BIGINT NOT NULL DEFAULT 0,
  amount_paid_minor BIGINT NOT NULL DEFAULT 0,
  codebridge_amount_minor BIGINT NOT NULL DEFAULT 0,
  third_party_reimbursement_minor BIGINT NOT NULL DEFAULT 0,
  line_items_json TEXT,
  currency VARCHAR(8) NOT NULL CHECK (currency IN ('KES', 'NGN')),
  status VARCHAR(32) NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED')),
  due_date DATE NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_by VARCHAR(64) REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(64) PRIMARY KEY,
  invoice_id VARCHAR(64) NOT NULL REFERENCES invoices(id),
  project_id VARCHAR(64) NOT NULL REFERENCES projects(id),
  amount_minor BIGINT NOT NULL,
  currency VARCHAR(8) NOT NULL CHECK (currency IN ('KES', 'NGN')),
  payment_method VARCHAR(32) NOT NULL CHECK (payment_method IN ('BANK_TRANSFER', 'CASH', 'OTHER_MANUAL', 'GATEWAY_SIMULATION', 'MPESA', 'CARD', 'FLUTTERWAVE')),
  verification_source VARCHAR(32) NOT NULL CHECK (verification_source IN (
    'MANUAL_VERIFICATION', 'BANK_TRANSFER_CONFIRMATION', 'GATEWAY_SIMULATION',
    'FLUTTERWAVE_WEBHOOK', 'M_PESA_CALLBACK'
  )),
  status VARCHAR(32) NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('PENDING', 'CONFIRMED', 'SUCCESSFUL', 'FAILED', 'CANCELLED', 'REFUNDED')),
  reference VARCHAR(255) UNIQUE NOT NULL,
  gateway VARCHAR(32) NOT NULL DEFAULT 'flutterwave',
  gateway_transaction_id VARCHAR(128),
  gateway_reference VARCHAR(128),
  gross_amount_minor BIGINT,
  gateway_fee_minor BIGINT DEFAULT 0,
  net_amount_minor BIGINT,
  settlement_status VARCHAR(32) DEFAULT 'PENDING' CHECK (settlement_status IN ('PENDING', 'SETTLED', 'NOT_APPLICABLE')),
  settlement_currency VARCHAR(8),
  settlement_amount_minor BIGINT,
  settlement_destination TEXT,
  metadata_json TEXT,
  paid_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ NOT NULL,
  verified_by VARCHAR(64) NOT NULL REFERENCES users(id),
  verification_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference);

-- Idempotent schema upgrades for existing deployments
ALTER TABLE services ADD COLUMN IF NOT EXISTS item_type VARCHAR(32) DEFAULT 'CODEBRIDGE_SERVICE';
ALTER TABLE services ADD COLUMN IF NOT EXISTS platform VARCHAR(32) DEFAULT 'ALL';
ALTER TABLE services ADD COLUMN IF NOT EXISTS billing_type VARCHAR(32) DEFAULT 'PROJECT';
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_price_configured INTEGER DEFAULT 1;

ALTER TABLE proposals ADD COLUMN IF NOT EXISTS line_items_json TEXT DEFAULT '[]';
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS codebridge_total_minor BIGINT DEFAULT 0;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS third_party_total_minor BIGINT DEFAULT 0;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS app_store_ownership VARCHAR(32) DEFAULT 'CLIENT_OWNED';
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS store_approval_disclaimer TEXT;

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS codebridge_amount_minor BIGINT DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS third_party_reimbursement_minor BIGINT DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS line_items_json TEXT;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway VARCHAR(32) DEFAULT 'flutterwave';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_transaction_id VARCHAR(128);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_reference VARCHAR(128);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gross_amount_minor BIGINT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_fee_minor BIGINT DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS net_amount_minor BIGINT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS client_id VARCHAR(64) REFERENCES clients(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_id VARCHAR(64) REFERENCES users(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_currency VARCHAR(8);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount_transaction_minor BIGINT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS settlement_status VARCHAR(32) DEFAULT 'PENDING';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS settlement_currency VARCHAR(8);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS settlement_amount_minor BIGINT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS settlement_exchange_rate NUMERIC(18, 6);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS exchange_rate_source VARCHAR(64);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS settlement_destination TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount_refunded_minor BIGINT DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS remaining_refundable_minor BIGINT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payout_status VARCHAR(32) DEFAULT 'RESERVED';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata_json TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check CHECK (payment_method IN ('BANK_TRANSFER', 'CASH', 'OTHER_MANUAL', 'GATEWAY_SIMULATION', 'MPESA', 'CARD', 'FLUTTERWAVE'));

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_verification_source_check;
ALTER TABLE payments ADD CONSTRAINT payments_verification_source_check CHECK (verification_source IN ('MANUAL_VERIFICATION', 'BANK_TRANSFER_CONFIRMATION', 'GATEWAY_SIMULATION', 'FLUTTERWAVE_WEBHOOK', 'M_PESA_CALLBACK'));

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check CHECK (status IN ('INITIATED', 'PENDING_VERIFICATION', 'VERIFIED', 'SETTLED', 'FAILED', 'EXPIRED', 'CONFIRMED', 'SUCCESSFUL', 'CANCELLED', 'REFUNDED'));

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_refund_limit_check;
ALTER TABLE payments ADD CONSTRAINT payments_refund_limit_check CHECK (amount_refunded_minor <= amount_minor);

CREATE INDEX IF NOT EXISTS idx_payments_gateway_tx ON payments(gateway_transaction_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_unique_flw_ref ON payments(gateway_reference) WHERE gateway_reference IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_unique_flw_tx_id ON payments(gateway_transaction_id) WHERE gateway_transaction_id IS NOT NULL;

-- Refunds alterations
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS requested_amount_minor BIGINT;
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS approved_amount_minor BIGINT DEFAULT 0;
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS original_refund_id VARCHAR(64) REFERENCES refunds(id);
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128) UNIQUE;
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS shortfall_minor BIGINT DEFAULT 0;
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS operational_block_reason TEXT;
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS initiated_at TIMESTAMPTZ;
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ;

ALTER TABLE refunds DROP CONSTRAINT IF EXISTS refunds_status_check;
ALTER TABLE refunds ADD CONSTRAINT refunds_status_check CHECK (status IN (
  'REQUESTED', 'UNDER_REVIEW', 'REJECTED', 'APPROVED', 'INSUFFICIENT_FUNDS',
  'INITIATED', 'PROCESSING', 'SUCCESSFUL', 'FAILED', 'MANUAL_INTERVENTION_REQUIRED',
  'ABANDONED', 'COMPLETED', 'CANCELLED'
));

-- Commission Events (Immutable Financial Facts)
CREATE TABLE IF NOT EXISTS commission_events (
  id VARCHAR(64) PRIMARY KEY,
  payment_id VARCHAR(64) UNIQUE NOT NULL REFERENCES payments(id),
  invoice_id VARCHAR(64) NOT NULL REFERENCES invoices(id),
  project_id VARCHAR(64) NOT NULL REFERENCES projects(id),
  proposal_id VARCHAR(64) REFERENCES proposals(id),
  representative_id VARCHAR(64) NOT NULL REFERENCES representatives(id),
  currency VARCHAR(8) NOT NULL CHECK (currency IN ('KES', 'NGN')),
  verified_amount_minor BIGINT NOT NULL,
  commission_rate_bps_at_time_of_payment INTEGER NOT NULL,
  calculated_commission_amount_minor BIGINT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL,
  idempotency_key VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'RECORDED' CHECK (status IN ('RECORDED', 'PROCESSED', 'FLAGGED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commission_events_rep ON commission_events(representative_id);
CREATE INDEX IF NOT EXISTS idx_commission_events_payment ON commission_events(payment_id);
CREATE INDEX IF NOT EXISTS idx_commission_events_idempotency ON commission_events(idempotency_key);

-- Commissions
CREATE TABLE IF NOT EXISTS commissions (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL REFERENCES projects(id),
  representative_id VARCHAR(64) NOT NULL REFERENCES representatives(id),
  rate_bps INTEGER NOT NULL DEFAULT 2000,
  base_amount_minor BIGINT NOT NULL DEFAULT 0,
  commission_amount_minor BIGINT NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT 'NGN',
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'AVAILABLE', 'PROCESSING', 'PAID', 'CANCELLED', 'DISPUTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Commission Ledger
CREATE TABLE IF NOT EXISTS commission_ledger (
  id VARCHAR(64) PRIMARY KEY,
  commission_id VARCHAR(64) REFERENCES commissions(id),
  representative_id VARCHAR(64) NOT NULL REFERENCES representatives(id),
  type VARCHAR(32) NOT NULL CHECK (type IN ('CREDIT', 'DEBIT', 'HOLD')),
  amount_minor BIGINT NOT NULL,
  currency VARCHAR(8) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(32) NOT NULL DEFAULT 'INFO',
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) REFERENCES projects(id) ON DELETE CASCADE,
  lead_id VARCHAR(64) REFERENCES leads(id) ON DELETE CASCADE,
  sender_id VARCHAR(64) NOT NULL REFERENCES users(id),
  recipient_id VARCHAR(64) REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE messages ADD COLUMN IF NOT EXISTS lead_id VARCHAR(64) REFERENCES leads(id) ON DELETE CASCADE;

-- Message Read Cursors
CREATE TABLE IF NOT EXISTS message_read_cursors (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lead_id VARCHAR(64) REFERENCES leads(id) ON DELETE CASCADE,
  project_id VARCHAR(64) REFERENCES projects(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Change Requests
CREATE TABLE IF NOT EXISTS change_requests (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  proposal_id VARCHAR(64) REFERENCES proposals(id),
  requested_by VARCHAR(64) NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact_summary TEXT,
  additional_amount_minor BIGINT NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT 'KES',
  status VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'IMPLEMENTED')),
  reviewed_by VARCHAR(64) REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) REFERENCES projects(id) ON DELETE CASCADE,
  uploader_id VARCHAR(64) NOT NULL REFERENCES users(id),
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id VARCHAR(64),
  metadata_json TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_read_cursor_user_lead
  ON message_read_cursors(user_id, lead_id) WHERE lead_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_read_cursor_user_project
  ON message_read_cursors(user_id, project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_change_requests_project ON change_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_status ON change_requests(status);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_leads_rep ON leads(representative_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_country ON leads(country_id);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_rep ON projects(representative_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_commissions_rep ON commissions(representative_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Territories
CREATE TABLE IF NOT EXISTS territories (
  id VARCHAR(16) PRIMARY KEY,
  country_name TEXT NOT NULL,
  currency VARCHAR(8) NOT NULL,
  default_payout_method VARCHAR(32) NOT NULL DEFAULT 'BANK',
  default_commission_rate_bps INTEGER NOT NULL DEFAULT 2000,
  direct_admin BOOLEAN NOT NULL DEFAULT FALSE,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE territories ADD COLUMN IF NOT EXISTS direct_admin BOOLEAN DEFAULT FALSE;

-- Representatives extensions
ALTER TABLE representatives ADD COLUMN IF NOT EXISTS territory_id VARCHAR(16);
ALTER TABLE representatives ADD COLUMN IF NOT EXISTS payout_currency VARCHAR(8) DEFAULT 'KES';
ALTER TABLE representatives ADD COLUMN IF NOT EXISTS payout_method VARCHAR(32) DEFAULT 'MPESA';
ALTER TABLE representatives ADD COLUMN IF NOT EXISTS payout_destination TEXT;
ALTER TABLE representatives ADD COLUMN IF NOT EXISTS payout_bank_code VARCHAR(32) DEFAULT 'MPS';
ALTER TABLE representatives ADD COLUMN IF NOT EXISTS payout_account_name TEXT;

-- Immutable Double-Entry Ledger Table
CREATE TABLE IF NOT EXISTS ledger_entries (
  id VARCHAR(64) PRIMARY KEY,
  entry_type VARCHAR(32) NOT NULL,
  account_debited VARCHAR(64) NOT NULL,
  account_credited VARCHAR(64) NOT NULL,
  currency VARCHAR(8) NOT NULL,
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  invoice_id VARCHAR(64),
  payment_id VARCHAR(64),
  sales_rep_id VARCHAR(64),
  project_id VARCHAR(64),
  client_id VARCHAR(64),
  reference VARCHAR(128) NOT NULL,
  notes TEXT,
  metadata_json TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_invoice ON ledger_entries(invoice_id);
CREATE INDEX IF NOT EXISTS idx_ledger_payment ON ledger_entries(payment_id);
CREATE INDEX IF NOT EXISTS idx_ledger_rep ON ledger_entries(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_ledger_reference ON ledger_entries(reference);
CREATE INDEX IF NOT EXISTS idx_ledger_type ON ledger_entries(entry_type);

-- Commission Payouts Table
CREATE TABLE IF NOT EXISTS commission_payouts (
  id VARCHAR(64) PRIMARY KEY,
  sales_rep_id VARCHAR(64) NOT NULL,
  commission_id VARCHAR(64),
  currency VARCHAR(8) NOT NULL,
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  payout_method VARCHAR(32) NOT NULL DEFAULT 'MPESA',
  payout_destination TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'QUEUED',
  idempotency_key VARCHAR(128) NOT NULL UNIQUE,
  provider VARCHAR(32) NOT NULL DEFAULT 'flutterwave',
  provider_transfer_id VARCHAR(128),
  provider_reference VARCHAR(128),
  failure_reason TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  metadata_json TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payouts_rep ON commission_payouts(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON commission_payouts(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payouts_unique_comm_rep ON commission_payouts(commission_id, sales_rep_id) WHERE commission_id IS NOT NULL;

-- Refunds Table
CREATE TABLE IF NOT EXISTS refunds (
  id VARCHAR(64) PRIMARY KEY,
  payment_id VARCHAR(64) NOT NULL,
  invoice_id VARCHAR(64) NOT NULL,
  project_id VARCHAR(64),
  client_id VARCHAR(64),
  sales_rep_id VARCHAR(64),
  currency VARCHAR(8) NOT NULL,
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  completed_amount_minor BIGINT NOT NULL DEFAULT 0,
  commission_reversal_minor BIGINT NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'REQUESTED',
  refund_reference VARCHAR(128) NOT NULL UNIQUE,
  provider_refund_id VARCHAR(128),
  provider_reference VARCHAR(128),
  reason TEXT,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refunds_payment ON refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_invoice ON refunds(invoice_id);

-- Commission Adjustments Table
CREATE TABLE IF NOT EXISTS commission_adjustments (
  id VARCHAR(64) PRIMARY KEY,
  sales_rep_id VARCHAR(64) NOT NULL,
  commission_id VARCHAR(64) NOT NULL,
  refund_id VARCHAR(64),
  adjustment_type VARCHAR(32) NOT NULL,
  currency VARCHAR(8) NOT NULL,
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  recovery_status VARCHAR(32) NOT NULL DEFAULT 'NONE',
  notes TEXT,
  metadata_json TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comm_adj_rep ON commission_adjustments(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_comm_adj_comm ON commission_adjustments(commission_id);

-- Disputes Table
CREATE TABLE IF NOT EXISTS disputes (
  id VARCHAR(64) PRIMARY KEY,
  payment_id VARCHAR(64) NOT NULL,
  invoice_id VARCHAR(64) NOT NULL,
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency VARCHAR(8) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'OPENED' CHECK (status IN ('OPENED', 'EVIDENCE_REQUIRED', 'EVIDENCE_SUBMITTED', 'WON', 'LOST', 'DISPUTE_OPEN', 'DISPUTE_WON', 'DISPUTE_LOST')),
  provider_dispute_id VARCHAR(128),
  evidence_status VARCHAR(32) DEFAULT 'EVIDENCE_REQUIRED',
  evidence_submitted_at TIMESTAMPTZ,
  reason TEXT,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Ledger Accounts (Chart of Accounts for internal double-entry)
CREATE TABLE IF NOT EXISTS ledger_accounts (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(64) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  account_type VARCHAR(32) NOT NULL CHECK (account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE', 'CONTRA_REVENUE')),
  normal_balance VARCHAR(8) NOT NULL CHECK (normal_balance IN ('DEBIT', 'CREDIT')),
  currency VARCHAR(8) NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Webhook Events (Raw event audit & deduplication)
CREATE TABLE IF NOT EXISTS webhook_events (
  id VARCHAR(64) PRIMARY KEY,
  provider VARCHAR(32) NOT NULL,
  event_id VARCHAR(128) NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  payload_json TEXT NOT NULL,
  signature TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED', 'PROCESSED', 'FAILED', 'IGNORED')),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_event ON webhook_events(provider, event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);

-- Exchange Rates (Audit records for currency conversions)
CREATE TABLE IF NOT EXISTS exchange_rates (
  id VARCHAR(64) PRIMARY KEY,
  from_currency VARCHAR(8) NOT NULL,
  to_currency VARCHAR(8) NOT NULL,
  rate NUMERIC(18, 6) NOT NULL,
  rate_source VARCHAR(64) NOT NULL,
  source_timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reconciliation Runs (Automated comparison runs)
CREATE TABLE IF NOT EXISTS reconciliation_runs (
  id VARCHAR(64) PRIMARY KEY,
  run_type VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  discrepancy_count INTEGER NOT NULL DEFAULT 0,
  metrics_json TEXT,
  discrepancies_json TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Provider Payouts (Fulfillment/developer payouts decoupled from client payment)
CREATE TABLE IF NOT EXISTS provider_payouts (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL REFERENCES projects(id),
  provider_id VARCHAR(64) NOT NULL REFERENCES users(id),
  milestone_id VARCHAR(64) REFERENCES project_milestones(id),
  currency VARCHAR(8) NOT NULL,
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  status VARCHAR(32) NOT NULL DEFAULT 'NOT_ELIGIBLE' CHECK (status IN (
    'NOT_ELIGIBLE', 'ELIGIBLE', 'QUEUED', 'INITIATED', 'CONFIRMED', 'FAILED', 'MANUAL_REVIEW'
  )),
  idempotency_key VARCHAR(128) UNIQUE NOT NULL,
  eligible_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_payouts_project ON provider_payouts(project_id);
CREATE INDEX IF NOT EXISTS idx_provider_payouts_status ON provider_payouts(status);

-- Provider Recoveries (Clawback obligations from providers/reps)
CREATE TABLE IF NOT EXISTS provider_recoveries (
  id VARCHAR(64) PRIMARY KEY,
  entity_type VARCHAR(32) NOT NULL CHECK (entity_type IN ('REPRESENTATIVE', 'PROVIDER')),
  entity_id VARCHAR(64) NOT NULL,
  refund_id VARCHAR(64) REFERENCES refunds(id),
  dispute_id VARCHAR(64) REFERENCES disputes(id),
  currency VARCHAR(8) NOT NULL,
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  recovered_amount_minor BIGINT NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PARTIALLY_RECOVERED', 'RECOVERED', 'WRITTEN_OFF')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Financial Immutability Protection Trigger Function
CREATE OR REPLACE FUNCTION prevent_financial_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Financial Immutability Violation: DELETE is strictly prohibited on table %', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl_name text;
BEGIN
  FOR tbl_name IN SELECT unnest(ARRAY[
    'payments', 'refunds', 'ledger_transactions', 'ledger_entries', 'commission_payouts',
    'provider_payouts', 'disputes', 'webhook_events', 'provider_recoveries'
  ])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_prevent_delete ON %I;', tbl_name);
    EXECUTE format('CREATE TRIGGER trg_prevent_delete BEFORE DELETE ON %I FOR EACH ROW EXECUTE FUNCTION prevent_financial_delete();', tbl_name);
  END LOOP;
END $$;

-- Trigger to protect payments.amount_refunded_minor from direct client manipulation
CREATE OR REPLACE FUNCTION protect_payment_refund_cache()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.amount_refunded_minor <> OLD.amount_refunded_minor AND current_setting('codebridge.sync_trigger_active', true) IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'Financial Immutability Violation: Direct manipulation of payment refund cache is prohibited.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_payment_refund_cache ON payments;
CREATE TRIGGER trg_protect_payment_refund_cache
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION protect_payment_refund_cache();

-- Trigger to sync refunds to payments
CREATE OR REPLACE FUNCTION sync_payment_refund_cache()
RETURNS TRIGGER AS $$
DECLARE
  v_total_refunded BIGINT;
BEGIN
  -- Sum all successful refunds
  SELECT COALESCE(SUM(completed_amount_minor), 0)
  INTO v_total_refunded
  FROM refunds
  WHERE payment_id = COALESCE(NEW.payment_id, OLD.payment_id)
    AND status IN ('SUCCESSFUL', 'COMPLETED');

  -- We must use SET LOCAL to tell the protection trigger we are allowed to update
  PERFORM set_config('codebridge.sync_trigger_active', 'true', true);
  
  UPDATE payments
  SET amount_refunded_minor = v_total_refunded,
      remaining_refundable_minor = GREATEST(0, amount_minor - v_total_refunded),
      status = CASE WHEN v_total_refunded >= amount_minor THEN 'REFUNDED' ELSE status END,
      updated_at = NOW()
  WHERE id = COALESCE(NEW.payment_id, OLD.payment_id);
  
  PERFORM set_config('codebridge.sync_trigger_active', '', true);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_payment_refund_cache ON refunds;
CREATE TRIGGER trg_sync_payment_refund_cache
AFTER INSERT OR UPDATE OR DELETE ON refunds
FOR EACH ROW EXECUTE FUNCTION sync_payment_refund_cache();


-- Row Level Security (RLS) Enablement Across All Tables
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS service_role_all ON %I;', t);
    EXECUTE format('CREATE POLICY service_role_all ON %I FOR ALL TO service_role, postgres USING (true) WITH CHECK (true);', t);
  END LOOP;
END $$;

-- Ensure permissions for Supabase Studio and service roles
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;
`;

export async function setupSupabaseDatabase() {
  const dbUrl = getFallbackDbUrl();
  if (!dbUrl || (!dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://'))) {
    console.error('❌ Error: DIRECT_URL or DATABASE_URL must be configured with a PostgreSQL connection string.');
    console.error('   Example: postgresql://postgres.zmlaqqgjlqpzigrnxdsx:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres');
    throw new Error('Missing PostgreSQL connection string in DIRECT_URL or DATABASE_URL.');
  }

  console.log('⚡ Initializing CodeBridge Supabase PostgreSQL Database Setup...');
  const sql = postgres(dbUrl, {
    prepare: false,
    ssl: 'require',
    max: 1,
  });

  try {
    // 1. Create Schema: Tables, constraints, and indexes
    console.log('-> Applying PostgreSQL database schema (tables, foreign keys, constraints, and indexes)...');
    await sql.unsafe(POSTGRES_SCHEMA_SQL);
    console.log('   ✅ Successfully applied PostgreSQL schema statements and indexes.');

    // 2. Seed Countries (Nigeria and Kenya foundational records)
    console.log('-> Seeding foundational countries (Nigeria, Kenya)...');
    await sql`
      INSERT INTO countries (id, code, name, currency, phone_code, timezone, is_active)
      VALUES 
        ('c_ng', 'NG', 'Nigeria', 'NGN', '+234', 'Africa/Lagos', 1),
        ('c_ke', 'KE', 'Kenya', 'KES', '+254', 'Africa/Nairobi', 1)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        currency = EXCLUDED.currency,
        phone_code = EXCLUDED.phone_code,
        timezone = EXCLUDED.timezone,
        is_active = EXCLUDED.is_active;
    `;
    console.log('   ✅ Seeded Nigeria (NGN) and Kenya (KES).');

    // 3. Seed Services Catalog Entries (Foundational + Mobile Services + Third-Party Fees)
    console.log('-> Seeding service catalog items (CodeBridge Services & Third-Party Accounts)...');
    for (const service of FOUNDATIONAL_SERVICES) {
      await sql`
        INSERT INTO services (id, code, name, description, category, base_price_minor, currency, item_type, platform, billing_type, is_price_configured, is_active)
        VALUES (${service[0]}, ${service[1]}, ${service[2]}, ${service[3]}, ${service[4]}, ${service[5]}, ${service[6]}, ${service[7]}, ${service[8]}, ${service[9]}, ${service[10]}, ${service[11]})
        ON CONFLICT (id) DO UPDATE SET
          code = EXCLUDED.code,
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          category = EXCLUDED.category,
          base_price_minor = EXCLUDED.base_price_minor,
          currency = EXCLUDED.currency,
          item_type = EXCLUDED.item_type,
          platform = EXCLUDED.platform,
          billing_type = EXCLUDED.billing_type,
          is_price_configured = EXCLUDED.is_price_configured,
          is_active = EXCLUDED.is_active;
      `;
    }
    console.log(`   ✅ Seeded ${FOUNDATIONAL_SERVICES.length} service catalog entries.`);

    // 3b. Seed standard double-entry chart of accounts (ledger_accounts)
    console.log('-> Seeding standard double-entry chart of accounts (ledger_accounts)...');
    const standardAccounts = [
      { id: 'la_gw_kes', code: 'GATEWAY_KES_BALANCE', name: 'Gateway KES Balance', type: 'ASSET', normal: 'DEBIT', currency: 'KES' },
      { id: 'la_gw_ngn', code: 'GATEWAY_NGN_BALANCE', name: 'Gateway NGN Balance', type: 'ASSET', normal: 'DEBIT', currency: 'NGN' },
      { id: 'la_bank_ngn', code: 'BANK_NGN_BALANCE', name: 'Nigerian Bank Settlement Balance', type: 'ASSET', normal: 'DEBIT', currency: 'NGN' },
      { id: 'la_settle_transit', code: 'SETTLEMENT_IN_TRANSIT', name: 'Settlement in Transit', type: 'ASSET', normal: 'DEBIT', currency: 'NGN' },
      { id: 'la_rec_receivable', code: 'RECOVERY_RECEIVABLE', name: 'Provider Recovery Receivable', type: 'ASSET', normal: 'DEBIT', currency: 'KES' },
      { id: 'la_biz_cash', code: 'BUSINESS_CASH', name: 'General Business Cash', type: 'ASSET', normal: 'DEBIT', currency: 'KES' },
      { id: 'la_client_funds', code: 'CLIENT_FUNDS_LIABILITY', name: 'Client Unearned Funds Liability', type: 'LIABILITY', normal: 'CREDIT', currency: 'KES' },
      { id: 'la_client_rec', code: 'CLIENT_RECEIVABLE', name: 'Outstanding Client Invoice Receivable', type: 'LIABILITY', normal: 'DEBIT', currency: 'KES' },
      { id: 'la_prov_payable', code: 'PROVIDER_PAYABLE', name: 'Provider Fulfillment Payable', type: 'LIABILITY', normal: 'CREDIT', currency: 'KES' },
      { id: 'la_rep_payable', code: 'REPRESENTATIVE_COMMISSION_PAYABLE', name: 'Representative Commission Payable', type: 'LIABILITY', normal: 'CREDIT', currency: 'KES' },
      { id: 'la_comm_payable', code: 'COMMISSION_PAYABLE', name: 'Accrued Commission Payable', type: 'LIABILITY', normal: 'CREDIT', currency: 'KES' },
      { id: 'la_ref_liability', code: 'REFUND_LIABILITY', name: 'Customer Refund Liability', type: 'LIABILITY', normal: 'CREDIT', currency: 'KES' },
      { id: 'la_tax_payable', code: 'TAX_PAYABLE', name: 'Sales / Withholding Tax Payable', type: 'LIABILITY', normal: 'CREDIT', currency: 'KES' },
      { id: 'la_cb_rev', code: 'CODEBRIDGE_REVENUE', name: 'Recognized CodeBridge Revenue', type: 'REVENUE', normal: 'CREDIT', currency: 'KES' },
      { id: 'la_cb_rev_def', code: 'CODEBRIDGE_REVENUE_DEFERRED', name: 'Deferred CodeBridge Revenue', type: 'EQUITY', normal: 'CREDIT', currency: 'KES' },
      { id: 'la_fee_exp', code: 'GATEWAY_FEE_EXPENSE', name: 'Payment Gateway Processing Fee', type: 'EXPENSE', normal: 'DEBIT', currency: 'KES' },
      { id: 'la_ref_exp', code: 'REFUND_EXPENSE', name: 'Client Refund Expense', type: 'CONTRA_REVENUE', normal: 'DEBIT', currency: 'KES' },
      { id: 'la_ref_fee_exp', code: 'REFUND_FEE_EXPENSE', name: 'Provider Refund Fee Expense', type: 'EXPENSE', normal: 'DEBIT', currency: 'KES' },
      { id: 'la_comm_exp', code: 'COMMISSION_EXPENSE', name: 'Sales Representative Commission Expense', type: 'EXPENSE', normal: 'DEBIT', currency: 'KES' },
      { id: 'la_fx_gain', code: 'FX_GAIN', name: 'Foreign Exchange Gain', type: 'REVENUE', normal: 'CREDIT', currency: 'NGN' },
      { id: 'la_fx_loss', code: 'FX_LOSS', name: 'Foreign Exchange Loss', type: 'EXPENSE', normal: 'DEBIT', currency: 'NGN' },
      { id: 'la_cb_exp', code: 'CHARGEBACK_EXPENSE', name: 'Dispute / Chargeback Loss', type: 'EXPENSE', normal: 'DEBIT', currency: 'KES' },
      { id: 'la_bad_debt', code: 'BAD_DEBT_EXPENSE', name: 'Unrecoverable Bad Debt Expense', type: 'EXPENSE', normal: 'DEBIT', currency: 'KES' },
    ];
    for (const acc of standardAccounts) {
      await sql`
        INSERT INTO ledger_accounts (id, code, name, account_type, normal_balance, currency, is_active)
        VALUES (${acc.id}, ${acc.code}, ${acc.name}, ${acc.type}, ${acc.normal}, ${acc.currency}, 1)
        ON CONFLICT (code) DO NOTHING;
      `;
    }
    console.log('   ✅ Seeded standard chart of accounts.');

    // 4. Seed Initial Super Admin (Credentials MUST come from environment variables)
    const adminEmail = process.env.ADMIN_INITIAL_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error('❌ CRITICAL: ADMIN_INITIAL_EMAIL and ADMIN_INITIAL_PASSWORD must be configured.');
      console.error('   Production credentials must never be hardcoded.');
      throw new Error('Missing ADMIN_INITIAL_EMAIL or ADMIN_INITIAL_PASSWORD environment variables.');
    }

    if (adminPassword.length < 12) {
      console.error('❌ CRITICAL: ADMIN_INITIAL_PASSWORD must be at least 12 characters for production security.');
      throw new Error('ADMIN_INITIAL_PASSWORD must be at least 12 characters.');
    }

    console.log(`-> Provisioning Initial Super Admin (${adminEmail})...`);
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const adminUserId = 'u_superadmin_initial';

    const existingUsers = await sql`SELECT id FROM users WHERE email = ${adminEmail}`;

    if (existingUsers.length === 0) {
      await sql`
        INSERT INTO users (id, email, password_hash, role, status, email_verified, created_at, updated_at)
        VALUES (${adminUserId}, ${adminEmail}, ${passwordHash}, 'SUPER_ADMIN', 'ACTIVE', 1, NOW(), NOW())
      `;
      await sql`
        INSERT INTO user_profiles (user_id, first_name, last_name, phone, country_id, timezone, updated_at)
        VALUES (${adminUserId}, 'CodeBridge', 'SuperAdmin', '', 'c_ng', 'Africa/Lagos', NOW())
        ON CONFLICT (user_id) DO NOTHING
      `;
      console.log(`   ✅ Initial Super Admin created for ${adminEmail}.`);
    } else {
      const existingId = existingUsers[0].id;
      await sql`
        UPDATE users
        SET password_hash = ${passwordHash}, role = 'SUPER_ADMIN', status = 'ACTIVE', email_verified = 1, updated_at = NOW()
        WHERE id = ${existingId}
      `;
      console.log(`   ℹ️ Existing user ${adminEmail} verified and updated as active SUPER_ADMIN.`);
    }

    // 5. Seed Territories and System Service Users
    console.log('-> Seeding foundational territories (NG, KE, GH, ZA, UG)...');
    const defaultTerritories = [
      { id: 'NG', name: 'Nigeria', currency: 'NGN', method: 'BANK', bps: 2000, directAdmin: true },
      { id: 'KE', name: 'Kenya', currency: 'KES', method: 'MPESA', bps: 2000, directAdmin: false },
      { id: 'GH', name: 'Ghana', currency: 'GHS', method: 'MOBILE_MONEY', bps: 2000, directAdmin: false },
      { id: 'ZA', name: 'South Africa', currency: 'ZAR', method: 'BANK', bps: 2000, directAdmin: false },
      { id: 'UG', name: 'Uganda', currency: 'UGX', method: 'MOBILE_MONEY', bps: 2000, directAdmin: false },
    ];

    for (const t of defaultTerritories) {
      await sql`
        INSERT INTO territories (id, country_name, currency, default_payout_method, default_commission_rate_bps, direct_admin, is_active)
        VALUES (${t.id}, ${t.name}, ${t.currency}, ${t.method}, ${t.bps}, ${t.directAdmin}, 1)
        ON CONFLICT (id) DO UPDATE SET
          country_name = EXCLUDED.country_name,
          currency = EXCLUDED.currency,
          default_payout_method = EXCLUDED.default_payout_method,
          default_commission_rate_bps = EXCLUDED.default_commission_rate_bps,
          direct_admin = EXCLUDED.direct_admin;
      `;
    }
    console.log('   ✅ Seeded 5 territories.');

    // Seed system_flutterwave automated user for webhook ledger integrity
    await sql`
      INSERT INTO users (id, email, password_hash, role, status, email_verified)
      VALUES ('system_flutterwave', 'system.flutterwave@code-bridge-rosy.vercel.app', 'LOCKED_SYSTEM_KEY', 'ADMIN', 'ACTIVE', 1)
      ON CONFLICT (id) DO NOTHING;
    `;
    console.log('   ✅ Seeded system_flutterwave automated user.');

    console.log('\n✨ CodeBridge Supabase PostgreSQL Database Setup completed idempotently!');
    console.log('   No demo data, mock leads, mock proposals, or test transactions were seeded.');
  } finally {
    await sql.end({ timeout: 2 });
  }
}

// CLI runner
if (process.argv[1] && process.argv[1].includes('setup-supabase')) {
  setupSupabaseDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal Supabase setup error:', err);
      process.exit(1);
    });
}
