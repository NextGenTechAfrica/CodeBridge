// src/app/api/request-project/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { execute, queryOne, transaction } from '@/lib/db/connection';
import { getCurrentSession as getSession, recordAuditLog } from '@/lib/auth/session';
import { CurrencyCode, ReferralSource } from '@/lib/db/types';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    let clientId: string | null = null;

    if (session && session.role === 'CLIENT') {
      const client = await queryOne('SELECT id FROM clients WHERE user_id = ?', [session.userId]);
      if (client) {
        clientId = client.id;
      }
    }

    const body = await req.json();
    const {
      businessName,
      contactPerson,
      email,
      phone,
      countryCode,
      businessType,
      serviceCategory,
      requirements,
      estimatedBudget,
      currency,
      timeline,
    } = body;

    if (!businessName || !contactPerson || !email || !requirements) {
      return NextResponse.json(
        { error: 'Please provide business name, contact person, email, and requirements.' },
        { status: 400 }
      );
    }

    // Deduplication check
    if (clientId) {
      const duplicate = await queryOne(
        "SELECT id FROM leads WHERE client_id = ? AND business_name = ? AND status NOT IN ('WON', 'LOST')",
        [clientId, businessName.trim()]
      );
      if (duplicate) {
        if (session) {
          await recordAuditLog({
            userId: session.userId,
            action: 'DUPLICATE_LEAD_REJECTED',
            entity: 'leads',
            entityId: duplicate.id,
            metadata: { businessName },
            ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1'
          });
        }
        return NextResponse.json({ error: 'You already have an active request for this business.' }, { status: 409 });
      }
    } else {
      const duplicate = await queryOne(
        "SELECT id FROM leads WHERE email = ? AND business_name = ? AND status NOT IN ('WON', 'LOST')",
        [email.trim().toLowerCase(), businessName.trim()]
      );
      if (duplicate) {
        return NextResponse.json({ error: 'An active scoping inquiry already exists for this business.' }, { status: 409 });
      }
    }

    // Process Referral Attribution first to deduce territory if not explicitly specified
    const cbRef = (body.referralCode || req.cookies.get('cb_ref')?.value || '').trim();
    const isNgRef = cbRef?.toUpperCase().startsWith('NG') || currency === 'NGN';
    const targetCode = (countryCode || (isNgRef ? 'NG' : 'KE')).toUpperCase();
    const countryInfo = await queryOne('SELECT id, currency FROM countries WHERE code = ?', [targetCode]);
    const countryId = countryInfo ? countryInfo.id : (targetCode === 'NG' ? 'c_ng' : 'c_ke');
    const chosenCurrency: CurrencyCode = (currency || countryInfo?.currency || (targetCode === 'NG' ? 'NGN' : 'KES')) as CurrencyCode;

    const budgetNumber = Number(estimatedBudget) || 0;
    const estimatedBudgetMinor = Math.round(budgetNumber * 100);

    const leadId = `lead_pub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    let representativeId = null;
    let referralSource: ReferralSource = 'DIRECT';
    let systemNotes = `Submitted through CodeBridge Public Web Scoping Form (Service: ${serviceCategory || 'General'})`;

    if (cbRef) {
      // Always preserve the fact that they came through a referral route
      referralSource = 'REFERRAL';
      let rep = await queryOne<{ id: string }>(
        "SELECT id FROM representatives WHERE (referral_code = ? OR UPPER(referral_code) = UPPER(?)) AND approval_status = 'ACTIVE'",
        [cbRef, cbRef]
      );
      if (!rep) {
        // Fallback to active territory representative
        const countryId = cbRef.toUpperCase().startsWith('NG') ? 'c_ng' : 'c_ke';
        rep = await queryOne<{ id: string }>(
          "SELECT id FROM representatives WHERE country_id = ? AND approval_status = 'ACTIVE' ORDER BY created_at ASC LIMIT 1",
          [countryId]
        );
      }
      if (rep) {
        representativeId = rep.id;
      } else {
        systemNotes += `\n[ATTRIBUTION REVIEW REQUIRED] Failed to resolve active referral code: ${cbRef}`;
        
        await recordAuditLog({
          userId: session?.userId || null,
          action: 'REFERRAL_ATTRIBUTION_FAILED',
          entity: 'leads',
          entityId: leadId,
          metadata: { providedCode: cbRef },
          ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1'
        });
      }
    }

    // Lookup service ID if exists
    const serviceInfo = await queryOne('SELECT id FROM services WHERE name = ?', [serviceCategory || null]);
    const serviceId = serviceInfo ? serviceInfo.id : null;

    await transaction(async (tx) => {
      await tx.execute(`
        INSERT INTO leads (
          id, client_id, business_name, contact_person, email, phone,
          country_id, business_type, requirements, estimated_budget_minor,
          currency, representative_id, referral_source, service_id, timeline,
          status, notes, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW', ?, datetime('now'), datetime('now'))
      `, [
        leadId,
        clientId,
        businessName.trim(),
        contactPerson.trim(),
        email.trim().toLowerCase(),
        phone || '',
        countryId,
        businessType || serviceCategory || 'Digital Product',
        requirements.trim(),
        estimatedBudgetMinor,
        chosenCurrency,
        representativeId,
        referralSource,
        serviceId,
        timeline || null,
        systemNotes
      ]);

      // System message for lead conversation if user session exists
      if (session?.userId) {
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        await tx.execute(`
          INSERT INTO messages (id, lead_id, sender_id, content, message_type, created_at)
          VALUES (?, ?, ?, ?, 'SYSTEM', datetime('now'))
        `, [messageId, leadId, session.userId, `Project request submitted by ${contactPerson.trim()}.`]);
      }
    });

    const auditAction = representativeId ? 'REFERRAL_ATTRIBUTED' : (cbRef && !representativeId ? 'REFERRAL_ATTRIBUTION_FAILED' : 'PUBLIC_LEAD_SUBMISSION');

    await recordAuditLog({
      userId: session?.userId || null,
      action: auditAction,
      entity: 'leads',
      entityId: leadId,
      metadata: { businessName, country: targetCode, currency: chosenCurrency, referralSource, representativeId },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1'
    });

    return NextResponse.json({
      success: true,
      leadId,
      message: 'Thank you! Your project request has been submitted to the CodeBridge engineering team.'
    }, { status: 201 });
  } catch (err: any) {
    console.error('Project request error:', err);
    return NextResponse.json({ error: 'Failed to submit project request.' }, { status: 500 });
  }
}

