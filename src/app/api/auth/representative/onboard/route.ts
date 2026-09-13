// src/app/api/auth/representative/onboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { queryOne, transaction, execute } from '@/lib/db/connection';
import { verifyOnboardingToken, signSessionToken } from '@/lib/auth/jwt';
import { SESSION_COOKIE_NAME, recordAuditLog } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const onboardingCookie = req.cookies.get('cb_rep_onboarding')?.value;
    if (!onboardingCookie) {
      return NextResponse.json(
        { error: 'Onboarding session expired or not found. Please authenticate with Google again.' },
        { status: 401 }
      );
    }

    const payload = await verifyOnboardingToken(onboardingCookie);
    if (!payload || !payload.googleId || !payload.email) {
      return NextResponse.json(
        { error: 'Invalid onboarding credentials. Please authenticate with Google again.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { countryCode } = body;

    const normalizedCountryName = (countryCode || '').trim();
    if (!normalizedCountryName) {
      return NextResponse.json(
        { error: 'Please provide a valid operating country.' },
        { status: 400 }
      );
    }

    // Verify country is active in database and supported
    const country = await queryOne<{ id: string; code: string; currency: string; timezone: string }>(
      'SELECT id, code, currency, timezone FROM countries WHERE (LOWER(name) = ? OR UPPER(code) = ?) AND is_active = 1',
      [normalizedCountryName.toLowerCase(), normalizedCountryName.toUpperCase()]
    );

    if (!country) {
      return NextResponse.json(
        { error: 'Operating country is not currently supported for sales representatives. Currently supported: Nigeria (NG), Kenya (KE).' },
        { status: 400 }
      );
    }

    const countryId = country.id;
    const timezone = country.timezone || (country.code === 'KE' ? 'Africa/Nairobi' : 'Africa/Lagos');

    // Check if an account with this google_id or email already exists
    const existing = await queryOne(`
      SELECT id, role FROM users WHERE google_id = ? OR LOWER(email) = ?
    `, [payload.googleId, payload.email.toLowerCase()]);

    if (existing) {
      if (existing.role !== 'REPRESENTATIVE') {
        return NextResponse.json(
          { error: 'An account with this email address already exists with another role.' },
          { status: 409 }
        );
      }

      // Existing representative: sign token and redirect
      const token = await signSessionToken({
        userId: existing.id,
        email: payload.email,
        role: 'REPRESENTATIVE',
        status: 'ACTIVE',
        countryId,
        firstName: payload.firstName,
        lastName: payload.lastName,
      });

      const response = NextResponse.json({
        success: true,
        redirectTo: '/dashboard/representative',
        message: 'Welcome back to your Sales Representative workspace.',
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

      response.cookies.delete('cb_rep_onboarding');
      return response;
    }

    const userId = `u_rep_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const repId = `rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    // Execute atomic creation transaction: immediate ACTIVE status, no admin approval
    await transaction(async (tx) => {
      // 1. Insert User
      await tx.execute(`
        INSERT INTO users (id, email, password_hash, role, status, google_id, email_verified, created_at, updated_at)
        VALUES (?, ?, 'oauth:google', 'REPRESENTATIVE', 'ACTIVE', ?, 1, datetime('now'), datetime('now'))
      `, [userId, payload.email.toLowerCase(), payload.googleId]);

      // 2. Insert Profile
      await tx.execute(`
        INSERT INTO user_profiles (user_id, first_name, last_name, phone, country_id, timezone, avatar_url, updated_at)
        VALUES (?, ?, ?, '', ?, ?, ?, datetime('now'))
      `, [
        userId,
        payload.firstName.trim(),
        payload.lastName.trim(),
        countryId,
        timezone,
        payload.avatarUrl || null,
      ]);

      const isNigeria = country.code === 'NG';
      const prefix = isNigeria ? 'NGA' : 'KEN';
      const repReferralCode = `${prefix}-${Math.floor(100 + Math.random() * 900)}`;
      const payoutCurrency = isNigeria ? 'NGN' : 'KES';
      const payoutMethod = isNigeria ? 'BANK_TRANSFER' : 'MPESA';

      // 3. Insert Representative record (Immediate ACTIVE status, country-aligned referral & payout)
      await tx.execute(`
        INSERT INTO representatives (
          id, user_id, country_id, approval_status, commission_rate_bps,
          referral_code, payout_currency, payout_method, notes, approved_at, created_at, updated_at
        )
        VALUES (?, ?, ?, 'ACTIVE', 2000, ?, ?, ?, 'Google OAuth self-onboarded', datetime('now'), datetime('now'), datetime('now'))
      `, [repId, userId, countryId, repReferralCode, payoutCurrency, payoutMethod]);
    });

    // Record audit log
    await recordAuditLog({
      userId,
      action: 'USER_REGISTRATION_GOOGLE',
      entity: 'users',
      entityId: userId,
      metadata: {
        role: 'REPRESENTATIVE',
        status: 'ACTIVE',
        country: normalizedCountryName,
        authMethod: 'google_oauth',
      },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    // Sign session token
    const token = await signSessionToken({
      userId,
      email: payload.email.toLowerCase(),
      role: 'REPRESENTATIVE',
      status: 'ACTIVE',
      countryId,
      firstName: payload.firstName,
      lastName: payload.lastName,
    });

    const response = NextResponse.json({
      success: true,
      redirectTo: '/dashboard/representative',
      message: 'Onboarding complete! Welcome to the CodeBridge Sales Representative workspace.',
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

    // Clear temporary onboarding cookie
    response.cookies.delete('cb_rep_onboarding');

    return response;
  } catch (err: any) {
    console.error('Representative onboarding error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred during representative onboarding.' },
      { status: 500 }
    );
  }
}
