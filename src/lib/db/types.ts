// src/lib/db/types.ts

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'COUNTRY_MANAGER'
  | 'REPRESENTATIVE'
  | 'DEVELOPER'
  | 'CLIENT';

export type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';

export type RepApprovalStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';

export type ReferralSource = 'DIRECT' | 'REFERRAL' | 'OTHER';

export type MessageType = 'CHAT' | 'SYSTEM' | 'PROPOSAL_UPDATE' | 'CHANGE_REQUEST';

export type ChangeRequestStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'IMPLEMENTED';

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'REQUIREMENTS_COLLECTED'
  | 'PROPOSAL'
  | 'WON'
  | 'LOST';

export type ProjectStatus =
  | 'DRAFT'
  | 'AWAITING_PAYMENT'
  | 'PLANNING'
  | 'DEVELOPMENT'
  | 'INTERNAL_REVIEW'
  | 'CLIENT_REVIEW'
  | 'REVISION'
  | 'APPROVED'
  | 'DEPLOYMENT'
  | 'COMPLETED'
  | 'MAINTENANCE';

export type CommissionStatus =
  | 'PENDING'
  | 'AVAILABLE'
  | 'PROCESSING'
  | 'PAID'
  | 'CANCELLED'
  | 'DISPUTED';

export type ProposalStatus =
  | 'DRAFT'
  | 'SENT'
  | 'VIEWED'
  | 'CLIENT_APPROVED'
  | 'CLIENT_REJECTED'
  | 'EXPIRED'
  | 'CANCELLED';

export type PaymentStructureType = 'FULL_UPFRONT' | 'DEPOSIT_MILESTONES' | 'CUSTOM';

export type PaymentScheduleStatus =
  | 'SCHEDULED'
  | 'INVOICEABLE'
  | 'INVOICED'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export type BillingTrigger =
  | 'UPFRONT_APPROVAL'
  | 'MILESTONE_STARTED'
  | 'MILESTONE_COMPLETED'
  | 'MANUAL_RELEASE';

export type InvoiceStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export type PaymentMethod =
  | 'BANK_TRANSFER'
  | 'CASH'
  | 'OTHER_MANUAL'
  | 'GATEWAY_SIMULATION'
  | 'MPESA'
  | 'CARD'
  | 'FLUTTERWAVE';

export type VerificationSource =
  | 'MANUAL_VERIFICATION'
  | 'BANK_TRANSFER_CONFIRMATION'
  | 'GATEWAY_SIMULATION'
  | 'FLUTTERWAVE_WEBHOOK'
  | 'M_PESA_CALLBACK';

export type ServiceItemType = 'CODEBRIDGE_SERVICE' | 'THIRD_PARTY_FEE' | 'REIMBURSABLE_EXPENSE';
export type ServicePlatform = 'ALL' | 'WEB' | 'MOBILE' | 'ANDROID' | 'IOS' | 'CROSS_PLATFORM' | 'CLOUD';
export type BillingType = 'PROJECT' | 'MILESTONE' | 'MONTHLY' | 'YEARLY' | 'ONE_OFF';
export type AppStoreOwnership = 'CLIENT_OWNED' | 'CODEBRIDGE_MANAGED';

export type CurrencyCode = 'NGN' | 'KES' | 'USD';

export interface Country {
  id: string;
  code: string; // NG, KE
  name: string; // Nigeria, Kenya
  currency: CurrencyCode;
  phone_code: string; // +234, +254
  timezone: string; // Africa/Lagos, Africa/Nairobi
  is_active: number;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  status: UserStatus;
  email_verified: number;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  country_id: string;
  timezone: string;
  avatar_url?: string;
  updated_at: string;
}

export interface Representative {
  id: string;
  user_id: string;
  country_id: string;
  approval_status: RepApprovalStatus;
  commission_rate_bps: number; // 2000 = 20.00%
  referral_code?: string;
  approved_at?: string;
  approved_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  lead_id?: string;
  company_name: string;
  industry?: string;
  country_id: string;
  representative_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  client_id?: string;
  business_name: string;
  contact_person: string;
  email: string;
  phone: string;
  country_id: string;
  business_type: string;
  requirements: string;
  service_id?: string;
  timeline?: string;
  estimated_budget_minor: number; // In minor currency units (e.g. cents/kobo)
  currency: CurrencyCode;
  referral_source: ReferralSource;
  representative_id?: string;
  status: LeadStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  base_price_minor: number;
  currency: CurrencyCode;
  item_type?: ServiceItemType;
  platform?: ServicePlatform;
  billing_type?: BillingType;
  is_price_configured?: number;
  is_active: number;
}

