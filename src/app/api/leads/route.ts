// src/app/api/leads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession, recordAuditLog } from '@/lib/auth/session';
import { query, queryOne, execute } from '@/lib/db/connection';
import { LeadStatus, CurrencyCode } from '@/lib/db/types';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, userId } = session;
    let leadsSql = `
      SELECT l.*, c.code as country_code, c.name as country_name,
             p.first_name as rep_first_name, p.last_name as rep_last_name
      FROM leads l
      JOIN countries c ON l.country_id = c.id
      LEFT JOIN representatives r ON l.representative_id = r.id
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN user_profiles p ON u.id = p.user_id
    `;
    let params: any[] = [];

    if (role === 'REPRESENTATIVE') {
      const rep = await queryOne('SELECT id FROM representatives WHERE user_id = ?', [userId]);
      if (!rep) {
        return NextResponse.json({ leads: [] });
      }
      leadsSql += ' WHERE l.representative_id = ? ORDER BY l.created_at DESC';
      params = [rep.id];
    } else if (role === 'COUNTRY_MANAGER') {
      // Find country manager's country
      const profile = await queryOne('SELECT country_id FROM user_profiles WHERE user_id = ?', [userId]);
      if (profile?.country_id) {
        leadsSql += ' WHERE l.country_id = ? ORDER BY l.created_at DESC';
        params = [profile.country_id];
      } else {
        leadsSql += ' ORDER BY l.created_at DESC';
      }
    } else if (role === 'CLIENT') {
      const client = await queryOne('SELECT id FROM clients WHERE user_id = ?', [userId]);
      if (!client) {
        return NextResponse.json({ leads: [] });
      }
      leadsSql += ' WHERE l.client_id = ? ORDER BY l.created_at DESC';
      params = [client.id];
    } else if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      leadsSql += ' ORDER BY l.created_at DESC';
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }


    const leads = await query(leadsSql, params);
    return NextResponse.json({ leads });
  } catch (err: any) {
    console.error('Failed to fetch leads:', err);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Representatives, Super Admins, and Admins can create leads
    if (!['REPRESENTATIVE', 'SUPER_ADMIN', 'ADMIN', 'COUNTRY_MANAGER'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient role permissions' }, { status: 403 });
    }

    const body = await req.json();
    const {
      businessName,
      contactPerson,
      email,
      phone,
      countryCode,
      businessType,
      requirements,
      estimatedBudget, // User passes standard units (e.g. 250000)
      currency,
      notes,
    } = body;

    if (!businessName || !contactPerson || !email || !requirements) {
      return NextResponse.json(
        { error: 'Business name, contact person, email, and requirements are required.' },
        { status: 400 }
      );
    }

    // Resolve representative ID & territory
    let repId: string | null = null;
    let repCountryCode: string | null = null;
    if (session.role === 'REPRESENTATIVE') {
      const rep = await queryOne<any>(`
        SELECT r.id, r.approval_status, c.code as country_code
        FROM representatives r
        LEFT JOIN countries c ON r.country_id = c.id
        WHERE r.user_id = ?
      `, [session.userId]);
      if (rep?.approval_status !== 'ACTIVE') {
        return NextResponse.json(
          { error: 'Your representative account is pending approval. You cannot submit active leads until approved.' },
          { status: 403 }
        );
      }
      repId = rep.id;
      repCountryCode = rep.country_code;
    } else if (body.representativeId) {
      repId = body.representativeId;
      const rep = await queryOne<any>(`
        SELECT c.code as country_code
        FROM representatives r
        LEFT JOIN countries c ON r.country_id = c.id
        WHERE r.id = ?
      `, [repId]);
      repCountryCode = rep?.country_code;
    }

    // Resolve country
    const targetCode = (countryCode || repCountryCode || (currency === 'NGN' ? 'NG' : 'KE')).toUpperCase();
    const country = await queryOne<any>('SELECT id, currency FROM countries WHERE code = ?', [targetCode]);
    const countryId = country ? country.id : (targetCode === 'NG' ? 'c_ng' : 'c_ke');
    const chosenCurrency: CurrencyCode = (currency || country?.currency || (targetCode === 'NG' ? 'NGN' : 'KES')) as CurrencyCode;

    // Monetary representation: convert to minor integer units (1 KES/NGN = 100 minor units)
    const budgetNumber = Number(estimatedBudget) || 0;
    const estimatedBudgetMinor = Math.round(budgetNumber * 100);

    const leadId = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const status: LeadStatus = 'NEW';

    await execute(`
      INSERT INTO leads (
        id, business_name, contact_person, email, phone,
        country_id, business_type, requirements, estimated_budget_minor,
        currency, representative_id, status, notes, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      leadId,
      businessName.trim(),
      contactPerson.trim(),
      email.trim().toLowerCase(),
      phone || '',
      countryId,
      businessType || 'General Business',
      requirements.trim(),
      estimatedBudgetMinor,
      chosenCurrency,
      repId,
      status,
      notes || null
    ]);

    await recordAuditLog({
      userId: session.userId,
      action: 'CREATE_LEAD',
      entity: 'leads',
      entityId: leadId,
      metadata: { businessName, country: targetCode, budgetMinor: estimatedBudgetMinor, currency: chosenCurrency },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1'
    });

    return NextResponse.json({
      success: true,
      leadId,
      lead: {
        id: leadId,
        businessName,
        contactPerson,
        status,
        currency: chosenCurrency,
        estimatedBudgetMinor,
      }
    }, { status: 201 });
  } catch (err: any) {
    console.error('Failed to create lead:', err);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
