// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { query } from '@/lib/db/connection';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session || !['SUPER_ADMIN', 'ADMIN', 'COUNTRY_MANAGER'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const roleFilter = searchParams.get('role');
    const countryFilter = searchParams.get('country');

    let sql = `
      SELECT 
        u.id,
        u.email,
        u.role,
        u.status,
        u.email_verified,
        u.created_at,
        u.updated_at,
        p.first_name,
        p.last_name,
        p.phone,
        p.timezone,
        c.name as country_name,
        c.code as country_code,
        c.currency as country_currency,
        cl.id as client_id,
        cl.company_name,
        cl.industry,
        cl.representative_id,
        r.id as rep_id,
        r.referral_code,
        r.commission_rate_bps,
        r.approval_status as rep_approval_status,
        r.payout_currency,
        r.payout_method
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      LEFT JOIN countries c ON p.country_id = c.id
      LEFT JOIN clients cl ON u.id = cl.user_id
      LEFT JOIN representatives r ON u.id = r.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (roleFilter && roleFilter !== 'ALL') {
      sql += ' AND u.role = ?';
      params.push(roleFilter);
    }

    if (countryFilter && countryFilter !== 'ALL') {
      sql += ' AND c.code = ?';
      params.push(countryFilter.toUpperCase());
    }

    sql += ' ORDER BY u.created_at DESC';

    const users = await query(sql, params);

    return NextResponse.json({
      success: true,
      users,
      total: users.length,
    });
  } catch (err: any) {
    console.error('Failed to fetch admin users:', err);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
