// src/app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { execute, query, queryOne } from '@/lib/db/connection';
import { recordAuditLog } from '@/lib/auth/session';
import { CurrencyCode, ReferralSource } from '@/lib/db/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = (body.name || body.contactPerson || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const phone = (body.phone || '').trim();
    const countryParam = (body.country || body.countryCode || '').trim();
    const category = (body.category || body.serviceCategory || 'Technical Consultation / Scoping').trim();
    const subject = (body.subject || '').trim();
    const message = (body.message || body.requirements || '').trim();

    if (!name) {
      return NextResponse.json({ error: 'Please provide your full name.' }, { status: 400 });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    if (!message) {
      return NextResponse.json({ error: 'Please provide a message or description of your inquiry.' }, { status: 400 });
    }

    // Resolve Referral Attribution from cookie
    const cbRef = req.cookies.get('cb_ref')?.value;

    // Resolve Country
    let country = null;
    if (countryParam) {
      country = await queryOne(
        'SELECT id, currency FROM countries WHERE UPPER(code) = ? OR LOWER(name) = ?',
        [countryParam.toUpperCase(), countryParam.toLowerCase()]
      );
    }

    // Default based on referral code or default territory
    if (!country) {
      const isNg = cbRef?.toUpperCase().startsWith('NG');
      country = isNg
        ? await queryOne("SELECT id, currency FROM countries WHERE code = 'NG'")
        : await queryOne("SELECT id, currency FROM countries WHERE code = 'KE'");
    }

    const countryId = country?.id || (cbRef?.toUpperCase().startsWith('NG') ? 'c_ng' : 'c_ke');
    const currency: CurrencyCode = (country?.currency || (cbRef?.toUpperCase().startsWith('NG') ? 'NGN' : 'KES')) as CurrencyCode;

    let representativeId: string | null = null;
    let referralSource: ReferralSource = 'DIRECT';
    let systemNotes = `Direct Website Contact Inquiry [Category: ${category}]`;
    if (subject) {
      systemNotes += `\nSubject: ${subject}`;
    }

    if (cbRef) {
      referralSource = 'REFERRAL';
      const rep = await queryOne(
        "SELECT id FROM representatives WHERE referral_code = ? AND approval_status = 'ACTIVE'",
        [cbRef]
      );
      if (rep) {
        representativeId = rep.id;
        systemNotes += `\nReferred by Rep ID: ${rep.id} (Code: ${cbRef})`;
      } else {
        systemNotes += `\n[ATTRIBUTION REVIEW REQUIRED] Inactive or unvalidated referral code: ${cbRef}`;
      }
    }

    const leadId = `lead_inq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const businessName = body.businessName || `${name} Inquiry`;

    const requirementsText = subject 
      ? `[Subject: ${subject}]\n\n${message}`
      : message;

    // Insert new Lead
    await execute(`
      INSERT INTO leads (
        id, client_id, business_name, contact_person, email, phone,
        country_id, business_type, requirements, estimated_budget_minor,
        currency, referral_source, representative_id, status, notes,
        created_at, updated_at
      )
      VALUES (?, NULL, ?, ?, ?, ?, ?, 'Direct Contact Inquiry', ?, 0, ?, ?, ?, 'NEW', ?, datetime('now'), datetime('now'))
    `, [
      leadId,
      businessName,
      name,
      email,
      phone,
      countryId,
      requirementsText,
      currency,
      referralSource,
      representativeId,
      systemNotes,
    ]);

    // Notify administrators
    try {
      const admins = await query<{ id: string }>(
        "SELECT id FROM users WHERE role IN ('SUPER_ADMIN', 'ADMIN')"
      );

      for (const admin of admins) {
        const notifId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        await execute(`
          INSERT INTO notifications (id, user_id, title, message, type, is_read, link_url, created_at)
          VALUES (?, ?, ?, ?, 'INFO', 0, ?, datetime('now'))
        `, [
          notifId,
          admin.id,
          `New Inquiry from ${name}`,
          `${name} (${email}) submitted an inquiry regarding "${subject || category}".`,
          `/dashboard/admin`,
        ]);
      }
    } catch (notifErr) {
      console.warn('Failed to notify admins of contact inquiry:', notifErr);
    }

    // Record audit log
    await recordAuditLog({
      userId: 'system',
      action: 'PUBLIC_CONTACT_INQUIRY',
      entity: 'leads',
      entityId: leadId,
      metadata: { name, email, country: countryParam, referralSource },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return NextResponse.json({
      success: true,
      leadId,
      message: 'Your inquiry has been successfully received. A CodeBridge specialist will review and respond shortly.',
    }, { status: 201 });
  } catch (err: any) {
    console.error('Contact form submission error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing your message. Please try again.' },
      { status: 500 }
    );
  }
}
