// tests/transaction-atomicity-verify.mjs
import postgres from 'postgres';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [k, ...v] = trimmed.split('=');
        const key = k.trim();
        const val = v.join('=').trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}
loadEnv();

const BASE_URL = 'http://127.0.0.1:3000';
const isPg = Boolean(
  process.env.DATABASE_URL &&
    (process.env.DATABASE_URL.startsWith('postgres://') || process.env.DATABASE_URL.startsWith('postgresql://'))
);

let dbHelper;
if (isPg) {
  const sql = postgres(process.env.DATABASE_URL, { prepare: false, ssl: 'require' });
  dbHelper = {
    isPostgres: true,
    async execute(queryText, params = []) {
      let idx = 1;
      const formatted = queryText.replace(/\?/g, () => `$${idx++}`).replace(/datetime\('now'\)/gi, 'NOW()');
      const res = await sql.unsafe(formatted, params);
      return { rows: Array.from(res), changes: res.count || 0 };
    },
    async begin(fn) {
      return sql.begin(async (txSql) => {
        const txHelper = {
          async execute(queryText, params = []) {
            let idx = 1;
            const formatted = queryText.replace(/\?/g, () => `$${idx++}`).replace(/datetime\('now'\)/gi, 'NOW()');
            const res = await txSql.unsafe(formatted, params);
            return { rows: Array.from(res), changes: res.count || 0 };
          },
        };
        return fn(txHelper);
      });
    },
    async close() {
      await sql.end({ timeout: 1 });
    },
  };
} else {
  const dbPath = path.resolve(process.cwd(), './data/codebridge.db');
  const sqlite = new DatabaseSync(dbPath);
  dbHelper = {
    isPostgres: false,
    async execute(queryText, params = []) {
      const stmt = sqlite.prepare(queryText);
      if (queryText.trim().toUpperCase().startsWith('SELECT')) {
        const rows = stmt.all(...params);
        return { rows, changes: 0 };
      } else {
        const res = stmt.run(...params);
        return { rows: [], changes: Number(res.changes) };
      }
    },
    async begin(fn) {
      sqlite.exec('BEGIN TRANSACTION;');
      const txHelper = {
        async execute(queryText, params = []) {
          const stmt = sqlite.prepare(queryText);
          if (queryText.trim().toUpperCase().startsWith('SELECT')) {
            return { rows: stmt.all(...params), changes: 0 };
          }
          const res = stmt.run(...params);
          return { rows: [], changes: Number(res.changes) };
        },
      };
      try {
        const res = await fn(txHelper);
        sqlite.exec('COMMIT;');
        return res;
      } catch (err) {
        try {
          sqlite.exec('ROLLBACK;');
        } catch {}
        throw err;
      }
    },
    async close() {
      try {
        sqlite.close();
      } catch {}
    },
  };
}

