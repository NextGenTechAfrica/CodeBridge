// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute, transaction } from '@/lib/db/connection';
import { hashPassword } from '@/lib/auth/password';
import { signSessionToken } from '@/lib/auth/jwt';
import { SESSION_COOKIE_NAME, getDefaultDashboardPath, recordAuditLog } from '@/lib/auth/session';
import { UserRole, UserStatus } from '@/lib/db/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      countryCode, // 'NG' or 'KE'
      accountType, // 'CLIENT' or 'REPRESENTATIVE'
      companyName,
      industry,
    } = body;

    if (!email || !password || !firstName || !lastName || !accountType) {
      return NextResponse.json(
        { error: 'Please provide all required fields: name, email, password, and account type.' },
        { status: 400 }
      );
    }

    // Security Gate: Strict prevention of administrative role escalation
    const allowedRegistrationRoles: UserRole[] = ['CLIENT', 'REPRESENTATIVE'];
    if (!allowedRegistrationRoles.includes(accountType as UserRole)) {
      return NextResponse.json(
        { error: 'Public registration is only available for Clients and Sales Representatives. Administrative roles cannot be registered publicly.' },
        { status: 403 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existing = await queryOne('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail]);
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    // Resolve country
    const targetCountryCode = (countryCode || 'NG').toUpperCase();
    const country = await queryOne('SELECT id, currency FROM countries WHERE code = ?', [targetCountryCode]);
    const countryId = country ? country.id : (targetCountryCode === 'KE' ? 'c_ke' : 'c_ng');
    const currency = country?.currency || (targetCountryCode === 'KE' ? 'KES' : 'NGN');

    const userId = `u_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const hashedPassword = await hashPassword(password);

    // Initial status: ACTIVE so users can immediately access their designated dashboard
    const initialStatus: UserStatus = 'ACTIVE';

    // Check for referral code attribution if client
    const cbRef = (body.referralCode || req.cookies.get('cb_ref')?.value || '').trim();
    let representativeId: string | null = null;
    let referralSource = 'DIRECT';

    if (cbRef && accountType === 'CLIENT') {
      const rep = await queryOne<{ id: string }>(
        "SELECT id FROM representatives WHERE (referral_code = ? OR UPPER(referral_code) = UPPER(?)) AND approval_status = 'ACTIVE'",
        [cbRef, cbRef]
      );
      if (rep) {
        representativeId = rep.id;
        referralSource = 'REFERRAL';
      }
    }

    // Execute atomic creation transaction
    await transaction(async (tx) => {
      // 1. Insert User
      await tx.execute(`
        INSERT INTO users (id, email, password_hash, role, status, email_verified, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))
      `, [userId, cleanEmail, hashedPassword, accountType, initialStatus]);

      // 2. Insert Profile
      await tx.execute(`
        INSERT INTO user_profiles (user_id, first_name, last_name, phone, country_id, timezone, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
        userId,
        firstName.trim(),
        lastName.trim(),
        phone || '',
        countryId,
        targetCountryCode === 'KE' ? 'Africa/Nairobi' : 'Africa/Lagos'
      ]);

      // 3. Insert Role-specific record
      if (accountType === 'REPRESENTATIVE') {
        const repId = `rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const prefix = targetCountryCode === 'KE' ? 'KEN' : 'NGA';
        const repReferralCode = `${prefix}-${Math.floor(100 + Math.random() * 900)}`;
        const payoutCurrency = targetCountryCode === 'KE' ? 'KES' : 'NGN';
        const payoutMethod = targetCountryCode === 'KE' ? 'MPESA' : 'BANK_TRANSFER';

        await tx.execute(`
          INSERT INTO representatives (
            id, user_id, country_id, territory_id, approval_status, commission_rate_bps,
            referral_code, payout_currency, payout_method, notes, approved_at, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, 'ACTIVE', 2000, ?, ?, ?, 'Direct email/password registered representative', datetime('now'), datetime('now'), datetime('now'))
        `, [repId, userId, countryId, targetCountryCode, repReferralCode, payoutCurrency, payoutMethod]);
      } else if (accountType === 'CLIENT') {
        const clientId = `cli_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const effectiveCompanyName = companyName || `${firstName}'s Enterprise`;
        const effectiveIndustry = industry || 'Technology';

        await tx.execute(`
          INSERT INTO clients (id, user_id, company_name, industry, country_id, representative_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [clientId, userId, effectiveCompanyName, effectiveIndustry, countryId, representativeId]);

        // 4. Create an initial lead entry so the client immediately reflects in the backend CRM and Admin Leads Pipeline!
        const leadId = `lead_reg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        await tx.execute(`
          INSERT INTO leads (
            id, client_id, business_name, contact_person, email, phone,
            country_id, business_type, requirements, estimated_budget_minor,
            currency, representative_id, referral_source, status, notes, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 'NEW', 'Direct client portal registration', datetime('now'), datetime('now'))
        `, [
          leadId,
          clientId,
          effectiveCompanyName,
          `${firstName.trim()} ${lastName.trim()}`,
          cleanEmail,
          phone || '',
          countryId,
          effectiveIndustry,
          'Client registered account on CodeBridge portal. Awaiting technical project requirements.',
          currency,
          representativeId,
          referralSource,
        ]);
      }
    });

    // Record audit log
    await recordAuditLog({
      userId,
      action: 'USER_REGISTRATION',
      entity: 'users',
      entityId: userId,
      metadata: { role: accountType, status: initialStatus, country: targetCountryCode },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1'
    });

    // Sign session token
    const token = await signSessionToken({
      userId,
      email: cleanEmail,
      role: accountType,
      status: initialStatus,
      countryId,
      firstName,
      lastName,
    });

    const targetDashboard = getDefaultDashboardPath(accountType);

    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: cleanEmail,
        role: accountType,
        status: initialStatus,
        firstName,
        lastName,
      },
      redirectTo: targetDashboard,
      message: accountType === 'REPRESENTATIVE'
        ? 'Registration successful! Your representative account is pending administrative approval.'
        : 'Welcome to CodeBridge! Your account is active.'
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred during registration.' },
      { status: 500 }
    );
  }
}
