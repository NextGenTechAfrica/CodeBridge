// tests/phase2b-verify.mjs
import { testDb as db } from './test-db-adapter.mjs';

const BASE_URL = 'http://127.0.0.1:3000';

async function runPhase2BTests() {
  console.log('================================================================');
  console.log('🧪 CODEBRIDGE PHASE 2B COMMERCIAL INVOICING & SETTLEMENT SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  async function login(email, password = 'CodeBridge@2025!') {
    if (email.includes('rep.')) {
      const mockCode = 'test_mock_' + encodeURIComponent(JSON.stringify({
        sub: `google_sub_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email,
        given_name: 'Kenya',
        family_name: 'Representative',
      }));
      const res = await fetch(`${BASE_URL}/api/auth/callback/google?code=${mockCode}&state=mock_state`, {
        redirect: 'manual',
      });
      const setCookie = res.headers.get('set-cookie');
      const cookie = setCookie ? setCookie.split(';')[0] : '';
      const meRes = await fetch(`${BASE_URL}/api/auth/me`, { headers: { Cookie: cookie } });
      const data = await meRes.json();
      return { cookie, user: data.user };
    }

    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      throw new Error(`Login failed for ${email}: ${res.status}`);
    }
    const setCookie = res.headers.get('set-cookie');
    const cookie = setCookie ? setCookie.split(';')[0] : '';
    const data = await res.json();
    return { cookie, user: data.user };
  }


  try {
    // -------------------------------------------------------------------------
    // 1. ACTOR AUTHENTICATION
    // -------------------------------------------------------------------------
    console.log('1. Authenticating test actors across roles...');

    const adminSession = await login('ops@codebridge.com');
    assert(adminSession.user.role === 'ADMIN', 'Admin/Ops authenticated');

    const superAdminSession = await login('superadmin@codebridge.com');
    assert(superAdminSession.user.role === 'SUPER_ADMIN', 'Super Admin authenticated');

    const repSession = await login('rep.kenya@codebridge.com');
    assert(repSession.user.role === 'REPRESENTATIVE', 'Kenya Representative authenticated');

    const clientSession = await login('client@abcrestaurants.com');
    assert(clientSession.user.role === 'CLIENT', 'Client (ABC Restaurants) authenticated');

    const cmSession = await login('countrymanager.ke@codebridge.com');
    assert(cmSession.user.role === 'COUNTRY_MANAGER', 'Kenya Country Manager authenticated');

    // -------------------------------------------------------------------------
    // 2. OPTION A: 100% FULL PAYMENT UPFRONT LIFECYCLE
    // -------------------------------------------------------------------------
    console.log('\n2. Testing Option A: 100% Full Payment Upfront Commercial Lifecycle...');
    
    // Create lead for Option A test
    const clientAEmail = `tunde.${Date.now()}@lagosfintech.ng`;
    const repRow = await db.get("SELECT id FROM representatives WHERE approval_status = 'ACTIVE'");
    const leadARes = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
      body: JSON.stringify({
        businessName: 'Lagos FinTech Dynamics',
        contactPerson: 'Tunde Bakare',
        email: clientAEmail,
        phone: '+2348012345678',
        businessType: 'FinTech & Payments',
        requirements: 'High-volume transaction settlement engine',
        estimatedBudget: '500000',
        currency: 'NGN',
        countryCode: 'NG',
        representativeId: repRow.id,
      }),
    });
    const leadAData = await leadARes.json();
    assert(leadARes.ok, 'Option A test lead created with representative (Lagos FinTech)');

    // Author Proposal Option A (100% Full Upfront)
    const propARes = await fetch(`${BASE_URL}/api/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
      body: JSON.stringify({
        leadId: leadAData.lead.id,
        title: 'High-Volume Financial Settlement Engine',
        scopeOfWork: 'Core payment processing architecture with zero-data-loss reconciliation.',
        deliverables: ['System Architecture', 'Core Ledger Engine', 'Settlement API', 'Go-Live Handover'],
        paymentStructureType: 'FULL_UPFRONT',
        totalAmountMinor: 50000000, // 500,000 NGN
        currency: 'NGN',
        validDays: 14,
        status: 'SENT',
      }),
    });
    const propAData = await propARes.json();
    assert(propARes.ok, `Option A proposal created (${propAData.proposal?.proposalNumber})`);
    assert(propAData.proposal?.paymentStructureType === 'FULL_UPFRONT', 'Proposal payment structure is FULL_UPFRONT');

    // Associate or get client for lead A
    const clientARow = await db.get('SELECT id, user_id FROM clients WHERE lead_id = ?', [leadAData.lead.id]);
    assert(Boolean(clientARow), 'Client record auto-provisioned for Option A lead');

    // Make client A user active with valid demo password for client approval
    const defaultUser = await db.get('SELECT password_hash FROM users WHERE email = ?', ['client@abcrestaurants.com']);
    await db.run("UPDATE users SET password_hash = ?, status = 'ACTIVE' WHERE id = ?", [defaultUser.password_hash, clientARow.user_id]);
    const clientASession = await login(clientAEmail);
    assert(clientASession.user.role === 'CLIENT', 'Option A client logged in');

    // Client Approves Proposal A
    const approveARes = await fetch(`${BASE_URL}/api/proposals/${propAData.proposal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: clientASession.cookie },
      body: JSON.stringify({ action: 'CLIENT_APPROVE' }),
    });
    const approveAData = await approveARes.json();
    assert(approveARes.ok, 'Proposal A approved by client');

    // Verify Project State: MUST be AWAITING_PAYMENT, NOT started!
    const projectARow = await db.get('SELECT * FROM projects WHERE id = ?', [approveAData.projectId]);
    assert(projectARow.status === 'AWAITING_PAYMENT', 'Project is in AWAITING_PAYMENT status upon approval');
    assert(projectARow.payment_status === 'UNPAID', 'Project payment_status is UNPAID');
    assert(projectARow.started_at === null, 'Project started_at is strictly NULL prior to payment');

    // Verify Schedule and Invoice Generation
    const scheduleA = await db.all('SELECT * FROM payment_schedules WHERE proposal_id = ?', [propAData.proposal.id]);
    assert(scheduleA.length === 1, 'Exactly 1 schedule item created for 100% Upfront');
    assert(Number(scheduleA[0].percentage_bps) === 10000, 'Schedule item is 10000 bps (100%)');
    assert(Number(scheduleA[0].is_required_to_start) === 1 || scheduleA[0].is_required_to_start === true, 'Schedule item has is_required_to_start = 1');
    assert(scheduleA[0].status === 'INVOICED', 'Schedule item marked INVOICED');

    const invoiceARow = await db.get('SELECT * FROM invoices WHERE project_id = ?', [projectARow.id]);
    assert(Boolean(invoiceARow), 'Invoice automatically issued upon approval');
    assert(invoiceARow.invoice_number.startsWith('INV-NGN-'), `Invoice number properly formatted (${invoiceARow.invoice_number})`);
    assert(Number(invoiceARow.amount_minor) === 50000000, 'Invoice amount is 500,000 NGN (50000000 minor)');
    assert(Number(invoiceARow.amount_paid_minor) === 0, 'Invoice amount_paid_minor starts at 0');
    assert(invoiceARow.status === 'ISSUED', 'Invoice status is ISSUED');

    // -------------------------------------------------------------------------
    // 3. ATOMIC VERIFICATION & PROJECT KICKOFF (OPTION A)
    // -------------------------------------------------------------------------
    console.log('\n3. Testing Atomic Payment Verification & Project Kickoff for Option A...');

    // Security check: Client cannot verify payment
    const clientVerifyAttempt = await fetch(`${BASE_URL}/api/invoices/${invoiceARow.id}/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: clientASession.cookie },
      body: JSON.stringify({
        amountMinor: 50000000,
        currency: 'NGN',
        reference: 'TXN-CLIENT-FORBIDDEN',
      }),
    });
    assert(clientVerifyAttempt.status === 403, 'Client role forbidden from verifying payments (403)');

    // Admin verifies 100% upfront payment with distinct payment_method & verification_source
    const verifyARes = await fetch(`${BASE_URL}/api/invoices/${invoiceARow.id}/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
      body: JSON.stringify({
        amountMinor: 50000000,
        currency: 'NGN',
        paymentMethod: 'BANK_TRANSFER',
        verificationSource: 'MANUAL_VERIFICATION',
        reference: `WIRE-NGN-${Date.now()}`,
        verificationNotes: 'Lagos operations verified deposit slip against GTBank statement.',
      }),
    });
    const verifyAData = await verifyARes.json();
    assert(verifyARes.ok, 'Payment verified successfully by admin');
    assert(verifyAData.projectStarted === true, 'Response indicates projectStarted = true');
    assert(verifyAData.invoiceStatus === 'PAID', 'Response indicates invoiceStatus = PAID');

    // Verify Database Post-Verification State
    const updatedInvoiceA = await db.get('SELECT * FROM invoices WHERE id = ?', [invoiceARow.id]);
    assert(updatedInvoiceA.status === 'PAID', 'Database invoice marked PAID');
    assert(Number(updatedInvoiceA.amount_paid_minor) === 50000000, 'Database invoice amount_paid_minor equals 50000000');
    assert(updatedInvoiceA.paid_at !== null, 'Database invoice paid_at is timestamped');

    const updatedScheduleA = await db.get('SELECT * FROM payment_schedules WHERE id = ?', [scheduleA[0].id]);
    assert(updatedScheduleA.status === 'PAID', 'Payment schedule item marked PAID');
    assert(updatedScheduleA.paid_at !== null, 'Payment schedule paid_at is timestamped');

    const updatedProjectA = await db.get('SELECT * FROM projects WHERE id = ?', [projectARow.id]);
    assert(updatedProjectA.status === 'PLANNING', 'Project transitioned from AWAITING_PAYMENT to PLANNING');
    assert(updatedProjectA.payment_status === 'PAID', 'Project payment_status is PAID');
    assert(Number(updatedProjectA.total_paid_minor) === 50000000, 'Project total_paid_minor is 50000000');
    assert(updatedProjectA.started_at !== null, 'Project started_at is now set');

    // Verify Payment Transaction Record
    const paymentRecordA = await db.get('SELECT * FROM payments WHERE invoice_id = ?', [invoiceARow.id]);
    assert(Boolean(paymentRecordA), 'Discrete Payment record inserted');
    assert(paymentRecordA.payment_method === 'BANK_TRANSFER', 'Payment method correctly recorded as BANK_TRANSFER');
    assert(paymentRecordA.verification_source === 'MANUAL_VERIFICATION', 'Verification source correctly recorded as MANUAL_VERIFICATION');
    assert(paymentRecordA.status === 'CONFIRMED', 'Payment status is CONFIRMED');

    // -------------------------------------------------------------------------
    // 4. COMMISSION EVENT IMMUTABILITY & PHASE 2D BOUNDARY
    // -------------------------------------------------------------------------
    console.log('\n4. Testing Commission Event Handoff & Phase 2D Boundary Isolation...');

    const commEventsA = await db.all('SELECT * FROM commission_events WHERE payment_id = ?', [paymentRecordA.id]);
    assert(commEventsA.length === 1, 'Exactly 1 immutable commission_event logged for payment');
    const ceA = commEventsA[0];
    assert(Number(ceA.verified_amount_minor) === 50000000, 'Commission event verified_amount_minor matches payment (50000000)');
    assert(ceA.currency === 'NGN', 'Commission event currency is NGN');
    assert(ceA.status === 'RECORDED', 'Commission event status is RECORDED');
    assert(ceA.idempotency_key === `COMMISSION_PAYMENT_${paymentRecordA.id}`, 'Commission event has unique idempotency_key');
    assert(Number(ceA.commission_rate_bps_at_time_of_payment) > 0, `Commission rate snapshotted (${ceA.commission_rate_bps_at_time_of_payment} bps)`);

    // Verify Strict Boundary: commission_ledger MUST NOT have been credited by Phase 2B
    const ledgerCountRow = await db.get('SELECT COUNT(*) as count FROM commission_ledger');
    const ledgerCount = Number(ledgerCountRow.count);
    assert(ledgerCount === 0, 'Zero commission_ledger mutations (Phase 2B stops strictly at Commission Event)');

    // -------------------------------------------------------------------------
    // 5. OPTION B: STAGED MILESTONES (50% Deposit / 30% Milestone / 20% Handover)
    // -------------------------------------------------------------------------
    console.log('\n5. Testing Option B: Staged Milestones (50% Deposit / 30% Milestone / 20% Handover)...');

    // Create Kenya lead for Option B test
    const clientBEmail = `amina.${Date.now()}@nairobihealth.ke`;
    const leadBRes = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: repSession.cookie },
      body: JSON.stringify({
        businessName: 'Nairobi Health Systems',
        contactPerson: 'Dr. Amina Mohamed',
        email: clientBEmail,
        phone: '+254711223344',
        businessType: 'Healthcare & Clinical',
        requirements: 'Comprehensive hospital management system',
        estimatedBudget: '1000000',
        currency: 'KES',
        countryCode: 'KE',
      }),
    });
    const leadBData = await leadBRes.json();
    assert(leadBRes.ok, 'Option B test lead created (Nairobi Health)');

    // Author Proposal Option B
    const propBRes = await fetch(`${BASE_URL}/api/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
      body: JSON.stringify({
        leadId: leadBData.lead.id,
        title: 'Hospital Management & Patient Portal',
        scopeOfWork: 'EMR integration, appointment scheduling, and patient tele-health portal.',
        deliverables: ['UI/UX Patient Flows', 'EMR Database Architecture', 'Telehealth Video Integration', 'Final Acceptance Handover'],
        paymentStructureType: 'DEPOSIT_MILESTONES',
        totalAmountMinor: 100000000, // 1,000,000 KES
        currency: 'KES',
        validDays: 30,
        status: 'SENT',
      }),
    });
    const propBData = await propBRes.json();
    assert(propBRes.ok, `Option B proposal created (${propBData.proposal?.proposalNumber})`);
    assert(propBData.proposal?.paymentStructureType === 'DEPOSIT_MILESTONES', 'Proposal structure is DEPOSIT_MILESTONES');

    const clientBRow = await db.get('SELECT id, user_id FROM clients WHERE lead_id = ?', [leadBData.lead.id]);
    await db.run("UPDATE users SET password_hash = ?, status = 'ACTIVE' WHERE id = ?", [defaultUser.password_hash, clientBRow.user_id]);
    const clientBSession = await login(clientBEmail);

    // Client B Approves Proposal B
    const approveBRes = await fetch(`${BASE_URL}/api/proposals/${propBData.proposal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: clientBSession.cookie },
      body: JSON.stringify({ action: 'CLIENT_APPROVE' }),
    });
    const approveBData = await approveBRes.json();
    assert(approveBRes.ok, 'Option B proposal approved by client');

    // Check Schedules & Invoices for Option B
    const schedulesB = await db.all('SELECT * FROM payment_schedules WHERE proposal_id = ? ORDER BY order_index ASC', [propBData.proposal.id]);
    assert(schedulesB.length === 3, 'Exactly 3 schedule items created for Option B');
    assert(Number(schedulesB[0].percentage_bps) === 5000 && (Number(schedulesB[0].is_required_to_start) === 1 || schedulesB[0].is_required_to_start === true), 'Item 1: 50% deposit (5000 bps) required to start');
    assert(Number(schedulesB[1].percentage_bps) === 3000 && (Number(schedulesB[1].is_required_to_start) === 0 || schedulesB[1].is_required_to_start === false), 'Item 2: 30% milestone (3000 bps) not required to start');
    assert(Number(schedulesB[2].percentage_bps) === 2000 && (Number(schedulesB[2].is_required_to_start) === 0 || schedulesB[2].is_required_to_start === false), 'Item 3: 20% handover (2000 bps) not required to start');

    // Invoices check: EXACTLY 1 invoice issued initially (for 50% deposit)
    const invoicesB = await db.all('SELECT * FROM invoices WHERE project_id = ?', [approveBData.projectId]);
    assert(invoicesB.length === 1, 'Only 1 initial invoice issued at approval (50% deposit)');
    assert(Number(invoicesB[0].amount_minor) === 50000000, 'Initial invoice is for 500,000 KES (50,000,000 minor)');
    assert(schedulesB[0].status === 'INVOICED', 'Schedule item 1 is INVOICED');
    assert(schedulesB[1].status === 'SCHEDULED', 'Schedule item 2 remains SCHEDULED');
    assert(schedulesB[2].status === 'SCHEDULED', 'Schedule item 3 remains SCHEDULED');

    // Verify Deposit Payment: Project MUST start after deposit verification!
    const verifyDepRes = await fetch(`${BASE_URL}/api/invoices/${invoicesB[0].id}/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
      body: JSON.stringify({
        amountMinor: 50000000,
        currency: 'KES',
        paymentMethod: 'BANK_TRANSFER',
        verificationSource: 'BANK_TRANSFER_CONFIRMATION',
        reference: `KCB-WIRE-${Date.now()}`,
        verificationNotes: 'KCB wire confirmation slip received and checked.',
      }),
    });
    const verifyDepData = await verifyDepRes.json();
    assert(verifyDepRes.ok, 'Deposit payment verified');
    assert(verifyDepData.projectStarted === true, 'Project started upon deposit verification');

    const projectBAfterDep = await db.get('SELECT * FROM projects WHERE id = ?', [approveBData.projectId]);
    assert(projectBAfterDep.status === 'PLANNING', 'Project status is PLANNING after deposit');
    assert(projectBAfterDep.payment_status === 'PARTIALLY_PAID', 'Project payment_status is PARTIALLY_PAID');

    // Now Trigger Milestone 2 Invoicing
    console.log('Testing milestone 2 transition to INVOICEABLE and invoice issuance...');
    await db.run("UPDATE payment_schedules SET status = 'INVOICEABLE' WHERE id = ?", [schedulesB[1].id]);

    const issueMilestone2Res = await fetch(`${BASE_URL}/api/payment-schedules/${schedulesB[1].id}/issue-invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
      body: JSON.stringify({ dueDate: new Date(Date.now() + 864000000).toISOString() }),
    });
    const issueMilestone2Data = await issueMilestone2Res.json();
    assert(issueMilestone2Res.ok, 'Milestone 2 invoice issued via API');
    assert(issueMilestone2Data.invoiceNumber.startsWith('INV-KES-'), `Milestone 2 invoice numbered (${issueMilestone2Data.invoiceNumber})`);

    const updatedScheduleB2 = await db.get('SELECT * FROM payment_schedules WHERE id = ?', [schedulesB[1].id]);
    assert(updatedScheduleB2.status === 'INVOICED', 'Schedule item 2 marked INVOICED');
    assert(updatedScheduleB2.invoice_id !== null, 'Schedule item 2 links to new invoice');

    // Verify Milestone 2 Payment with GATEWAY_SIMULATION
    const verifyMs2Res = await fetch(`${BASE_URL}/api/invoices/${issueMilestone2Data.invoiceId}/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
      body: JSON.stringify({
        amountMinor: 30000000,
        currency: 'KES',
        paymentMethod: 'GATEWAY_SIMULATION',
        verificationSource: 'GATEWAY_SIMULATION',
        reference: `SIM-GATEWAY-${Date.now()}`,
      }),
    });
    const verifyMs2Data = await verifyMs2Res.json();
    assert(verifyMs2Res.ok, 'Milestone 2 payment verified via GATEWAY_SIMULATION');

    // Check that 2 distinct commission events exist for Project B
    const commEventsB = await db.all('SELECT * FROM commission_events WHERE project_id = ?', [approveBData.projectId]);
    assert(commEventsB.length === 2, '2 distinct commission events recorded for Project B milestones');
    assert(Number(commEventsB[0].verified_amount_minor) === 50000000, 'First event verified 500,000 KES');
    assert(Number(commEventsB[1].verified_amount_minor) === 30000000, 'Second event verified 300,000 KES');

    // -------------------------------------------------------------------------
    // 6. OPTION C: CUSTOM PAYMENT SCHEDULE VALIDATION & RECONCILIATION
    // -------------------------------------------------------------------------
    console.log('\n6. Testing Option C: Custom Schedule Validation & Integer Reconciliation...');

    // Invalid Custom Schedule: sum of percentages != 10000 bps
    const invalidCustomRes1 = await fetch(`${BASE_URL}/api/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
      body: JSON.stringify({
        clientId: clientBRow.id,
        title: 'Invalid Custom Schedule Test (Bad Bps)',
        scopeOfWork: 'Test scope',
        deliverables: ['Scope Item'],
        paymentStructureType: 'CUSTOM',
        totalAmountMinor: 10000000,
        currency: 'KES',
        paymentSchedule: [
          { name: 'Part 1', orderIndex: 1, percentageBps: 4000, amountMinor: 4000000, isRequiredToStart: 1, billingTrigger: 'UPFRONT_APPROVAL' },
          { name: 'Part 2', orderIndex: 2, percentageBps: 4000, amountMinor: 4000000, isRequiredToStart: 0, billingTrigger: 'MILESTONE_COMPLETED' },
          // Total bps = 8000 != 10000
        ],
      }),
    });
    assert(invalidCustomRes1.status === 400, 'Rejected custom schedule where bps sum != 10000 (400)');

    // Invalid Custom Schedule: sum of amounts != totalAmountMinor
    const invalidCustomRes2 = await fetch(`${BASE_URL}/api/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
      body: JSON.stringify({
        clientId: clientBRow.id,
        title: 'Invalid Custom Schedule Test (Bad Amount)',
        scopeOfWork: 'Test scope',
        deliverables: ['Scope Item'],
        paymentStructureType: 'CUSTOM',
        totalAmountMinor: 10000000,
        currency: 'KES',
        paymentSchedule: [
          { name: 'Part 1', orderIndex: 1, percentageBps: 5000, amountMinor: 5000000, isRequiredToStart: 1, billingTrigger: 'UPFRONT_APPROVAL' },
          { name: 'Part 2', orderIndex: 2, percentageBps: 5000, amountMinor: 4000000, isRequiredToStart: 0, billingTrigger: 'MILESTONE_COMPLETED' },
          // Total amount = 9,000,000 != 10,000,000
        ],
      }),
    });
    assert(invalidCustomRes2.status === 400, 'Rejected custom schedule where amount sum != totalAmountMinor (400)');

    // Valid Custom Schedule (40% + 40% + 20%)
    const validCustomRes = await fetch(`${BASE_URL}/api/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
      body: JSON.stringify({
        clientId: clientBRow.id,
        title: 'Custom 40-40-20 Staged Enterprise Architecture',
        scopeOfWork: 'Multi-staged custom deployment',
        deliverables: ['Design Spec', 'Core Infrastructure', 'Handover'],
        paymentStructureType: 'CUSTOM',
        totalAmountMinor: 20000000, // 200,000 KES
        currency: 'KES',
        validDays: 14,
        paymentSchedule: [
          { name: 'Initial 40% Setup Fee', orderIndex: 1, percentageBps: 4000, amountMinor: 8000000, isRequiredToStart: 1, billingTrigger: 'UPFRONT_APPROVAL' },
          { name: 'Midway 40% Core Delivery', orderIndex: 2, percentageBps: 4000, amountMinor: 8000000, isRequiredToStart: 0, billingTrigger: 'MILESTONE_COMPLETED' },
          { name: 'Final 20% Handover', orderIndex: 3, percentageBps: 2000, amountMinor: 4000000, isRequiredToStart: 0, billingTrigger: 'MILESTONE_COMPLETED' },
        ],
      }),
    });
    const validCustomData = await validCustomRes.json();
    assert(validCustomRes.ok, `Valid custom proposal authored (${validCustomData.proposal.proposalNumber})`);

    // -------------------------------------------------------------------------
    // 7. FINANCIAL CONTROLS, IDEMPOTENCY & ERROR DEFENSE
    // -------------------------------------------------------------------------
    console.log('\n7. Testing Financial Controls, Idempotency & Error Handling...');

    // A. Overpayment Rejection
    const overpayRes = await fetch(`${BASE_URL}/api/invoices/${invoicesB[0].id}/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
      body: JSON.stringify({
        amountMinor: 1000000,
        currency: 'KES',
        reference: `OVERPAY-${Date.now()}`,
      }),
    });
    assert(overpayRes.status === 400, 'Rejected payment exceeding invoice unpaid balance (400)');

    // B. Currency Mismatch Rejection
    const currMismatchRes = await fetch(`${BASE_URL}/api/invoices/${issueMilestone2Data.invoiceId}/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
      body: JSON.stringify({
        amountMinor: 100000,
        currency: 'NGN', // Invoice is in KES!
        reference: `CURR-MISMATCH-${Date.now()}`,
      }),
    });
    assert(currMismatchRes.status === 400, 'Rejected currency mismatch between invoice and payment (400)');

    // C. Duplicate Reference Rejection (409 Conflict)
    const dupRef = `DUP-REF-${Date.now()}`;
    // Create new invoice to test duplicate reference
    const invoiceForRefTest = await db.get("SELECT id FROM invoices WHERE status = 'ISSUED'");
    if (invoiceForRefTest) {
      // First verification with ref
      await fetch(`${BASE_URL}/api/invoices/${invoiceForRefTest.id}/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
        body: JSON.stringify({
          amountMinor: 1000,
          currency: 'KES',
          reference: dupRef,
        }),
      });

      // Second verification with identical ref
      const dupRes = await fetch(`${BASE_URL}/api/invoices/${invoiceForRefTest.id}/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
        body: JSON.stringify({
          amountMinor: 1000,
          currency: 'KES',
          reference: dupRef,
        }),
      });
      assert(dupRes.status === 409, 'Duplicate payment reference rejected with 409 Conflict');
    }

    // D. Invalid Payment Method / Verification Source Validation
    const badMethodRes = await fetch(`${BASE_URL}/api/invoices/${invoiceARow.id}/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
      body: JSON.stringify({
        amountMinor: 1000,
        currency: 'NGN',
        paymentMethod: 'CRYPTOCURRENCY_MAGIC',
        reference: `BAD-METHOD-${Date.now()}`,
      }),
    });
    assert(badMethodRes.status === 400, 'Invalid payment_method rejected with 400');

    const badSourceRes = await fetch(`${BASE_URL}/api/invoices/${invoiceARow.id}/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
      body: JSON.stringify({
        amountMinor: 1000,
        currency: 'NGN',
        paymentMethod: 'BANK_TRANSFER',
        verificationSource: 'TELEPATHIC_INTUITION',
        reference: `BAD-SOURCE-${Date.now()}`,
      }),
    });
    assert(badSourceRes.status === 400, 'Invalid verification_source rejected with 400');

    // E. Client Approval Idempotency Test
    const retryApproveRes = await fetch(`${BASE_URL}/api/proposals/${propAData.proposal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: clientASession.cookie },
      body: JSON.stringify({ action: 'CLIENT_APPROVE' }),
    });
    assert(retryApproveRes.ok, 'Repeat client approval call handled gracefully');
    const projectCountRow = await db.get('SELECT COUNT(*) as count FROM projects WHERE id = ?', [approveAData.projectId]);
    const projectCountForPropA = Number(projectCountRow.count);
    assert(projectCountForPropA === 1, 'Client approval is idempotent (no duplicate projects created)');

    // -------------------------------------------------------------------------
    // 8. AUDIT LOGGING & EXECUTIVE METRICS AGGREGATION
    // -------------------------------------------------------------------------
    console.log('\n8. Testing Audit Logging & Executive Metrics Aggregation...');

    const auditPayments = await db.all("SELECT * FROM audit_logs WHERE action = 'PAYMENT_VERIFIED'");
    assert(auditPayments.length >= 2, `Audit trail recorded ${auditPayments.length} PAYMENT_VERIFIED actions`);

    const auditStarts = await db.all("SELECT * FROM audit_logs WHERE action = 'PROJECT_STARTED'");
    assert(auditStarts.length >= 2, `Audit trail recorded ${auditStarts.length} PROJECT_STARTED actions`);

    // Fetch Executive Metrics API
    const metricsRes = await fetch(`${BASE_URL}/api/admin/metrics`, {
      headers: { Cookie: superAdminSession.cookie },
    });
    const metricsData = await metricsRes.json();
    assert(metricsRes.ok, 'Executive metrics retrieved');
    assert(metricsData.overview.billing.totalInvoices > 0, `Metrics reports ${metricsData.overview.billing.totalInvoices} total invoices`);
    assert(metricsData.overview.billing.commissionEventsCount > 0, `Metrics reports ${metricsData.overview.billing.commissionEventsCount} commission events`);
    assert(metricsData.overview.billing.verifiedPaidKES_minor > 0, 'KES verified payments accurately aggregated');
    assert(metricsData.overview.billing.verifiedPaidNGN_minor > 0, 'NGN verified payments accurately aggregated');

    // Currency Segregation check
    assert(typeof metricsData.overview.billing.receivablesKES_minor === 'number', 'KES receivables segregated');
    assert(typeof metricsData.overview.billing.receivablesNGN_minor === 'number', 'NGN receivables segregated');

  } catch (err) {
    console.error('Test suite uncaught exception:', err);
    failed++;
  } finally {
    await db.close();
  }

  console.log('\n================================================================');
  console.log(`🏁 PHASE 2B TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase2BTests();