async function runTransactionAtomicityTests() {
  console.log('================================================================');
  console.log(`🧪 CODEBRIDGE TRANSACTION ATOMICITY & INTEGRITY VERIFICATION (${isPg ? 'PostgreSQL/Supabase' : 'SQLite Local'})`);
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

  // ---------------------------------------------------------------------------
  // PART 1: Low-Level Transaction Commit & Rollback Mechanics
  // ---------------------------------------------------------------------------
  console.log('1. Verifying Database Transaction Commit...');
  const testIdCommit = `tx_test_commit_${Date.now()}`;
  try {
    await dbHelper.begin(async (tx) => {
      await tx.execute(
        `INSERT INTO audit_logs (id, action, entity, entity_id, metadata_json, created_at)
         VALUES (?, 'TEST_COMMIT_STEP1', 'test_entity', ?, '{"step":1}', datetime('now'))`,
        [`${testIdCommit}_1`, testIdCommit]
      );
      await tx.execute(
        `INSERT INTO audit_logs (id, action, entity, entity_id, metadata_json, created_at)
         VALUES (?, 'TEST_COMMIT_STEP2', 'test_entity', ?, '{"step":2}', datetime('now'))`,
        [`${testIdCommit}_2`, testIdCommit]
      );
    });

    const verifyRes = await dbHelper.execute('SELECT COUNT(*) as cnt FROM audit_logs WHERE entity_id = ?', [testIdCommit]);
    const cnt = Number(verifyRes.rows[0].cnt || verifyRes.rows[0].count);
    assert(cnt === 2, 'Successful transaction committed all mutations to persistent database');
  } catch (err) {
    assert(false, `Commit test failed with error: ${err.message}`);
  }

  console.log('\n2. Verifying Forced Rollback on Error (Zero Mutations Commited)...');
  const testIdRollback = `tx_test_rollback_${Date.now()}`;
  let rollbackErrorCaught = false;
  try {
    await dbHelper.begin(async (tx) => {
      await tx.execute(
        `INSERT INTO audit_logs (id, action, entity, entity_id, metadata_json, created_at)
         VALUES (?, 'TEST_ROLLBACK_STEP1', 'test_entity', ?, '{"step":1}', datetime('now'))`,
        [`${testIdRollback}_1`, testIdRollback]
      );
      await tx.execute(
        `INSERT INTO audit_logs (id, action, entity, entity_id, metadata_json, created_at)
         VALUES (?, 'TEST_ROLLBACK_STEP2', 'test_entity', ?, '{"step":2}', datetime('now'))`,
        [`${testIdRollback}_2`, testIdRollback]
      );
      // Intentionally throw exception to force rollback
      throw new Error('INTENTIONAL_FORCED_ROLLBACK');
    });
  } catch (err) {
    rollbackErrorCaught = true;
  }

  assert(rollbackErrorCaught, 'Intentional transaction error was intercepted');
  const verifyRollbackRes = await dbHelper.execute('SELECT COUNT(*) as cnt FROM audit_logs WHERE entity_id = ?', [testIdRollback]);
  const rollbackCnt = Number(verifyRollbackRes.rows[0].cnt ?? verifyRollbackRes.rows[0].count);
  assert(rollbackCnt === 0, 'Forced rollback guaranteed that ZERO mutations persisted in database');

  console.log('\n3. Verifying Mid-Transaction Crash Rollback...');
  const testIdCrash = `tx_test_crash_${Date.now()}`;
  let crashCaught = false;
  try {
    await dbHelper.begin(async (tx) => {
      await tx.execute(
        `INSERT INTO audit_logs (id, action, entity, entity_id, metadata_json, created_at)
         VALUES (?, 'STEP1_MUTATION', 'test_entity', ?, '{"state":"mutated"}', datetime('now'))`,
        [`${testIdCrash}_1`, testIdCrash]
      );
      // Syntax / invalid table error midway
      await tx.execute('INSERT INTO non_existent_table_xyz VALUES (1, 2, 3)');
    });
  } catch (err) {
    crashCaught = true;
  }

  assert(crashCaught, 'Mid-transaction database failure was intercepted');
  const verifyCrashRes = await dbHelper.execute('SELECT COUNT(*) as cnt FROM audit_logs WHERE entity_id = ?', [testIdCrash]);
  const crashCnt = Number(verifyCrashRes.rows[0].cnt ?? verifyCrashRes.rows[0].count);
  assert(crashCnt === 0, 'Mid-transaction crash caused automatic, atomic rollback of preceding step');

  // ---------------------------------------------------------------------------
  // PART 2: Real Phase 2B Commercial Payment Verification Transaction
  // ---------------------------------------------------------------------------
  console.log('\n4. Testing Real Phase 2B Payment Verification Multi-Operation Transaction...');

  async function login(email, password = 'CodeBridge@2025!') {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const setCookie = res.headers.get('set-cookie');
    const cookie = setCookie ? setCookie.split(';')[0] : '';
    const body = await res.json();
    return { ok: res.ok, status: res.status, cookie, user: body.user };
  }

  const adminSession = await login('ops@codebridge.com');
  assert(adminSession.ok, 'Admin authenticated for commercial payment transaction test');

  // Fetch active representative for commission event link
  const repRes = await dbHelper.execute("SELECT id FROM representatives WHERE approval_status = 'ACTIVE' LIMIT 1");
  const repId = repRes.rows[0]?.id;

  // Create lead
  const testEmail = `tx.client.${Date.now()}@acme.ng`;
  const leadRes = await fetch(`${BASE_URL}/api/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
    body: JSON.stringify({
      businessName: 'Atomic Verification Corp',
      contactPerson: 'Ada Lovelace',
      email: testEmail,
      phone: '+2348000009999',
      businessType: 'FinTech',
      requirements: 'Atomic multi-step transaction verification test',
      estimatedBudget: '750000',
      currency: 'NGN',
      countryCode: 'NG',
      representativeId: repId,
    }),
  });
  const leadData = await leadRes.json();
  assert(leadRes.ok, 'Test lead created successfully');

  // Create proposal with FULL_UPFRONT structure
  const propRes = await fetch(`${BASE_URL}/api/proposals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
    body: JSON.stringify({
      leadId: leadData.lead.id,
      title: 'Atomic Payment Verification Proposal',
      scopeOfWork: 'End-to-end verification of payment atomicity and rollback mechanics.',
      deliverables: ['Database Adapter', 'Atomic Transactions', 'Supabase Migration'],
      paymentStructureType: 'FULL_UPFRONT',
      totalAmountMinor: 75000000,
      currency: 'NGN',
    }),
  });
  const propData = await propRes.json();
  assert(propRes.ok, 'Test proposal created');

  // Send proposal
  const sendRes = await fetch(`${BASE_URL}/api/proposals/${propData.proposal.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
    body: JSON.stringify({ action: 'SEND' }),
  });
  assert(sendRes.ok, 'Proposal transitioned to SENT');

  // Login as client
  const clientSession = await login(testEmail);
  assert(clientSession.ok, 'Client authenticated to approve proposal');

  // Client approves proposal -> creates Project (AWAITING_PAYMENT) & Invoice (ISSUED)
  const approveRes = await fetch(`${BASE_URL}/api/proposals/${propData.proposal.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: clientSession.cookie },
    body: JSON.stringify({ action: 'CLIENT_APPROVE' }),
  });
  const approveData = await approveRes.json();
  assert(approveRes.ok && approveData.projectId && approveData.invoiceId, 'Proposal approved: Project and Invoice created');

  const projectId = approveData.projectId;
  const invoiceId = approveData.invoiceId;

  // Verify initial state in DB
  const preInvoiceRes = await dbHelper.execute('SELECT status, amount_minor, amount_paid_minor FROM invoices WHERE id = ?', [invoiceId]);
  const preProjectRes = await dbHelper.execute('SELECT status, payment_status, total_paid_minor FROM projects WHERE id = ?', [projectId]);
  assert(preInvoiceRes.rows[0].status === 'ISSUED', 'Pre-payment: Invoice status is ISSUED');
  assert(Number(preInvoiceRes.rows[0].amount_paid_minor) === 0, 'Pre-payment: Invoice amount_paid_minor is 0');
  assert(preProjectRes.rows[0].status === 'AWAITING_PAYMENT', 'Pre-payment: Project status is AWAITING_PAYMENT');
  assert(preProjectRes.rows[0].payment_status === 'UNPAID', 'Pre-payment: Project payment_status is UNPAID');

  // Step 4A: Perform atomic payment verification
  console.log('\n5. Executing Atomic Payment Verification (All 6 Operations)...');
  const paymentRef = `TX_VERIFY_REF_${Date.now()}`;
  const verifyPaymentRes = await fetch(`${BASE_URL}/api/invoices/${invoiceId}/verify-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
    body: JSON.stringify({
      amountMinor: 75000000,
      currency: 'NGN',
      paymentMethod: 'BANK_TRANSFER',
      verificationSource: 'BANK_TRANSFER_CONFIRMATION',
      reference: paymentRef,
      verificationNotes: 'Atomic transaction test verification note',
    }),
  });
  const verifyPaymentData = await verifyPaymentRes.json();
  assert(verifyPaymentRes.ok && verifyPaymentData.success, 'HTTP 200: Payment verification completed successfully');

  // Verify all 6 database mutations atomically persisted
  const postPaymentRes = await dbHelper.execute('SELECT id, amount_minor, status, reference FROM payments WHERE reference = ?', [paymentRef]);
  assert(postPaymentRes.rows.length === 1 && postPaymentRes.rows[0].status === 'CONFIRMED', 'Op 1: Payment record persisted with status CONFIRMED');

  const postInvoiceRes = await dbHelper.execute('SELECT status, amount_paid_minor, paid_at FROM invoices WHERE id = ?', [invoiceId]);
  assert(
    postInvoiceRes.rows[0].status === 'PAID' && Number(postInvoiceRes.rows[0].amount_paid_minor) === 75000000,
    'Op 2: Invoice status transitioned to PAID with 75000000 minor paid'
  );

  const postProjectRes = await dbHelper.execute('SELECT status, payment_status, total_paid_minor, started_at FROM projects WHERE id = ?', [projectId]);
  assert(postProjectRes.rows[0].status === 'PLANNING', 'Op 4 & 5: Project transitioned from AWAITING_PAYMENT to PLANNING');
  assert(postProjectRes.rows[0].payment_status === 'PAID', 'Op 4: Project payment_status updated to PAID');
  assert(Number(postProjectRes.rows[0].total_paid_minor) === 75000000, 'Op 4: Project total_paid_minor updated to 75000000');

  const postCommEventRes = await dbHelper.execute('SELECT id, status, calculated_commission_amount_minor, idempotency_key FROM commission_events WHERE invoice_id = ?', [invoiceId]);
  assert(postCommEventRes.rows.length === 1 && postCommEventRes.rows[0].status === 'RECORDED', 'Op 6: Immutable commission_event created with status RECORDED');

  // Step 4B: Test Idempotency & Conflict Handling
  console.log('\n6. Testing Idempotency & Conflict Handling on Duplicate Payment Reference...');
  const duplicateRes = await fetch(`${BASE_URL}/api/invoices/${invoiceId}/verify-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
    body: JSON.stringify({
      amountMinor: 75000000,
      currency: 'NGN',
      paymentMethod: 'BANK_TRANSFER',
      verificationSource: 'BANK_TRANSFER_CONFIRMATION',
      reference: paymentRef,
    }),
  });
  assert(duplicateRes.status === 400 || duplicateRes.status === 409, `Duplicate payment reference rejected with HTTP ${duplicateRes.status}`);

  const paymentCountRes = await dbHelper.execute('SELECT COUNT(*) as cnt FROM payments WHERE invoice_id = ?', [invoiceId]);
  const paymentCnt = Number(paymentCountRes.rows[0].cnt || paymentCountRes.rows[0].count);
  assert(paymentCnt === 1, 'Database remains in pristine state: NO duplicate payment record created');

  // Summary
  console.log('\n================================================================');
  console.log(`TRANSACTION ATOMICITY TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  await dbHelper.close();

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTransactionAtomicityTests().catch((err) => {
  console.error('Fatal error during transaction atomicity verification:', err);
  process.exit(1);
});
