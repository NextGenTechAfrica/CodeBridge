
async function verifyDB1ConcurrentRefund() {
  console.log('\n--- DB-1: CONCURRENT REFUND OVER-ALLOCATION ---');
  const sql = testDb.sql;
  try {
    const payId = 'test-db1-pay-' + Date.now();
    await sql`
      INSERT INTO payments (id, invoice_id, project_id, client_id, amount_minor, gross_amount_minor, currency, payment_method, verification_source, status, reference, verified_at, verified_by)
      VALUES (${payId}, 'test_inv', 'test_proj', 'test_client', 1000, 1000, 'NGN', 'MPESA', 'MANUAL_VERIFICATION', 'CONFIRMED', ${'REF-' + payId}, now(), 'system')
    `;
    
    // Insert refund 1 (600)
    await sql`
      INSERT INTO refunds (id, payment_id, requested_amount_minor, currency, reason, status)
      VALUES (gen_random_uuid(), ${payId}, 600, 'NGN', 'Test 1', 'PENDING_APPROVAL')
    `;
    
    // Insert refund 2 (600) - this should fail
    try {
      await sql`
        INSERT INTO refunds (id, payment_id, requested_amount_minor, currency, reason, status)
        VALUES (gen_random_uuid(), ${payId}, 600, 'NGN', 'Test 2', 'PENDING_APPROVAL')
      `;
      console.error('DB-1 FAIL: Second refund succeeded but should have exceeded allowable balance!');
    } catch (err) {
      console.log('DB-1 PASS: Over-refund blocked. Error:', err.message);
    }
  } catch (err) {
    console.error('DB-1 SETUP FAIL:', err.message);
  }
}

async function verifyDB2RefundCache() {
  console.log('\n--- DB-2: REFUND CACHE BIDIRECTIONAL SYNCHRONIZATION ---');
  const sql = testDb.sql;
  try {
    const payId = 'test-db2-pay-' + Date.now();
    await sql`
      INSERT INTO payments (id, invoice_id, project_id, client_id, amount_minor, gross_amount_minor, currency, payment_method, verification_source, status, reference, verified_at, verified_by)
      VALUES (${payId}, 'test_inv', 'test_proj', 'test_client', 1000, 1000, 'NGN', 'MPESA', 'MANUAL_VERIFICATION', 'CONFIRMED', ${'REF-' + payId}, now(), 'system')
    `;
    
    try {
      await sql`
        UPDATE payments SET amount_refunded_minor = 500 WHERE id = ${payId}
      `;
      console.error('DB-2 FAIL: Direct cache manipulation succeeded!');
    } catch (err) {
      console.log('DB-2 PASS: Direct cache manipulation blocked. Error:', err.message);
    }
  } catch (err) {
    console.error('DB-2 SETUP FAIL:', err.message);
  }
}

async function verifyDB5MilestonePayoutUniqueness() {
  console.log('\n--- DB-5: MILESTONE PAYOUT UNIQUENESS ---');
  const sql = testDb.sql;
  try {
    const mId = 'test-db5-mile-' + Date.now();
    const p1 = 'test-db5-p1-' + Date.now();
    const p2 = 'test-db5-p2-' + Date.now();
    
    await sql`
      INSERT INTO provider_payouts (id, milestone_id, provider_id, project_id, amount_minor, currency, status, idempotency_key)
      VALUES (${p1}, ${mId}, 'prov', 'proj', 1000, 'NGN', 'PENDING_PROCESSING', 'IDEM-' || ${p1})
    `;
    
    try {
      await sql`
        INSERT INTO provider_payouts (id, milestone_id, provider_id, project_id, amount_minor, currency, status, idempotency_key)
        VALUES (${p2}, ${mId}, 'prov', 'proj', 1000, 'NGN', 'PENDING_PROCESSING', 'IDEM-' || ${p2})
      `;
      console.error('DB-5 FAIL: Duplicate milestone payout succeeded!');
    } catch (err) {
      console.log('DB-5 PASS: Duplicate milestone payout blocked. Error:', err.message);
    }
  } catch (err) {
    console.log('DB-5 FAIL:', err.message);
  }
}