export interface Project {
  id: string;
  code: string;
  title: string;
  description: string;
  client_id: string;
  representative_id?: string;
  lead_id?: string;
  service_id?: string;
  status: ProjectStatus;
  payment_status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  budget_minor: number;
  total_paid_minor: number;
  currency: CurrencyCode;
  country_id: string;
  start_date?: string;
  started_at?: string;
  target_completion_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  title: string;
  description: string;
  order_index: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  due_date?: string;
  created_at: string;
}

export interface PaymentSchedule {
  id: string;
  proposal_id: string;
  project_id?: string;
  schedule_type: PaymentStructureType;
  name: string;
  order_index: number;
  percentage_bps: number; // 10000 = 100.00%
  amount_minor: number;
  currency: CurrencyCode;
  is_required_to_start: number; // 1 or 0
  billing_trigger: BillingTrigger;
  status: PaymentScheduleStatus;
  invoice_id?: string;
  milestone_id?: string;
  due_date?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string; // e.g. INV-KES-2026-0001
  proposal_id?: string;
  project_id: string;
  client_id: string;
  representative_id?: string;
  payment_schedule_id?: string;
  title: string;
  description?: string;
  amount_minor: number;
  amount_paid_minor: number;
  codebridge_amount_minor?: number;
  third_party_reimbursement_minor?: number;
  line_items_json?: string;
  currency: CurrencyCode;
  status: InvoiceStatus;
  due_date: string;
  issued_at: string;
  paid_at?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export type PaymentStatus =
  | 'INITIATED'
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'SETTLED'
  | 'FAILED'
  | 'EXPIRED'
  | 'CONFIRMED'
  | 'SUCCESSFUL'
  | 'CANCELLED'
  | 'REFUNDED';

export interface Payment {
  id: string;
  invoice_id: string;
  project_id: string;
  client_id?: string;
  provider_id?: string;
  amount_minor: number;
  currency: CurrencyCode;
  payment_method: PaymentMethod;
  verification_source: VerificationSource;
  status: PaymentStatus;
  reference: string;
  gateway?: string;
  gateway_transaction_id?: string;
  gateway_reference?: string;
  gross_amount_minor?: number;
  gateway_fee_minor?: number;
  net_amount_minor?: number;
  transaction_currency?: CurrencyCode | string;
  amount_transaction_minor?: number;
  settlement_status?: 'PENDING' | 'SETTLED' | 'NOT_APPLICABLE';
  settlement_currency?: CurrencyCode | string;
  settlement_amount_minor?: number;
  settlement_exchange_rate?: number;
  exchange_rate_source?: string;
  settlement_destination?: string;
  amount_refunded_minor?: number;
  remaining_refundable_minor?: number;
  payout_status?: 'RESERVED' | 'ELIGIBLE' | 'PARTIALLY_RELEASED' | 'RELEASED';
  metadata_json?: string;
  paid_at?: string;
  verified_at: string;
  verified_by: string;
  verification_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface CommissionEvent {
  id: string;
  payment_id: string;
  invoice_id: string;
  project_id: string;
  proposal_id?: string;
  representative_id: string;
  currency: CurrencyCode;
  verified_amount_minor: number;
  commission_rate_bps_at_time_of_payment: number;
  calculated_commission_amount_minor: number;
  verified_at: string;
  idempotency_key: string; // e.g. COMMISSION_PAYMENT_<payment_id>
  status: 'RECORDED' | 'PROCESSED' | 'FLAGGED';
  created_at: string;
}

export interface Commission {
  id: string;
  project_id: string;
  representative_id: string;
  rate_bps: number; // 2000 = 20%
  base_amount_minor: number;
  commission_amount_minor: number;
  currency: CurrencyCode;
  status: CommissionStatus;
  basis_snapshot_json?: string;
  eligible_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CommissionLedger {
  id: string;
  commission_id: string;
  representative_id: string;
  type: 'CREDIT' | 'DEBIT' | 'HOLD';
  amount_minor: number;
  currency: CurrencyCode;
  notes?: string;
  created_at: string;
}

export type DoubleEntryAccount =
  // Cash / Asset Locations (Physical Accounts)
  | 'GATEWAY_KES_BALANCE'
  | 'GATEWAY_NGN_BALANCE'
  | 'BANK_NGN_BALANCE'
  | 'SETTLEMENT_IN_TRANSIT'
  | 'BUSINESS_CASH'
  | 'RECOVERY_RECEIVABLE'
  // Liabilities (Obligations)
  | 'CLIENT_FUNDS_LIABILITY'
  | 'CLIENT_RECEIVABLE'
  | 'PROVIDER_PAYABLE'
  | 'REPRESENTATIVE_COMMISSION_PAYABLE'
  | 'COMMISSION_PAYABLE'
  | 'REFUND_LIABILITY'
  | 'TAX_PAYABLE'
  // Equity & Revenues
  | 'CODEBRIDGE_REVENUE'
  | 'CODEBRIDGE_REVENUE_DEFERRED'
  // Expenses & Contra-Revenues
  | 'GATEWAY_FEE_EXPENSE'
  | 'REFUND_EXPENSE'
  | 'REFUND_FEE_EXPENSE'
  | 'COMMISSION_EXPENSE'
  | 'FX_GAIN'
  | 'FX_LOSS'
  | 'CHARGEBACK_EXPENSE'
  | 'BAD_DEBT_EXPENSE';

export interface LedgerAccount {
  id: string;
  code: string;
  name: string;
  account_type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE' | 'CONTRA_REVENUE';
  normal_balance: 'DEBIT' | 'CREDIT';
  currency: string;
  is_active: number;
  created_at: string;
}

export type LedgerEntryType =
  | 'PAYMENT'
  | 'COMMISSION'
  | 'PAYOUT'
  | 'REFUND'
  | 'REVERSAL'
  | 'DISPUTE'
  | 'RECOVERY'
  | 'RECOVERY_OFFSET'
  | 'ADJUSTMENT';

export interface LedgerEntry {
  id: string;
  entry_type: LedgerEntryType;
  account_debited: DoubleEntryAccount | string;
  account_credited: DoubleEntryAccount | string;
  currency: CurrencyCode | string;
  amount_minor: number;
  invoice_id?: string | null;
  payment_id?: string | null;
  sales_rep_id?: string | null;
  project_id?: string | null;
  client_id?: string | null;
  reference: string;
  notes?: string | null;
  metadata_json?: string | null;
  created_at: string;
}

export interface Territory {
  id: string;
  country_name: string;
  currency: string;
  default_payout_method: 'BANK' | 'MPESA' | 'MOBILE_MONEY';
  default_commission_rate_bps: number;
  is_active: number;
  created_at: string;
}

export type CommissionPayoutStatus =
  | 'NOT_ELIGIBLE'
  | 'ELIGIBLE'
  | 'QUEUED'
  | 'INITIATED'
  | 'CONFIRMED'
  | 'PAID'
  | 'PROCESSING'
  | 'FAILED'
  | 'ACTION_REQUIRED'
  | 'MANUAL_REVIEW'
  | 'CANCELLED';

export interface CommissionPayout {
  id: string;
  sales_rep_id: string;
  commission_id?: string | null;
  currency: string;
  amount_minor: number;
  payout_method: 'MPESA' | 'BANK';
  payout_destination: string;
  status: CommissionPayoutStatus;
  idempotency_key: string;
  provider: string;
  provider_transfer_id?: string | null;
  provider_reference?: string | null;
  failure_reason?: string | null;
  retry_count: number;
  last_attempt_at?: string | null;
  paid_at?: string | null;
  metadata_json?: string | null;
  created_at: string;
  updated_at: string;
}

export type RefundStatus =
  | 'REQUESTED'
  | 'UNDER_REVIEW'
  | 'REJECTED'
  | 'APPROVED'
  | 'INSUFFICIENT_FUNDS'
  | 'INITIATED'
  | 'PROCESSING'
  | 'SUCCESSFUL'
  | 'FAILED'
  | 'MANUAL_INTERVENTION_REQUIRED'
  | 'ABANDONED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Refund {
  id: string;
  payment_id: string;
  invoice_id: string;
  project_id?: string | null;
  client_id?: string | null;
  sales_rep_id?: string | null;
  currency: string;
  amount_minor: number;
  completed_amount_minor: number;
  requested_amount_minor?: number;
  approved_amount_minor?: number;
  commission_reversal_minor: number;
  status: RefundStatus;
  refund_reference: string;
  provider_refund_id?: string | null;
  provider_reference?: string | null;
  reason?: string | null;
  failure_reason?: string | null;
  retry_count?: number;
  original_refund_id?: string | null;
  idempotency_key?: string | null;
  shortfall_minor?: number;
  operational_block_reason?: string | null;
  created_at: string;
  approved_at?: string | null;
  initiated_at?: string | null;
  completed_at?: string | null;
  failed_at?: string | null;
  updated_at: string;
}

export type CommissionAdjustmentType = 'REFUND_REVERSAL' | 'DISPUTE_REVERSAL' | 'RECOVERY_OFFSET' | 'MANUAL_CORRECTION';
export type RecoveryStatus = 'NONE' | 'RECOVERY_PENDING' | 'RECOVERED';

export interface CommissionAdjustment {
  id: string;
  sales_rep_id: string;
  commission_id: string;
  refund_id?: string | null;
  adjustment_type: CommissionAdjustmentType;
  currency: string;
  amount_minor: number;
  recovery_status: RecoveryStatus;
  notes?: string | null;
  metadata_json?: string | null;
  created_at: string;
}

export type DisputeStatus =
  | 'OPENED'
  | 'EVIDENCE_REQUIRED'
  | 'EVIDENCE_SUBMITTED'
  | 'WON'
  | 'LOST'
  | 'DISPUTE_OPEN'
  | 'DISPUTE_WON'
  | 'DISPUTE_LOST';

export interface Dispute {
  id: string;
  payment_id: string;
  invoice_id: string;
  amount_minor: number;
  currency: string;
  status: DisputeStatus;
  provider_dispute_id?: string | null;
  evidence_status?: string | null;
  evidence_submitted_at?: string | null;
  reason?: string | null;
  resolution_notes?: string | null;
  created_at: string;
  resolved_at?: string | null;
}

export interface WebhookEvent {
  id: string;
  provider: string;
  event_id: string;
  event_type: string;
  payload_json: string;
  signature?: string | null;
  status: 'RECEIVED' | 'PROCESSED' | 'FAILED' | 'IGNORED';
  processed_at?: string | null;
  error_message?: string | null;
  created_at: string;
}

export interface ExchangeRate {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  rate_source: string;
  source_timestamp: string;
  created_at: string;
}

export interface ReconciliationRun {
  id: string;
  run_type: string;
  status: string;
  discrepancy_count: number;
  metrics_json?: string | null;
  discrepancies_json?: string | null;
  started_at: string;
  completed_at?: string | null;
}

export type ProviderPayoutStatus =
  | 'NOT_ELIGIBLE'
  | 'ELIGIBLE'
  | 'QUEUED'
  | 'INITIATED'
  | 'CONFIRMED'
  | 'FAILED'
  | 'MANUAL_REVIEW';

export interface ProviderPayout {
  id: string;
  project_id: string;
  provider_id: string;
  milestone_id?: string | null;
  currency: string;
  amount_minor: number;
  status: ProviderPayoutStatus;
  idempotency_key: string;
  eligible_at?: string | null;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type ProviderRecoveryStatus = 'OPEN' | 'PARTIALLY_RECOVERED' | 'RECOVERED' | 'WRITTEN_OFF';

export interface ProviderRecovery {
  id: string;
  entity_type: 'REPRESENTATIVE' | 'PROVIDER';
  entity_id: string;
  refund_id?: string | null;
  dispute_id?: string | null;
  currency: string;
  amount_minor: number;
  recovered_amount_minor: number;
  status: ProviderRecoveryStatus;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity: string;
  entity_id?: string;
  metadata_json?: string;
  ip_address?: string;
  created_at: string;
}

export interface ProposalLineItem {
  id: string;
  name: string;
  description?: string;
  item_type: ServiceItemType;
  platform?: ServicePlatform;
  amount_minor: number;
  currency: CurrencyCode;
  is_included_in_total: boolean;
  note?: string;
}

export interface Proposal {
  id: string;
  proposal_number: string;
  version: number;
  is_current: number; // 1 for active version, 0 for superseded
  lead_id?: string;
  client_id: string;
  project_id?: string;
  representative_id?: string;
  title: string;
  scope_of_work: string;
  deliverables_json: string; // JSON array of string deliverables
  line_items_json?: string; // JSON array of ProposalLineItem
  codebridge_total_minor?: number;
  third_party_total_minor?: number;
  app_store_ownership?: AppStoreOwnership;
  store_approval_disclaimer?: string;
  payment_structure_type?: PaymentStructureType;
  payment_schedule_json?: string; // JSON array of schedule items
  total_amount_minor: number;
  currency: CurrencyCode;
  status: ProposalStatus;
  valid_until?: string;
  terms_notes?: string;
  rejection_reason?: string;
  created_by?: string;
  sent_at?: string;
  viewed_at?: string;
  approved_at?: string;
  approved_version?: number;
  rejected_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: number;
  link_url?: string;
  created_at: string;
}

export interface Message {
  id: string;
  project_id?: string;
  lead_id?: string;
  message_type: MessageType;
  sender_id: string;
  recipient_id?: string;
  content: string;
  created_at: string;
}

export interface MessageReadCursor {
  id: string;
  user_id: string;
  lead_id?: string;
  project_id?: string;
  last_read_at: string;
  updated_at: string;
}

export interface ChangeRequest {
  id: string;
  project_id: string;
  proposal_id?: string;
  requested_by: string;
  title: string;
  description: string;
  impact_assessment?: string;
  status: ChangeRequestStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  requires_proposal_revision: number;
  new_proposal_id?: string;
  created_at: string;
  updated_at: string;
}

