// tests/phase2a-verify.mjs
import { testDb as db } from './test-db-adapter.mjs';

const BASE_URL = 'http://127.0.0.1:3000';

async function runPhase2ATests() {
  console.log('====================================================');
  console.log('🧪 CODEBRIDGE PHASE 2A COMMERCIAL ENGINE TEST SUITE');
  console.log('====================================================\n');

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

  // Helper for logging in and capturing session cookie
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
    // 1. Authenticate Actors
    console.log('1. Authenticating test actors across roles...');
    const adminSession = await login('ops@codebridge.com');
    assert(adminSession.user.role === 'ADMIN', 'Admin/Ops authenticated');

    const repSession = await login('rep.kenya@codebridge.com');
    assert(repSession.user.role === 'REPRESENTATIVE', 'Kenya Representative authenticated');

    const clientSession = await login('client@abcrestaurants.com');
    assert(clientSession.user.role === 'CLIENT', 'Client (ABC Restaurants) authenticated');

    const cmSession = await login('countrymanager.ke@codebridge.com');
    assert(cmSession.user.role === 'COUNTRY_MANAGER', 'Kenya Country Manager authenticated');

    // Setup an isolated second client for cross-client security test
    const clientBUserId = 'u_client_b_test';
    const clientBId = 'cli_b_test';
    const defaultUser = await db.get("SELECT password_hash FROM users WHERE email = 'client@abcrestaurants.com'");
    const passwordHash = defaultUser.password_hash;
    
    let clientBUser = await db.get("SELECT id FROM users WHERE email = 'client.other@testcorp.ng'");
    if (!clientBUser) {
      await db.run(`
        INSERT INTO users (id, email, password_hash, role, status, email_verified)
        VALUES (?, 'client.other@testcorp.ng', ?, 'CLIENT', 'ACTIVE', 1)
        ON CONFLICT (id) DO NOTHING
      `, [clientBUserId, passwordHash]);

      await db.run(`
        INSERT INTO user_profiles (user_id, first_name, last_name, phone, country_id, timezone)
        VALUES (?, 'Other', 'Client', '+2348099999999', 'c_ng', 'Africa/Lagos')
        ON CONFLICT (user_id) DO NOTHING
      `, [clientBUserId]);

      await db.run(`
        INSERT INTO clients (id, user_id, company_name, industry, country_id)
        VALUES (?, ?, 'Test Nigeria Corp', 'Retail', 'c_ng')
        ON CONFLICT (id) DO NOTHING
      `, [clientBId, clientBUserId]);
    }

    const clientBSession = await login('client.other@testcorp.ng');
    assert(clientBSession.user.role === 'CLIENT', 'Client B (Nigeria Corp) authenticated');

    // 2. Test Currency Integrity & Minor Unit Validation
    console.log('\n2. Testing Currency Integrity and Minor Unit Validation (Rule 4)...');
    
    // Non-integer / negative amount
    const invalidAmountRes = await fetch(`${BASE_URL}/api/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
      body: JSON.stringify({
        clientId: 'cli_abc_rest',
        title: 'Invalid Amount Proposal',
        scopeOfWork: 'Testing invalid amount',
        totalAmountMinor: -5000,
        currency: 'KES',
      }),
    });
    assert(invalidAmountRes.status === 400, 'Rejects negative pricing amounts (HTTP 400)');

    const floatAmountRes = await fetch(`${BASE_URL}/api/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
      body: JSON.stringify({
        clientId: 'cli_abc_rest',
        title: 'Floating Amount Proposal',
        scopeOfWork: 'Testing floating point amount',
        totalAmountMinor: 1250.75,
        currency: 'KES',
      }),
    });
    assert(floatAmountRes.status === 400, 'Rejects floating point amounts (HTTP 400)');

    const invalidCurrRes = await fetch(`${BASE_URL}/api/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
      body: JSON.stringify({
        clientId: 'cli_abc_rest',
        title: 'Unsupported Currency Proposal',
        scopeOfWork: 'Testing unsupported currency',
        totalAmountMinor: 5000000,
        currency: 'USD',
      }),
    });
    assert(invalidCurrRes.status === 400, 'Rejects unapproved currencies (USD/EUR) (HTTP 400)');

    // 3. Test Proposal Creation (Valid Integer Minor Units)
    console.log('\n3. Authoring Valid Commercial Proposal in Minor Units...');
    const createPropRes = await fetch(`${BASE_URL}/api/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
      body: JSON.stringify({
        clientId: 'cli_abc_rest',
        leadId: 'lead_001',
        title: 'Full-Stack Digital Dining Infrastructure',
        scopeOfWork: 'End-to-end POS, ordering workflow, and staff dispatch dashboard.',
        deliverables: [
          'High-throughput mobile ordering menu',
          'Kitchen Display System (KDS)',
          'Automated M-Pesa till reconciliation',
          'Cloud infrastructure & SLA guarantee'
        ],
        totalAmountMinor: 32000000, // 320,000.00 KES in minor units
        currency: 'KES',
        validUntil: new Date(Date.now() + 14 * 86400000).toISOString(),
        termsNotes: 'Standard 4-milestone engineering schedule.',
        status: 'DRAFT',
      }),
    });
    assert(createPropRes.status === 201, 'Authoring proposal returned HTTP 201 Created');
    const createdPropData = await createPropRes.json();
    const proposalIdV1 = createdPropData.proposal.id;
    const proposalNumber = createdPropData.proposal.proposalNumber;
    assert(createdPropData.proposal.version === 1, 'Initial proposal created as version 1');
    assert(createdPropData.proposal.status === 'DRAFT', 'Initial proposal status created as DRAFT');
    assert(createdPropData.proposal.totalAmountMinor === 32000000, 'Proposal amount stored as 32000000 minor units (KES)');

    // 4. Test Proposal Status Transitions & Automatic View Transition
    console.log('\n4. Testing Proposal Status Transitions & Automatic View (Rule 5)...');
    
    // Invalid transition: Try to approve a DRAFT proposal
    const approveDraftRes = await fetch(`${BASE_URL}/api/proposals/${proposalIdV1}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: clientSession.cookie },
      body: JSON.stringify({ action: 'CLIENT_APPROVE' }),
    });
    assert(approveDraftRes.status === 400, 'Cannot approve proposal in DRAFT status (HTTP 400)');

    // Valid transition: Admin transmits proposal (DRAFT -> SENT)
    const sendRes = await fetch(`${BASE_URL}/api/proposals/${proposalIdV1}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
      body: JSON.stringify({ action: 'SEND' }),
    });
    assert(sendRes.status === 200, 'Admin successfully sent proposal to client (HTTP 200)');
    const sendData = await sendRes.json();
    assert(sendData.status === 'SENT', 'Proposal transitioned from DRAFT to SENT');

    // Invalid transition: Try to SEND an already SENT proposal
    const duplicateSendRes = await fetch(`${BASE_URL}/api/proposals/${proposalIdV1}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
      body: JSON.stringify({ action: 'SEND' }),
    });
    assert(duplicateSendRes.status === 400, 'Cannot SEND a proposal that is already in SENT status (HTTP 400)');

    // Client GET -> Automatically triggers SENT -> VIEWED
    const clientViewRes = await fetch(`${BASE_URL}/api/proposals/${proposalIdV1}`, {
      headers: { Cookie: clientSession.cookie },
    });
    assert(clientViewRes.status === 200, 'Client successfully viewed proposal (HTTP 200)');
    const clientViewData = await clientViewRes.json();
    assert(clientViewData.proposal.status === 'VIEWED', 'Status automatically transitioned from SENT to VIEWED');
    assert(clientViewData.proposal.viewed_at !== null, 'viewed_at timestamp recorded');

    // 5. Test Proposal Versioning & History Preservation (Rule 2)
    console.log('\n5. Testing Proposal Versioning and History Preservation (Rule 2)...');
    // Admin edits a VIEWED proposal -> Backend must create version 2 and preserve version 1
    const editRes = await fetch(`${BASE_URL}/api/proposals/${proposalIdV1}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
      body: JSON.stringify({
        action: 'EDIT',
        title: 'Full-Stack Digital Dining Infrastructure (Revised Scope)',
        totalAmountMinor: 35000000, // Revised to 350,000.00 KES
        deliverables: [
          'High-throughput mobile ordering menu',
          'Kitchen Display System (KDS)',
          'Automated M-Pesa till reconciliation',
          'Cloud infrastructure & SLA guarantee',
          'VIP Table Reservation Module'
        ],
      }),
    });
    assert(editRes.status === 200, 'Admin edit on VIEWED proposal returned HTTP 200');
    const editData = await editRes.json();
    assert(editData.version === 2, 'New version 2 created successfully');
    const proposalIdV2 = editData.proposalId;
    assert(proposalIdV2 !== proposalIdV1, 'New proposal ID allocated for version 2');

    // Verify in database that version 1 is preserved and marked is_current = 0
    const v1Record = await db.get('SELECT version, is_current, total_amount_minor FROM proposals WHERE id = ?', [proposalIdV1]);
    assert(Number(v1Record.version) === 1 && (v1Record.is_current === 0 || v1Record.is_current === false || v1Record.is_current === '0'), 'Version 1 preserved with is_current = 0');
    assert(Number(v1Record.total_amount_minor) === 32000000, 'Version 1 preserved original minor unit amount (32000000)');

    const v2Record = await db.get('SELECT version, is_current, total_amount_minor FROM proposals WHERE id = ?', [proposalIdV2]);
    assert(Number(v2Record.version) === 2 && (v2Record.is_current === 1 || v2Record.is_current === true || v2Record.is_current === '1'), 'Version 2 marked active with is_current = 1');
    assert(Number(v2Record.total_amount_minor) === 35000000, 'Version 2 reflects revised minor unit amount (35000000)');

    // 6. Test Approving an Old Proposal Version (Rule 2 & 9)
    console.log('\n6. Testing Approval of Superseded Version (Rule 2)...');
    const approveOldRes = await fetch(`${BASE_URL}/api/proposals/${proposalIdV1}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: clientSession.cookie },
      body: JSON.stringify({ action: 'CLIENT_APPROVE' }),
    });
    assert(approveOldRes.status === 400, 'Approving superseded version 1 rejected with HTTP 400');
    const oldErr = await approveOldRes.json();
    assert(oldErr.error.includes('superseded'), 'Error message confirms proposal version was superseded');

    // 7. Test RBAC: Representative Permissions & Constraints (Rule 7 & 9)
    console.log('\n7. Testing Representative Restrictions (Rule 9)...');
    // Representative cannot approve
    const repApproveRes = await fetch(`${BASE_URL}/api/proposals/${proposalIdV2}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: repSession.cookie },
      body: JSON.stringify({ action: 'CLIENT_APPROVE' }),
    });
    assert(repApproveRes.status === 403, 'Representative cannot approve proposal (HTTP 403 Forbidden)');

    // Representative cannot alter pricing or status
    const repEditRes = await fetch(`${BASE_URL}/api/proposals/${proposalIdV2}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: repSession.cookie },
      body: JSON.stringify({ action: 'EDIT', totalAmountMinor: 10000000 }),
    });
    assert(repEditRes.status === 403, 'Representative cannot alter pricing/scope (HTTP 403 Forbidden)');

    // Representative cannot bypass via leads endpoint
    const repLeadConvertRes = await fetch(`${BASE_URL}/api/leads/lead_001`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: repSession.cookie },
      body: JSON.stringify({ status: 'WON', convertToClient: true }),
    });
    assert(repLeadConvertRes.status === 403, 'Representative cannot directly mark lead as WON via leads API (HTTP 403)');

    // 8. Test Client Approval Security: Cross-Client Isolation (Rule 6)
    console.log('\n8. Testing Client Isolation Security (Rule 6)...');
    // Client B tries to approve Client A's proposal
    const crossClientApproveRes = await fetch(`${BASE_URL}/api/proposals/${proposalIdV2}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: clientBSession.cookie },
      body: JSON.stringify({ action: 'CLIENT_APPROVE' }),
    });
    assert(crossClientApproveRes.status === 403, 'Client cannot approve another client\'s proposal (HTTP 403 Forbidden)');

    // Client B tries to GET Client A's proposal
    const crossClientGetRes = await fetch(`${BASE_URL}/api/proposals/${proposalIdV2}`, {
      headers: { Cookie: clientBSession.cookie },
    });
    assert(crossClientGetRes.status === 403, 'Client cannot view another client\'s proposal (HTTP 403 Forbidden)');

    // 9. Test Country Manager RBAC: Cross-Country Isolation (Rule 7)
    console.log('\n9. Testing Country Manager Regional Scoping (Rule 7)...');
    // Create a Nigerian proposal to test Kenya Country Manager isolation
    const createNgPropRes = await fetch(`${BASE_URL}/api/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
      body: JSON.stringify({
        clientId: clientBId,
        title: 'Lagos E-Commerce Distribution Hub',
        scopeOfWork: 'Warehouse inventory routing and payment settlement.',
        deliverables: ['Inventory sync API', 'Logistics dispatch panel'],
        totalAmountMinor: 250000000, // 2,500,000.00 NGN
        currency: 'NGN',
        status: 'SENT',
      }),
    });
    assert(createNgPropRes.status === 201, 'Authored Nigerian proposal (2,500,000 NGN in minor units)');
    const ngPropData = await createNgPropRes.json();
    const ngPropId = ngPropData.proposal.id;

    // Kenya Country Manager attempts to access Nigerian proposal
    const cmCrossCountryRes = await fetch(`${BASE_URL}/api/proposals/${ngPropId}`, {
      headers: { Cookie: cmSession.cookie },
    });
    assert(cmCrossCountryRes.status === 403, 'Kenya Country Manager cannot access Nigerian proposal (HTTP 403 Forbidden)');

    // 10. Test Valid Client Approval & Idempotent Project/Milestones Initialization (Rule 1)
    console.log('\n10. Testing Client Approval & Project Initialization (Rule 1)...');
    
    // Count projects and milestones before approval
    const initialProjectsCount = Number((await db.get("SELECT COUNT(*) as count FROM projects WHERE lead_id = 'lead_001'")).count);

    // Valid approval call by designated client
    const approveRes = await fetch(`${BASE_URL}/api/proposals/${proposalIdV2}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: clientSession.cookie },
      body: JSON.stringify({ action: 'CLIENT_APPROVE' }),
    });
    assert(approveRes.status === 200, 'Designated client approval succeeded (HTTP 200)');
    const approveData = await approveRes.json();
    assert(approveData.status === 'CLIENT_APPROVED', 'Proposal status transitioned to CLIENT_APPROVED');
    assert(approveData.approvedVersion === 2, 'Approval recorded exactly version 2');
    const createdProjectId = approveData.projectId;
    assert(createdProjectId !== null, `Project created with ID: ${createdProjectId}`);

    // Verify project and milestones in database
    const projectRecord = await db.get('SELECT * FROM projects WHERE id = ?', [createdProjectId]);
    assert(projectRecord !== undefined && projectRecord !== null, 'Project record verified in database');
    assert(projectRecord.currency === 'KES', 'Project currency correctly isolated as KES');
    assert(Number(projectRecord.budget_minor) === 35000000, 'Project budget matches proposal minor units (35000000)');

    const milestones = await db.all('SELECT * FROM project_milestones WHERE project_id = ?', [createdProjectId]);
    assert(milestones.length === 4, 'Exactly 4 project milestones initialized');

    // Verify lead status transitioned to WON
    const leadRecord = await db.get("SELECT status FROM leads WHERE id = 'lead_001'");
    assert(leadRecord.status === 'WON', 'Lead status transitioned to WON upon proposal approval');

    // 11. Test Idempotent Approval (Rule 1: Never create duplicate project or milestones on retry)
    console.log('\n11. Testing Idempotent Approval Retry (Rule 1)...');
    const projectsBeforeRetry = Number((await db.get("SELECT COUNT(*) as count FROM projects")).count);
    const milestonesBeforeRetry = Number((await db.get("SELECT COUNT(*) as count FROM project_milestones WHERE project_id = ?", [createdProjectId])).count);

    const retryApproveRes = await fetch(`${BASE_URL}/api/proposals/${proposalIdV2}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: clientSession.cookie },
      body: JSON.stringify({ action: 'CLIENT_APPROVE' }),
    });
    assert(retryApproveRes.status === 200, 'Duplicate approval request returns HTTP 200');
    const retryApproveData = await retryApproveRes.json();
    assert(retryApproveData.status === 'CLIENT_APPROVED', 'Status remains CLIENT_APPROVED');
    assert(retryApproveData.projectId === createdProjectId, 'Returns existing Project ID without re-creating');

    // Verify project count did NOT increase
    const projectsAfterRetry = Number((await db.get("SELECT COUNT(*) as count FROM projects")).count);
    assert(projectsAfterRetry === projectsBeforeRetry, 'Duplicate project prevention: Total projects count unchanged on retry');

    // Verify milestones count did NOT duplicate
    const milestonesAfterRetry = Number((await db.get("SELECT COUNT(*) as count FROM project_milestones WHERE project_id = ?", [createdProjectId])).count);
    assert(milestonesAfterRetry === milestonesBeforeRetry, 'Duplicate milestone prevention: Milestones count unchanged on retry (remains 4)');

    // 12. Test Immutability of Approved Proposal (Rule 2)
    console.log('\n12. Testing Immutability of Approved Proposal (Rule 2)...');
    const editApprovedRes = await fetch(`${BASE_URL}/api/proposals/${proposalIdV2}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
      body: JSON.stringify({ action: 'EDIT', totalAmountMinor: 50000000 }),
    });
    assert(editApprovedRes.status === 400, 'Editing an approved proposal rejected with HTTP 400');
    const immutErr = await editApprovedRes.json();
    assert(immutErr.error.includes('immutable'), 'Error explicitly confirms approved proposals are immutable');

    // 13. Test Informational Commission Integrity (Rule 3)
    console.log('\n13. Testing Commission Integrity: Informational Only (Rule 3)...');
    // Check that NO commission ledger row was inserted into commissions table for this proposal approval
    const postCommissionsCount = Number((await db.get('SELECT COUNT(*) as count FROM commissions WHERE project_id = ?', [createdProjectId])).count);
    assert(postCommissionsCount === 0, 'No payable commission record created in ledger (Informational only in Phase 2A)');

    // 14. Test Client Rejection with Feedback (Rule 5 & 8)
    console.log('\n14. Testing Client Rejection & Audit Flow (Rule 5 & 8)...');
    // Author another proposal to test rejection
    const createRejectPropRes = await fetch(`${BASE_URL}/api/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
      body: JSON.stringify({
        clientId: 'cli_abc_rest',
        title: 'Legacy Database Migration',
        scopeOfWork: 'Migrating legacy SQL to microservices.',
        deliverables: ['Schema migration', 'ETL script'],
        totalAmountMinor: 15000000,
        currency: 'KES',
        status: 'SENT',
      }),
    });
    const rejectPropData = await createRejectPropRes.json();
    const rejectPropId = rejectPropData.proposal.id;

    // Reject without reason -> Should fail (Rule 5)
    const emptyRejectRes = await fetch(`${BASE_URL}/api/proposals/${rejectPropId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: clientSession.cookie },
      body: JSON.stringify({ action: 'CLIENT_REJECT', rejectionReason: ' ' }),
    });
    assert(emptyRejectRes.status === 400, 'Rejection requires feedback / modification reason (HTTP 400)');

    // Reject with reason
    const validRejectRes = await fetch(`${BASE_URL}/api/proposals/${rejectPropId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: clientSession.cookie },
      body: JSON.stringify({ action: 'CLIENT_REJECT', rejectionReason: 'Budget exceeds our current quarterly allocation.' }),
    });
    assert(validRejectRes.status === 200, 'Client rejection with feedback succeeded (HTTP 200)');
    const rejectDb = await db.get('SELECT status, rejection_reason FROM proposals WHERE id = ?', [rejectPropId]);
    assert(rejectDb.status === 'CLIENT_REJECTED', 'Status updated to CLIENT_REJECTED in database');
    assert(rejectDb.rejection_reason === 'Budget exceeds our current quarterly allocation.', 'Rejection reason saved in database');

    // 15. Test Cancellation & Expiration Status Rules (Rule 5)
    console.log('\n15. Testing Cancellation and Expiration Rules (Rule 5)...');
    
    // Cancellation
    const createCancelPropRes = await fetch(`${BASE_URL}/api/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
      body: JSON.stringify({
        clientId: 'cli_abc_rest',
        title: 'Deprecated System Integration',
        scopeOfWork: 'Integration for deprecated legacy gateway.',
        deliverables: ['Gateway adapter'],
        totalAmountMinor: 8000000,
        currency: 'KES',
        status: 'SENT',
      }),
    });
    const cancelPropData = await createCancelPropRes.json();
    const cancelPropId = cancelPropData.proposal.id;

    const cancelRes = await fetch(`${BASE_URL}/api/proposals/${cancelPropId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
      body: JSON.stringify({ action: 'CANCEL' }),
    });
    assert(cancelRes.status === 200, 'Admin successfully cancelled proposal (HTTP 200)');
    const cancelDb = await db.get('SELECT status FROM proposals WHERE id = ?', [cancelPropId]);
    assert(cancelDb.status === 'CANCELLED', 'Status updated to CANCELLED in database');

    // Expiration
    const createExpirePropRes = await fetch(`${BASE_URL}/api/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
      body: JSON.stringify({
        clientId: 'cli_abc_rest',
        title: 'Expiring Time-Sensitive Prototype',
        scopeOfWork: 'Prototype architecture with 1-day validity.',
        deliverables: ['Interactive wireframe'],
        totalAmountMinor: 12000000,
        currency: 'KES',
        validUntil: new Date(Date.now() - 1000).toISOString(), // Past date
        status: 'SENT',
      }),
    });
    const expirePropData = await createExpirePropRes.json();
    const expirePropId = expirePropData.proposal.id;

    const expireRes = await fetch(`${BASE_URL}/api/proposals/${expirePropId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
      body: JSON.stringify({ action: 'EXPIRE' }),
    });
    assert(expireRes.status === 200, 'Proposal expired successfully (HTTP 200)');
    const expireDb = await db.get('SELECT status FROM proposals WHERE id = ?', [expirePropId]);
    assert(expireDb.status === 'EXPIRED', 'Status updated to EXPIRED in database');

    // Attempting to approve an EXPIRED proposal must be rejected (Rule 5)
    const approveExpiredRes = await fetch(`${BASE_URL}/api/proposals/${expirePropId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: clientSession.cookie },
      body: JSON.stringify({ action: 'CLIENT_APPROVE' }),
    });
    assert(approveExpiredRes.status === 400, 'Cannot approve an expired proposal (HTTP 400)');

    // 16. Test Audit Trail Completeness (Rule 8: All 8 required audit actions)
    console.log('\n16. Testing Audit Trail Completeness (Rule 8)...');
    const auditEvents = (await db.all(`
      SELECT DISTINCT action
      FROM audit_logs
      WHERE entity = 'proposals'
    `)).map(a => a.action);

    const requiredAuditEvents = [
      'PROPOSAL_CREATED',
      'PROPOSAL_EDITED',
      'PROPOSAL_SENT',
      'PROPOSAL_VIEWED',
      'PROPOSAL_APPROVED',
      'PROPOSAL_REJECTED',
      'PROPOSAL_CANCELLED',
      'PROPOSAL_EXPIRED',
    ];

    for (const evt of requiredAuditEvents) {
      assert(auditEvents.includes(evt), `Audit event recorded: ${evt}`);
    }

    // 17. Verify Super Admin Metrics Currency Isolation (Rule 4)
    console.log('\n17. Testing Super Admin Metrics Currency Isolation (Rule 4)...');
    const metricsRes = await fetch(`${BASE_URL}/api/admin/metrics`, {
      headers: { Cookie: adminSession.cookie },
    });
    assert(metricsRes.status === 200, 'Admin metrics API returned HTTP 200');
    const metricsData = await metricsRes.json();
    const propMetrics = metricsData.overview.proposals;
    assert(propMetrics.total >= 3, `Metrics total proposals count: ${propMetrics.total}`);
    assert(propMetrics.approved >= 1, `Metrics approved proposals count: ${propMetrics.approved}`);
    assert(typeof propMetrics.approvedKES_minor === 'number', `Isolated KES approved total: ${propMetrics.approvedKES_minor} minor`);
    assert(typeof propMetrics.approvedNGN_minor === 'number', `Isolated NGN approved total: ${propMetrics.approvedNGN_minor} minor`);
    assert(propMetrics.approvedKES_minor > 0, 'KES metrics accurately accumulated approved KES proposals');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    await db.close();
  }

  console.log('\n====================================================');
  console.log(`📊 PHASE 2A TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase2ATests();
