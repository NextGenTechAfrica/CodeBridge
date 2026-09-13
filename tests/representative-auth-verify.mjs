// tests/representative-auth-verify.mjs
const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 SALES REPRESENTATIVE GOOGLE AUTH VERIFICATION');
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

  const timestamp = Date.now();
  const mockGoogleNg = {
    sub: `google_sub_ng_${timestamp}`,
    email: `rep.ng.${timestamp}@gmail.com`,
    given_name: 'Babatunde',
    family_name: 'Adeleke',
    picture: 'https://lh3.googleusercontent.com/a/default-ng',
  };

  const mockGoogleKe = {
    sub: `google_sub_ke_${timestamp}`,
    email: `rep.ke.${timestamp}@gmail.com`,
    given_name: 'Wanjiku',
    family_name: 'Mwangi',
    picture: 'https://lh3.googleusercontent.com/a/default-ke',
  };

  let onboardingCookieNg = '';
  let repSessionCookieNg = '';
  let repSessionCookieKe = '';

  // -------------------------------------------------------------
  // Test 1: New Google Representative -> Nigeria -> ACTIVE -> Dashboard
  // -------------------------------------------------------------
  console.log('1. Testing New Google Representative (Nigeria Flow)...');
  try {
    const mockCodeNg = 'test_mock_' + encodeURIComponent(JSON.stringify(mockGoogleNg));
    const callbackRes = await fetch(`${BASE_URL}/api/auth/callback/google?code=${mockCodeNg}&state=mock_state`, {
      redirect: 'manual',
    });

    assert(callbackRes.status === 307 || callbackRes.status === 302, 'Callback redirected as expected');
    const location = callbackRes.headers.get('location');
    assert(location && location.includes('/onboarding/representative'), 'New representative redirected to /onboarding/representative');

    const setCookie = callbackRes.headers.get('set-cookie');
    assert(setCookie && setCookie.includes('cb_rep_onboarding'), 'Received signed cb_rep_onboarding cookie');
    onboardingCookieNg = setCookie.split(';')[0];

    // Submit country selection: Nigeria (NG)
    const onboardRes = await fetch(`${BASE_URL}/api/auth/representative/onboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: onboardingCookieNg,
      },
      body: JSON.stringify({ countryCode: 'NG' }),
    });

    assert(onboardRes.status === 200, 'Onboarding endpoint returned HTTP 200 OK');
    const onboardData = await onboardRes.json();
    assert(onboardData.success === true, 'Onboarding succeeded');
    assert(onboardData.redirectTo === '/dashboard/representative', 'Redirect targets /dashboard/representative');

    const sessionCookieHeader = onboardRes.headers.get('set-cookie');
    assert(sessionCookieHeader && sessionCookieHeader.includes('cb_session'), 'Received authenticated cb_session cookie');
    repSessionCookieNg = sessionCookieHeader.split(';')[0];

    // Verify session via /api/auth/me
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: repSessionCookieNg },
    });
    assert(meRes.status === 200, '/api/auth/me validated session');
    const meData = await meRes.json();
    assert(meData.user.role === 'REPRESENTATIVE', 'Role is strictly REPRESENTATIVE');
    assert(meData.user.status === 'ACTIVE', 'User status is strictly ACTIVE');
    assert(meData.user.countryId === 'c_ng', 'Country assignment is Nigeria (c_ng)');
  } catch (err) {
    assert(false, `Test 1 threw error: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 2: New Google Representative -> Kenya -> ACTIVE -> Dashboard
  // -------------------------------------------------------------
  console.log('\n2. Testing New Google Representative (Kenya Flow)...');
  try {
    const mockCodeKe = 'test_mock_' + encodeURIComponent(JSON.stringify(mockGoogleKe));
    const callbackRes = await fetch(`${BASE_URL}/api/auth/callback/google?code=${mockCodeKe}&state=mock_state`, {
      redirect: 'manual',
    });

    assert(callbackRes.status === 307 || callbackRes.status === 302, 'Kenya callback redirected');
    const setCookie = callbackRes.headers.get('set-cookie');
    const onboardingCookieKe = setCookie.split(';')[0];

    // Submit country selection: Kenya (KE)
    const onboardRes = await fetch(`${BASE_URL}/api/auth/representative/onboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: onboardingCookieKe,
      },
      body: JSON.stringify({ countryCode: 'KE' }),
    });

    assert(onboardRes.status === 200, 'Kenya onboarding returned HTTP 200 OK');
    const onboardData = await onboardRes.json();
    assert(onboardData.success === true, 'Kenya onboarding succeeded');

    const sessionCookieHeader = onboardRes.headers.get('set-cookie');
    repSessionCookieKe = sessionCookieHeader.split(';')[0];

    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: repSessionCookieKe },
    });
    const meData = await meRes.json();
    assert(meData.user.role === 'REPRESENTATIVE', 'Kenya rep role is REPRESENTATIVE');
    assert(meData.user.status === 'ACTIVE', 'Kenya rep status is ACTIVE');
    assert(meData.user.countryId === 'c_ke', 'Country assignment is Kenya (c_ke)');
  } catch (err) {
    assert(false, `Test 2 threw error: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 3: Returning Google Representative -> Direct Dashboard
  // -------------------------------------------------------------
  console.log('\n3. Testing Returning Google Representative...');
  try {
    const mockCodeNg = 'test_mock_' + encodeURIComponent(JSON.stringify(mockGoogleNg));
    const callbackRes = await fetch(`${BASE_URL}/api/auth/callback/google?code=${mockCodeNg}&state=mock_state`, {
      redirect: 'manual',
    });

    assert(callbackRes.status === 307 || callbackRes.status === 302, 'Returning callback redirected');
    const location = callbackRes.headers.get('location');
    assert(location && location.includes('/dashboard/representative'), 'Returning rep redirected DIRECTLY to dashboard');
    assert(!location.includes('/onboarding'), 'Returning rep NOT prompted for country selection');

    const setCookie = callbackRes.headers.get('set-cookie');
    assert(setCookie && setCookie.includes('cb_session'), 'Returning rep received cb_session cookie directly');
  } catch (err) {
    assert(false, `Test 3 threw error: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 4: Duplicate Prevention
  // -------------------------------------------------------------
  console.log('\n4. Testing Duplicate Prevention for Same Google Account...');
  try {
    // Attempt to call onboard again with the already used onboarding cookie
    const duplicateRes = await fetch(`${BASE_URL}/api/auth/representative/onboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: onboardingCookieNg,
      },
      body: JSON.stringify({ countryCode: 'NG' }),
    });

    const duplicateData = await duplicateRes.json();
    assert(duplicateRes.status === 200, 'Duplicate submission handled gracefully without 500 crash');
    assert(duplicateData.redirectTo === '/dashboard/representative', 'Safely returns existing representative dashboard');
  } catch (err) {
    assert(false, `Test 4 threw error: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 5: Authentication Failure Does Not Create Account
  // -------------------------------------------------------------
  console.log('\n5. Testing Auth Failure Handling...');
  try {
    const failRes = await fetch(`${BASE_URL}/api/auth/callback/google?error=access_denied`, {
      redirect: 'manual',
    });
    assert(failRes.status === 307 || failRes.status === 302, 'Denied callback redirected to register');
    const loc = failRes.headers.get('location');
    assert(loc && loc.includes('error=oauth_cancelled'), 'Redirect carries oauth_cancelled error code');
  } catch (err) {
    assert(false, `Test 5 threw error: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 6 & 7: Country Selection Enforcement & Validation
  // -------------------------------------------------------------
  console.log('\n6 & 7. Testing Country Selection Enforcement & Validation...');
  try {
    // Missing cookie
    const noCookieRes = await fetch(`${BASE_URL}/api/auth/representative/onboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ countryCode: 'NG' }),
    });
    assert(noCookieRes.status === 401, 'Request without onboarding cookie rejected with HTTP 401');

    // Invalid country code (e.g. US or GH)
    const invalidCountryRes = await fetch(`${BASE_URL}/api/auth/representative/onboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: onboardingCookieNg,
      },
      body: JSON.stringify({ countryCode: 'US' }),
    });
    assert(invalidCountryRes.status === 400, 'Invalid country code (US) rejected with HTTP 400');
  } catch (err) {
    assert(false, `Test 6 & 7 threw error: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 8 & 9: Role and Status Integrity
  // -------------------------------------------------------------
  console.log('\n8 & 9. Verifying Role & Status Integrity...');
  try {
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: repSessionCookieNg },
    });
    const meData = await meRes.json();
    assert(meData.user.role === 'REPRESENTATIVE', 'Role strictly confirmed as REPRESENTATIVE');
    assert(meData.user.status === 'ACTIVE', 'Status strictly confirmed as ACTIVE');
  } catch (err) {
    assert(false, `Test 8 & 9 threw error: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 10: Zero Admin Approval Required (Immediate Full Access)
  // -------------------------------------------------------------
  console.log('\n10. Verifying Immediate Operational Access (No Admin Approval Queue)...');
  try {
    const leadCreateRes = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: repSessionCookieNg,
      },
      body: JSON.stringify({
        businessName: 'Lekki Tech Ventures Ltd',
        contactPerson: 'Emeka Okafor',
        email: 'emeka@lekkitech.ng',
        phone: '+2348031234567',
        businessType: 'Business Websites',
        requirements: 'Full enterprise corporate rebrand and client portal.',
        estimatedBudget: '4500000',
        currency: 'NGN',
        countryCode: 'NG',
      }),
    });

    assert(leadCreateRes.status === 201, 'Representative immediately created lead without prior admin approval (HTTP 201)');
    const leadData = await leadCreateRes.json();
    assert(leadData.success === true && leadData.leadId, `Lead registered with ID: ${leadData.leadId}`);
  } catch (err) {
    assert(false, `Test 10 threw error: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 11: Non-Representative Auth Intact & Representatives Blocked from Password Login
  // -------------------------------------------------------------
  console.log('\n11. Testing Non-Representative Auth & Password Login Lockdown...');
  try {
    // Super Admin email/password login still works
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@codebridge.com',
        password: 'CodeBridge@2025!',
      }),
    });
    assert(adminLoginRes.status === 200, 'Super Admin authenticated via email/password');

    // Client email/password login still works
    let clientLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'client@abcrestaurants.com',
        password: 'CodeBridge@2025!',
      }),
    });
    if (clientLoginRes.status !== 200) {
      await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'client@abcrestaurants.com',
          password: 'CodeBridge@2025!',
          firstName: 'Demo',
          lastName: 'Client',
          companyName: 'ABC Restaurants',
          accountType: 'CLIENT',
        }),
      });
      clientLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'client@abcrestaurants.com',
          password: 'CodeBridge@2025!',
        }),
      });
    }
    assert(clientLoginRes.status === 200, 'Client authenticated via email/password');

    // Representative password login is BLOCKED
    const repBlockedRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: mockGoogleNg.email,
        password: 'oauth:google',
      }),
    });
    assert(repBlockedRes.status === 403, 'Representative password login strictly rejected with HTTP 403');
    const blockedData = await repBlockedRes.json();
    assert(blockedData.error.includes('Google'), 'Error directs representative to "Continue with Google"');

    // Representative registration via /api/auth/register is BLOCKED
    const repRegBlockedRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'another.rep@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'Rep',
        accountType: 'REPRESENTATIVE',
      }),
    });
    assert(repRegBlockedRes.status === 400, 'Representative registration via email/password API strictly blocked (HTTP 400)');
  } catch (err) {
    assert(false, `Test 11 threw error: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 12: RBAC Route Boundaries
  // -------------------------------------------------------------
  console.log('\n12. Testing RBAC Route Boundaries...');
  try {
    // Representative cannot access admin dashboard
    const repToAdminRes = await fetch(`${BASE_URL}/dashboard/admin`, {
      headers: { Cookie: repSessionCookieNg },
      redirect: 'manual',
    });
    assert(repToAdminRes.status === 307 || repToAdminRes.status === 302, 'Representative blocked from /dashboard/admin (redirected)');
    const loc = repToAdminRes.headers.get('location');
    assert(loc && loc.includes('/dashboard/representative'), 'Representative redirected back to their own dashboard');
  } catch (err) {
    assert(false, `Test 12 threw error: ${err.message}`);
  }

  console.log('\n====================================================');
  console.log(`SUMMARY: ${passed} passed, ${failed} failed.`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
