import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db/connection';
import type { Representative } from '@/lib/db/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  try {
    let rep = await queryOne<Representative & { first_name: string; last_name: string }>(
      `SELECT r.*, p.first_name, p.last_name 
       FROM representatives r 
       JOIN user_profiles p ON r.user_id = p.user_id 
       WHERE (r.referral_code = ? OR UPPER(r.referral_code) = UPPER(?)) AND r.approval_status = 'ACTIVE'`,
      [code, code]
    );

    if (!rep) {
      // Fallback: match by country prefix or assign active territory representative
      const countryId = code.toUpperCase().startsWith('NG') ? 'c_ng' : 'c_ke';
      rep = await queryOne<Representative & { first_name: string; last_name: string }>(
        `SELECT r.*, p.first_name, p.last_name 
         FROM representatives r 
         JOIN user_profiles p ON r.user_id = p.user_id 
         WHERE r.country_id = ? AND r.approval_status = 'ACTIVE'
         ORDER BY r.created_at ASC LIMIT 1`,
        [countryId]
      );
    }

    if (!rep) {
      return NextResponse.json({ error: 'Invalid or inactive referral code' }, { status: 404 });
    }

    const response = NextResponse.json({
      success: true,
      data: {
        id: rep.id,
        name: `${rep.first_name} ${rep.last_name}`,
      }
    });

    // Set cookie with 30-day expiry
    response.cookies.set({
      name: 'cb_ref',
      value: code,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    });

    return response;
  } catch (err: any) {
    console.error('Error fetching referral code:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
