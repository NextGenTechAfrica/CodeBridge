// src/app/api/representative/clients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession, recordAuditLog } from '@/lib/auth/session';
import { query, queryOne, execute, transaction } from '@/lib/db/connection';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session || !['REPRESENTATIVE', 'SUPER_ADMIN', 'ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    let repId: string | null = null;
    if (session.role === 'REPRESENTATIVE') {
      const rep = await queryOne<any>('SELECT id FROM representatives WHERE user_id = ?', [session.userId]);
      if (!rep) return NextResponse.json({ error: 'Representative profile not found.' }, { status: 404 });
      repId = rep.id;
    } else {
      const url = new URL(req.url);
      repId = url.searchParams.get('repId');
    }

    let sql = `
      SELECT c.id, c.company_name, c.industry, c.country_id, c.created_at,
             u.email, p.first_name, p.last_name, p.phone,
             (SELECT COUNT(*) FROM projects WHERE client_id = c.id) as project_count,
             (SELECT COALESCE(SUM(amount_paid_minor), 0) FROM invoices WHERE client_id = c.id) as total_paid_minor
      FROM clients c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN user_profiles p ON u.id = p.user_id
    `;
    const params: any[] = [];

    if (repId) {
      sql += ' WHERE c.representative_id = ?';
      params.push(repId);
    }

    sql += ' ORDER BY c.created_at DESC';

    const clients = await query<any>(sql, params);
    return NextResponse.json({ success: true, clients });
  } catch (err: any) {
    console.error('Failed to fetch rep clients:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session || !['REPRESENTATIVE', 'SUPER_ADMIN', 'ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const rep = await queryOne<any>(`
      SELECT r.id, r.referral_code, r.country_id, c.currency
      FROM representatives r
      JOIN countries c ON r.country_id = c.id
      WHERE r.user_id = ? AND r.approval_status = 'ACTIVE'
    `, [session.userId]);

    if (!rep && session.role === 'REPRESENTATIVE') {
      return NextResponse.json({ error: 'Active representative profile required.' }, { status: 403 });
    }

    const repId = rep ? rep.id : null;
    const isNigeria = rep?.country_id === 'c_ng' || rep?.referral_code?.startsWith('NGA');
    const fallbackCountryId = isNigeria ? 'c_ng' : 'c_ke';
    const fallbackCurrency = isNigeria ? 'NGN' : 'KES';
    const refCode = rep?.referral_code || (isNigeria ? 'NGA-001' : 'KEN-001');

    const body = await req.json();
    const { companyName, contactPerson, email, phone, requirements, notes } = body;

    if (!companyName || !email) {
      return NextResponse.json({ error: 'Company name and email are required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const clientId = `cli_rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const userId = `usr_client_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const leadId = `lead_rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    await transaction(async (tx) => {
      // 1. Create User account if not exists
      let existingUser = await tx.queryOne<any>('SELECT id FROM users WHERE email = ?', [cleanEmail]);
      let targetUserId = existingUser?.id;

      if (!targetUserId) {
        targetUserId = userId;
        await tx.execute(`
          INSERT INTO users (id, email, password_hash, role, status, created_at, updated_at)
          VALUES (?, ?, 'INVITED_CLIENT_NO_PASS', 'CLIENT', 'PENDING', datetime('now'), datetime('now'))
        `, [targetUserId, cleanEmail]);

        const [firstName, ...rest] = (contactPerson || 'Valued Client').trim().split(' ');
        const lastName = rest.join(' ') || 'Client';

        await tx.execute(`
          INSERT INTO user_profiles (user_id, first_name, last_name, phone, country_id, timezone, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `, [targetUserId, firstName, lastName, phone || '', rep?.country_id || fallbackCountryId, isNigeria ? 'Africa/Lagos' : 'Africa/Nairobi']);
      }

      // 2. Create Client Record locked to this Representative
      await tx.execute(`
        INSERT INTO clients (id, user_id, company_name, country_id, representative_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [clientId, targetUserId, companyName.trim(), rep?.country_id || 'c_ke', repId]);

      // 3. Create initial lead record for sales tracking
      await tx.execute(`
        INSERT INTO leads (
          id, client_id, business_name, contact_person, email, phone,
          country_id, business_type, requirements, estimated_budget_minor,
          currency, representative_id, referral_source, status, notes, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'General Business', ?, 0, ?, ?, 'OFFLINE_REP', 'PROSPECT', ?, datetime('now'), datetime('now'))
      `, [
        leadId,
        clientId,
        companyName.trim(),
        contactPerson || 'Valued Client',
        cleanEmail,
        phone || '',
        rep?.country_id || fallbackCountryId,
        requirements || 'Initial prospect registered offline by Sales Representative',
        rep?.currency || fallbackCurrency,
        repId,
        notes || 'Created via Rep offline onboarding workflow',
      ]);
    });

    await recordAuditLog({
      userId: session.userId,
      action: 'REP_CLIENT_CREATED_OFFLINE',
      entity: 'clients',
      entityId: clientId,
      metadata: { repId, companyName, email: cleanEmail },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    const onboardingUrl = `https://code-bridge-rosy.vercel.app/start?ref=${refCode}&client=${clientId}`;

    return NextResponse.json({
      success: true,
      clientId,
      onboardingUrl,
      message: 'Prospect successfully created and attributed to representative.',
    });
  } catch (err: any) {
    console.error('Error creating rep client:', err);
    return NextResponse.json({ error: 'Failed to create client.' }, { status: 500 });
  }
}