async function verifyDB6CommissionPayoutUniqueness() {
  console.log('\n--- DB-6: COMMISSION PAYOUT UNIQUENESS ---');
  const sql = testDb.sql;
  try {
    const cId = 'test-db6-comm-' + Date.now();
    const p1 = 'test-db6-c1-' + Date.now();
    const p2 = 'test-db6-c2-' + Date.now();
    
    await sql`
      INSERT INTO commission_payouts (id, commission_id, sales_rep_id, amount_minor, currency, status, idempotency_key, payout_destination)
      VALUES (${p1}, ${cId}, 'rep', 1000, 'NGN', 'PENDING_PROCESSING', 'IDEM-' || ${p1}, 'bank')
    `;
    
    try {
      await sql`
        INSERT INTO commission_payouts (id, commission_id, sales_rep_id, amount_minor, currency, status, idempotency_key, payout_destination)
        VALUES (${p2}, ${cId}, 'rep', 1000, 'NGN', 'PENDING_PROCESSING', 'IDEM-' || ${p2}, 'bank')
      `;
      console.error('DB-6 FAIL: Duplicate commission payout succeeded!');
    } catch (err) {
      console.log('DB-6 PASS: Duplicate commission payout blocked. Error:', err.message);
    }
  } catch (err) {
    console.log('DB-6 FAIL:', err.message);
  }
}

async function verifyDB8PrivilegeEscalation() {
  console.log('\n--- DB-8: PRIVILEGE ESCALATION PROTECTION ---');
  const sql = testDb.sql;
  try {
    await sql.begin(async (tx) => {
      await tx`SET LOCAL ROLE anon`;
      await tx`UPDATE users SET role = 'ADMIN' WHERE email = 'test@example.com'`;
    });
    console.error('DB-8 FAIL: Anon role updated users table!');
  } catch (err) {
    console.log('DB-8 PASS: Anon role blocked. Error:', err.message);
  }
}

async function verifyDB9WebhookDeduplication() {
  console.log('\n--- DB-9: WEBHOOK DEDUPLICATION ---');
  const sql = testDb.sql;
  try {
    const evId = 'test-db9-ev-' + Date.now();
    await sql`
      INSERT INTO webhook_events (id, provider, event_id, event_type, payload_json, status)
      VALUES (${evId}, 'FLUTTERWAVE', 'ev123', 'TEST', '{}', 'PENDING_PROCESSING')
    `;
    
    try {
      await sql`
        INSERT INTO webhook_events (id, provider, event_id, event_type, payload_json, status)
        VALUES (gen_random_uuid(), 'FLUTTERWAVE', 'ev123', 'TEST', '{}', 'PENDING_PROCESSING')
      `;
      console.error('DB-9 FAIL: Duplicate webhook event succeeded!');
    } catch (err) {
      console.log('DB-9 PASS: Duplicate webhook event blocked. Error:', err.message);
    }
  } catch (err) {
    console.log('DB-9 FAIL:', err.message);
  }
}

async function verifyDB10FailedWebhookRetry() {
  console.log('\n--- DB-10: FAILED WEBHOOK SAFE RETRY ---');
  const sql = testDb.sql;
  try {
    const evId = 'test-db10-ev-' + Date.now();
    await sql`
      INSERT INTO webhook_events (id, provider, event_id, event_type, payload_json, status, error_message, processed_at)
      VALUES (${evId}, 'FLUTTERWAVE', 'ev1234', 'TEST', '{}', 'FAILED', 'Some error', CURRENT_TIMESTAMP)
    `;
    
    try {
      await sql`
        UPDATE webhook_events 
        SET status = 'PENDING_PROCESSING', error_message = NULL, processed_at = NULL
        WHERE id = ${evId} AND status = 'FAILED'
      `;
      const rows = await sql`SELECT status FROM webhook_events WHERE id = ${evId}`;
      if (rows[0].status === 'PENDING_PROCESSING') {
         console.log('DB-10 PASS: Failed webhook retry update succeeded.');
      } else {
         console.error('DB-10 FAIL: Failed webhook retry status is not PENDING_PROCESSING.');
      }
    } catch (err) {
      console.error('DB-10 FAIL: Retry update threw error:', err.message);
    }
  } catch (err) {
    console.log('DB-10 FAIL:', err.message);
  }
}
