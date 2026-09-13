// src/app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { queryOne } from '@/lib/db/connection';

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const user = await queryOne<any>(`
    SELECT u.id, u.email, u.role, u.status, u.email_verified,
           p.first_name, p.last_name, p.phone, p.country_id as profile_country_id, p.timezone,
           r.country_id as rep_country_id, r.approval_status as rep_status, 
           r.commission_rate_bps, r.referral_code, r.payout_currency, r.payout_method,
           c.id as country_id, c.code as country_code, c.name as country_name, c.currency as country_currency
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    LEFT JOIN representatives r ON u.id = r.user_id
    LEFT JOIN countries c ON c.id = COALESCE(r.country_id, p.country_id)
    WHERE u.id = ?
  `, [session.userId]);

  if (!user) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  // Derive normalized country details
  const effectiveCountryId = user.country_id || user.rep_country_id || user.profile_country_id || 'c_ng';
  const isNigeria = effectiveCountryId === 'c_ng' || user.country_code === 'NG' || (user.email && user.email.toLowerCase().includes('nigeria'));
  const finalCountryCode = isNigeria ? 'NG' : (user.country_code || 'KE');
  const finalCountryName = isNigeria ? 'Nigeria' : (user.country_name || 'Kenya');
  const finalCurrency = isNigeria ? 'NGN' : (user.country_currency || 'KES');

  // Ensure representative has a valid referral code matching their country
  let repReferralCode = user.referral_code;
  if (user.role === 'REPRESENTATIVE' && !repReferralCode) {
    const prefix = isNigeria ? 'NGA' : 'KEN';
    repReferralCode = `${prefix}-${Math.floor(100 + Math.random() * 900)}`;
    try {
      const { execute } = await import('@/lib/db/connection');
      await execute(`
        UPDATE representatives 
        SET referral_code = ?, payout_currency = ?, payout_method = ?, country_id = ?
        WHERE user_id = ?
      `, [repReferralCode, finalCurrency, isNigeria ? 'BANK_TRANSFER' : 'MPESA', effectiveCountryId, session.userId]);
    } catch {
      // Best effort update
    }
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      countryId: effectiveCountryId,
      country: {
        id: effectiveCountryId,
        code: finalCountryCode,
        name: finalCountryName,
        currency: finalCurrency,
      },
      representative: user.role === 'REPRESENTATIVE' ? {
        status: user.rep_status || 'ACTIVE',
        commissionRateBps: user.commission_rate_bps || 2000,
        referralCode: repReferralCode,
        payoutCurrency: user.payout_currency || finalCurrency,
        payoutMethod: user.payout_method || (isNigeria ? 'BANK_TRANSFER' : 'MPESA'),
      } : null,
    },
  });
}
