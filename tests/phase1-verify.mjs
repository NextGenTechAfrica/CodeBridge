// tests/phase1-verify.mjs
const BASE_URL = 'http://127.0.0.1:3000';

async function testPhase1() {
  console.log('====================================================');
  console.log('🧪 CODEBRIDGE PHASE 1 COMPREHENSIVE VERIFICATION');
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

  // 1. Public Pages Health
  console.log('1. Verifying Public Website Pages...');
  const publicRoutes = ['/', '/services', '/how-it-works', '/about', '/contact', '/request-project', '/login', '/register'];
  for (const route of publicRoutes) {
    try {
      const res = await fetch(`${BASE_URL}${route}`);
      assert(res.status === 200, `Page ${route} returned HTTP 200`);
      const html = await res.text();
      assert(html.includes('CODEBRIDGE') || html.includes('CodeBridge'), `Page ${route} contains brand lockup`);
    } catch (err) {
      assert(false, `Page ${route} threw error: ${err.message}`);
    }
  }

  // 2. Public Project Scoping Request Intake
  console.log('\n2. Testing Public Project Scoping Form (/api/request-project)...');
  try {
    const res = await fetch(`${BASE_URL}/api/request-project`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: `[DEMO TEST] Westlands Hotel & Suites ${Date.now()}`,
        contactPerson: 'Dennis Kiprop',
        email: `dennis_${Date.now()}@westlandshotel.ke`,
        phone: '+254700112233',
        countryCode: 'KE',
        businessType: 'Restaurant & Hospitality',
        serviceCategory: 'Restaurant Websites & Ordering Systems',
        requirements: 'Multi-restaurant room service digital ordering with mobile checkout.',
        estimatedBudget: 350000,
        currency: 'KES',
      }),
    });
    assert(res.status === 201, 'Intake API returned HTTP 201 Created');
    const data = await res.json();
    assert(data.success === true && data.leadId, `Lead created with ID: ${data.leadId}`);
  } catch (err) {
    assert(false, `Intake API error: ${err.message}`);
  }

  // 3. Registration & RBAC Authorization Gate
  console.log('\n3. Testing Registration & Role-escalation Gate (/api/auth/register)...');
  // 3a. Unauthorized role escalation attempt
  try {
    const resEscalate = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'hackadmin@codebridge.com',
        password: 'Password123!',
        firstName: 'Hacker',
        lastName: 'Attempt',
        accountType: 'SUPER_ADMIN',
      }),
    });
    assert(resEscalate.status === 403, 'Attempting public registration as SUPER_ADMIN returned HTTP 403 Forbidden');
  } catch (err) {
    assert(false, `Escalation test error: ${err.message}`);
  }

  // 3b. Representative Registration Security Gate (must be Google-only)
  const testRepEmail = `testrep_${Date.now()}@codebridge.ke`;
  try {
    const resRepReg = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testRepEmail,
        password: 'CodeBridge@2025!',
        firstName: 'Nairobi',
        lastName: 'Applicant',
        phone: '+254799000111',
        countryCode: 'KE',
        accountType: 'REPRESENTATIVE',
      }),
    });
    assert(resRepReg.status === 400, 'Direct password registration for REPRESENTATIVE rejected with HTTP 400');
    const dataRep = await resRepReg.json();
    assert(dataRep.error.includes('Google'), 'Error directs representative to "Continue with Google"');

    // Onboard new representative via Google OAuth flow
    const mockRepCode = 'test_mock_' + encodeURIComponent(JSON.stringify({
      sub: `google_sub_${Date.now()}`,
      email: testRepEmail,
      given_name: 'Nairobi',
      family_name: 'Applicant',
    }));
    const callbackRes = await fetch(`${BASE_URL}/api/auth/callback/google?code=${mockRepCode}&state=mock_state`, {
      redirect: 'manual',
    });
    const onboardingCookie = callbackRes.headers.get('set-cookie')?.split(';')[0];
    const onboardRes = await fetch(`${BASE_URL}/api/auth/representative/onboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: onboardingCookie },
      body: JSON.stringify({ countryCode: 'KE' }),
    });
    assert(onboardRes.status === 200, 'New representative onboarded immediately via Google + country selection');
    const onboardData = await onboardRes.json();
    assert(onboardData.redirectTo === '/dashboard/representative', 'Directs immediately to representative dashboard');
  } catch (err) {
    assert(false, `Rep reg error: ${err.message}`);
  }

  // 4. Multi-Role Authentication & Target Dashboard Routing
  console.log('\n4. Testing Login for all defined roles (/api/auth/login)...');
  const roleLogins = [
    { email: 'superadmin@codebridge.com', role: 'SUPER_ADMIN', expectedRedirect: '/dashboard/super-admin' },
    { email: 'ops@codebridge.com', role: 'ADMIN', expectedRedirect: '/dashboard/admin' },
    { email: 'countrymanager.ke@codebridge.com', role: 'COUNTRY_MANAGER', expectedRedirect: '/dashboard/country-manager' },
    { email: 'dev@codebridge.com', role: 'DEVELOPER', expectedRedirect: '/dashboard/developer' },
    { email: 'client@abcrestaurants.com', role: 'CLIENT', expectedRedirect: '/dashboard/client' },
  ];

  let superAdminCookie = '';
  let repCookie = '';

  for (const acc of roleLogins) {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: acc.email, password: 'CodeBridge@2025!' }),
      });
      assert(res.status === 200, `Login succeeded for ${acc.role} (${acc.email})`);
      const data = await res.json();
      assert(data.redirectTo === acc.expectedRedirect, `Target dashboard path correct: ${data.redirectTo}`);

      const setCookie = res.headers.get('set-cookie');
      assert(setCookie && setCookie.includes('cb_session'), 'Received HTTP-only cb_session cookie');

      if (acc.role === 'SUPER_ADMIN') superAdminCookie = setCookie;
    } catch (err) {
      assert(false, `Login failed for ${acc.role}: ${err.message}`);
    }
  }

  // Verify Representative password login is BLOCKED at /api/auth/login
  try {
    const repLoginBlocked = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rep.kenya@codebridge.com', password: 'CodeBridge@2025!' }),
    });
    assert(repLoginBlocked.status === 403, 'Representative password login strictly rejected with HTTP 403');
    const blockedData = await repLoginBlocked.json();
    assert(blockedData.error.includes('Google'), 'Error directs representative to "Continue with Google"');

    // Authenticate representative via Google OAuth callback
    const mockRepCode = 'test_mock_' + encodeURIComponent(JSON.stringify({
      sub: 'google_sub_rep_kenya_phase1',
      email: 'rep.kenya@codebridge.com',
      given_name: 'Kenya',
      family_name: 'Representative',
    }));
    const repGoogleRes = await fetch(`${BASE_URL}/api/auth/callback/google?code=${mockRepCode}&state=mock_state`, {
      redirect: 'manual',
    });
    assert(repGoogleRes.status === 307 || repGoogleRes.status === 302, 'Returning representative redirected via Google OAuth');
    const repLocation = repGoogleRes.headers.get('location');
    assert(repLocation && repLocation.includes('/dashboard/representative'), 'Redirected to /dashboard/representative');
    const repSetCookie = repGoogleRes.headers.get('set-cookie');
    assert(repSetCookie && repSetCookie.includes('cb_session'), 'Received cb_session cookie via Google OAuth');
    repCookie = repSetCookie.split(';')[0];
  } catch (err) {
    assert(false, `Representative Google authentication error: ${err.message}`);
  }

  // 5. Representative Administration
  console.log('\n5. Testing Representative Administration (/api/admin/representatives)...');
  try {
    // List reps with Super Admin cookie
    const resReps = await fetch(`${BASE_URL}/api/admin/representatives`, {
      headers: { Cookie: superAdminCookie },
    });
    assert(resReps.status === 200, 'Super Admin fetched representative roster');
    const repsData = await resReps.json();
    assert(Array.isArray(repsData.representatives) && repsData.representatives.length > 0, 'Representative roster contains representatives');
    const kenyaRep = repsData.representatives?.find(r => r.email === 'rep.kenya@codebridge.com');
    if (kenyaRep) {
      assert(kenyaRep.approval_status === 'ACTIVE', 'Existing representative has ACTIVE status');
    }
  } catch (err) {
    assert(false, `Rep administration error: ${err.message}`);
  }


  // 6. Representative Lead Creation & Pipeline Lifecycle
  console.log('\n6. Testing Representative Lead Lifecycle & Conversion (/api/leads)...');
  let testLeadId = '';
  try {
    const resLeadCreate = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: repCookie },
      body: JSON.stringify({
        businessName: '[DEMO TEST] Karen Coffee Roasters',
        contactPerson: 'David Mutua',
        email: 'david@karencoffee.co.ke',
        phone: '+254711889900',
        countryCode: 'KE',
        businessType: 'E-commerce Store',
        requirements: 'Online bean orders, recurring subscription box, and delivery dispatch.',
        estimatedBudget: 320000, // 320,000 KES
        currency: 'KES',
      }),
    });
    assert(resLeadCreate.status === 201, 'Representative created new Kenya lead');
    const leadData = await resLeadCreate.json();
    testLeadId = leadData.lead.id;
    assert(leadData.lead.status === 'NEW', 'Lead starts with status NEW');
    assert(leadData.lead.estimatedBudgetMinor === 32000000, 'Budget stored accurately in minor units (32,000,000 cents)');

    // Progress Lead: NEW -> QUALIFIED
    const resProgress = await fetch(`${BASE_URL}/api/leads/${testLeadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: repCookie },
      body: JSON.stringify({ status: 'QUALIFIED', notes: 'Budget approved by client David' }),
    });
    assert(resProgress.status === 200, 'Advanced lead status to QUALIFIED');

    // Progress Lead to WON and convert to Client + Project (Super Admin action)
    const resWon = await fetch(`${BASE_URL}/api/leads/${testLeadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: superAdminCookie },
      body: JSON.stringify({ status: 'WON', convertToClient: true }),
    });
    assert(resWon.status === 200, 'Advanced lead to WON and triggered conversion');
    const wonData = await resWon.json();
    assert(wonData.converted === true && wonData.clientId && wonData.projectId, `Converted to Client (${wonData.clientId}) & Project (${wonData.projectId})`);
  } catch (err) {
    assert(false, `Lead lifecycle error: ${err.message}`);
  }

  // 7. Audit Log Verification
  console.log('\n7. Verifying System Audit Logs (/api/admin/metrics)...');
  try {
    const resMetrics = await fetch(`${BASE_URL}/api/admin/metrics`, {
      headers: { Cookie: superAdminCookie },
    });
    assert(resMetrics.status === 200, 'Fetched system metrics');
    const metricsData = await resMetrics.json();
    assert(metricsData.recentAuditLogs && metricsData.recentAuditLogs.length > 0, `Audit logs actively recording (${metricsData.recentAuditLogs.length} recent entries)`);
    const hasApprovalLog = metricsData.recentAuditLogs.some(l => l.action.includes('REPRESENTATIVE_APPROVE') || l.action.includes('CREATE_LEAD'));
    assert(hasApprovalLog, 'Audit log records representative and lead events with timestamps');
  } catch (err) {
    assert(false, `Audit log error: ${err.message}`);
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

testPhase1();
