// src/app/api/proposals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession, recordAuditLog } from '@/lib/auth/session';
import { query, queryOne, execute, transaction } from '@/lib/db/connection';
import { CurrencyCode, ProposalStatus } from '@/lib/db/types';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, userId } = session;
    const url = new URL(req.url);
    const includeHistory = url.searchParams.get('includeHistory') === 'true';

    let sql = `
      SELECT p.*,
             c.company_name, c.industry,
             co.code as country_code, co.name as country_name,
             rep_p.first_name as rep_first_name, rep_p.last_name as rep_last_name,
             l.business_name as lead_business_name
      FROM proposals p
      JOIN clients c ON p.client_id = c.id
      JOIN countries co ON c.country_id = co.id
      LEFT JOIN representatives r ON p.representative_id = r.id
      LEFT JOIN users rep_u ON r.user_id = rep_u.id
      LEFT JOIN user_profiles rep_p ON rep_u.id = rep_p.user_id
      LEFT JOIN leads l ON p.lead_id = l.id
    `;
    const conditions: string[] = [];
    const params: any[] = [];

    // Filter by current active versions by default
    if (!includeHistory) {
      conditions.push('p.is_current = 1');
    }

    // Server-side RBAC Filtering
    if (role === 'CLIENT') {
      const client = await queryOne('SELECT id FROM clients WHERE user_id = ?', [userId]);
      if (!client) {
        return NextResponse.json({ proposals: [] });
      }
      conditions.push('p.client_id = ?');
      // Clients should only see proposals that have at least been SENT (or approved/rejected)
      conditions.push("p.status NOT IN ('DRAFT')");
      params.push(client.id);
    } else if (role === 'REPRESENTATIVE') {
      const rep = await queryOne('SELECT id FROM representatives WHERE user_id = ?', [userId]);
      if (!rep) {
        return NextResponse.json({ proposals: [] });
      }
      conditions.push('p.representative_id = ?');
      params.push(rep.id);
    } else if (role === 'COUNTRY_MANAGER') {
      const profile = await queryOne('SELECT country_id FROM user_profiles WHERE user_id = ?', [userId]);
      if (profile?.country_id) {
        conditions.push('c.country_id = ?');
        params.push(profile.country_id);
      } else {
        conditions.push('1 = 0');
      }
    } else if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      // Full administrative visibility
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY p.created_at DESC';

    const proposals = await query(sql, params);

    // Parse deliverables and payment schedule JSON
    const parsedProposals = proposals.map((p) => {
      let deliverables: string[] = [];
      try {
        deliverables = JSON.parse(p.deliverables_json || '[]');
      } catch {
        deliverables = [];
      }

      let paymentSchedule: any[] = [];
      try {
        paymentSchedule = JSON.parse(p.payment_schedule_json || '[]');
      } catch {
        paymentSchedule = [];
      }

      let lineItems: any[] = [];
      try {
        lineItems = JSON.parse(p.line_items_json || '[]');
      } catch {
        lineItems = [];
      }

      return {
        ...p,
        deliverables,
        paymentSchedule,
        lineItems,
      };
    });

    return NextResponse.json({ proposals: parsedProposals });
  } catch (err: any) {
    console.error('Failed to fetch proposals:', err);
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only Admins / Super Admins can create proposals
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can author proposals' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      leadId,
      clientId: requestedClientId,
      projectId,
      title,
      scopeOfWork,
      deliverables, // array of strings
      lineItems, // array of line items with item_type
      appStoreOwnership = 'CLIENT_OWNED',
      storeApprovalDisclaimer,
      paymentStructureType = 'FULL_UPFRONT',
      paymentSchedule, // array of schedule items
      totalAmountMinor, // integer minor units
      currency, // 'KES' or 'NGN'
      validUntil,
      termsNotes,
      status: initialStatus = 'DRAFT',
    } = body;

    if (!title || !scopeOfWork || totalAmountMinor === undefined) {
      return NextResponse.json(
        { error: 'Title, scope of work, and total amount are required.' },
        { status: 400 }
      );
    }

    const cleanAmountMinor = Number(totalAmountMinor);
    if (isNaN(cleanAmountMinor) || cleanAmountMinor <= 0 || !Number.isInteger(cleanAmountMinor)) {
      return NextResponse.json(
        { error: 'Invalid pricing: Amount must be a positive integer in minor units.' },
        { status: 400 }
      );
    }

    if (currency && !['KES', 'NGN'].includes(currency)) {
      return NextResponse.json(
        { error: 'Invalid currency: Only KES and NGN currencies are permitted.' },
        { status: 400 }
      );
    }

    let resolvedClientId = requestedClientId;
    let representativeId: string | null = null;
    let targetCurrency: CurrencyCode = currency || 'KES';

    // If created from a Lead, resolve or create the client record atomically
    if (leadId && !resolvedClientId) {
      const lead = await queryOne('SELECT * FROM leads WHERE id = ?', [leadId]);
      if (!lead) {
        return NextResponse.json({ error: 'Specified lead not found' }, { status: 404 });
      }

      representativeId = lead.representative_id || null;
      targetCurrency = (lead.currency || 'KES') as CurrencyCode;

      // Check if a client record already exists for this lead or email
      let existingClient = await queryOne('SELECT id, user_id FROM clients WHERE lead_id = ?', [leadId]);
      if (!existingClient) {
        const existingUser = await queryOne('SELECT id FROM users WHERE email = ?', [lead.email.toLowerCase()]);
        if (existingUser) {
          existingClient = await queryOne('SELECT id, user_id FROM clients WHERE user_id = ?', [existingUser.id]);
        }
      }

      if (existingClient) {
        resolvedClientId = existingClient.id;
      } else {
        const existingUser = await queryOne('SELECT id FROM users WHERE email = ?', [lead.email.toLowerCase()]);
        const adminUser = await queryOne('SELECT password_hash FROM users WHERE email = ?', ['ops@codebridge.com']);
        const passHash = adminUser?.password_hash || '$2a$10$DemoClientPlaceholderHash1234567890abcdef';

        const clientUserId = existingUser ? existingUser.id : `u_cli_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        resolvedClientId = `cli_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

        await transaction(async (tx) => {
          if (!existingUser) {
            await tx.execute(`
              INSERT INTO users (id, email, password_hash, role, status, email_verified, created_at, updated_at)
              VALUES (?, ?, ?, 'CLIENT', 'ACTIVE', 0, datetime('now'), datetime('now'))
            `, [clientUserId, lead.email.toLowerCase(), passHash]);

            await tx.execute(`
              INSERT INTO user_profiles (user_id, first_name, last_name, phone, country_id, timezone, updated_at)
              VALUES (?, ?, 'Client', ?, ?, 'Africa/Nairobi', datetime('now'))
            `, [clientUserId, lead.contact_person, lead.phone, lead.country_id]);
          }

          await tx.execute(`
            INSERT INTO clients (id, user_id, lead_id, company_name, industry, country_id, representative_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          `, [
            resolvedClientId,
            clientUserId,
            leadId,
            lead.business_name,
            lead.business_type,
            lead.country_id,
            representativeId,
          ]);
        });
      }
    }

    if (!resolvedClientId) {
      return NextResponse.json({ error: 'Client ID or valid Lead ID is required' }, { status: 400 });
    }

    // Resolve representative if not set
    if (!representativeId) {
      const client = await queryOne('SELECT representative_id FROM clients WHERE id = ?', [resolvedClientId]);
      representativeId = client?.representative_id || null;
    }

    // Process & Reconcile Payment Structure & Schedule
    const validStructureTypes = ['FULL_UPFRONT', 'DEPOSIT_MILESTONES', 'CUSTOM'];
    const finalStructureType = validStructureTypes.includes(paymentStructureType) ? paymentStructureType : 'FULL_UPFRONT';

    let scheduleItems: any[] = [];
    if (Array.isArray(paymentSchedule) && paymentSchedule.length > 0) {
      scheduleItems = paymentSchedule;
    } else if (finalStructureType === 'FULL_UPFRONT') {
      scheduleItems = [
        {
          name: '100% Full Upfront Payment',
          orderIndex: 1,
          percentageBps: 10000,
          amountMinor: cleanAmountMinor,
          isRequiredToStart: 1,
          billingTrigger: 'UPFRONT_APPROVAL',
        },
      ];
    } else if (finalStructureType === 'DEPOSIT_MILESTONES') {
      const item1Amount = Math.floor((cleanAmountMinor * 5000) / 10000);
      const item2Amount = Math.floor((cleanAmountMinor * 3000) / 10000);
      const item3Amount = cleanAmountMinor - item1Amount - item2Amount;
      scheduleItems = [
        {
          name: '50% Initial Deposit',
          orderIndex: 1,
          percentageBps: 5000,
          amountMinor: item1Amount,
          isRequiredToStart: 1,
          billingTrigger: 'UPFRONT_APPROVAL',
        },
        {
          name: '30% Core Development Milestone',
          orderIndex: 2,
          percentageBps: 3000,
          amountMinor: item2Amount,
          isRequiredToStart: 0,
          billingTrigger: 'MILESTONE_STARTED',
        },
        {
          name: '20% Final Handover & Sign-off',
          orderIndex: 3,
          percentageBps: 2000,
          amountMinor: item3Amount,
          isRequiredToStart: 0,
          billingTrigger: 'MILESTONE_COMPLETED',
        },
      ];
    } else {
      return NextResponse.json({ error: 'Custom payment schedules require explicit schedule items.' }, { status: 400 });
    }

    // Strictly reconcile schedule items with integer arithmetic
    let sumMinor = 0;
    let sumBps = 0;
    for (const item of scheduleItems) {
      if (!item.name || typeof item.amountMinor !== 'number' || typeof item.percentageBps !== 'number') {
        return NextResponse.json({ error: 'Each schedule item must contain name, percentageBps, and amountMinor.' }, { status: 400 });
      }
      if (!Number.isInteger(item.amountMinor) || item.amountMinor <= 0) {
        return NextResponse.json({ error: 'Schedule item amount must be a positive integer in minor units.' }, { status: 400 });
      }
      if (!Number.isInteger(item.percentageBps) || item.percentageBps <= 0) {
        return NextResponse.json({ error: 'Schedule item percentage must be a positive integer in basis points.' }, { status: 400 });
      }
      sumMinor += item.amountMinor;
      sumBps += item.percentageBps;
    }

    if (sumMinor !== cleanAmountMinor || sumBps !== 10000) {
      return NextResponse.json({
        error: `Payment schedule reconciliation failed: Sum of amounts (${sumMinor}) must equal proposal total (${cleanAmountMinor}), and percentages (${sumBps} bps) must equal 10000 bps (100%).`,
      }, { status: 400 });
    }

    // Calculate CodeBridge Revenue vs Third-Party Fees
    let codebridgeTotalMinor = 0;
    let thirdPartyTotalMinor = 0;
    if (Array.isArray(lineItems) && lineItems.length > 0) {
      for (const item of lineItems) {
        const itemAmt = Number(item.amount_minor ?? item.amountMinor ?? 0);
        if (item.item_type === 'THIRD_PARTY_FEE' || item.item_type === 'REIMBURSABLE_EXPENSE') {
          thirdPartyTotalMinor += itemAmt;
        } else {
          codebridgeTotalMinor += itemAmt;
        }
      }
    } else {
      codebridgeTotalMinor = cleanAmountMinor;
    }

    const standardDisclaimer = 'CodeBridge builds, prepares, and submits mobile applications in full accordance with Apple App Store and Google Play Store guidelines. Final submission approval and publication timelines are controlled strictly by Apple and Google.';
    const validOwnership = ['CLIENT_OWNED', 'CODEBRIDGE_MANAGED'].includes(appStoreOwnership) ? appStoreOwnership : 'CLIENT_OWNED';

    // Generate standard proposal number
    const proposalNumber = `PROP-${targetCurrency}-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
    const proposalId = `prop_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const deliverablesJson = JSON.stringify(Array.isArray(deliverables) ? deliverables : []);
    const paymentScheduleJson = JSON.stringify(scheduleItems);
    const lineItemsJson = JSON.stringify(Array.isArray(lineItems) ? lineItems : []);

    const finalStatus: ProposalStatus = initialStatus === 'SENT' ? 'SENT' : 'DRAFT';
    const sentAt = finalStatus === 'SENT' ? new Date().toISOString() : null;

    await execute(`
      INSERT INTO proposals (
        id, proposal_number, version, is_current, lead_id, client_id,
        project_id, representative_id, title, scope_of_work, deliverables_json,
        line_items_json, codebridge_total_minor, third_party_total_minor,
        app_store_ownership, store_approval_disclaimer,
        payment_structure_type, payment_schedule_json,
        total_amount_minor, currency, status, valid_until, terms_notes,
        created_by, sent_at, created_at, updated_at
      )
      VALUES (?, ?, 1, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      proposalId,
      proposalNumber,
      leadId || null,
      resolvedClientId,
      projectId || null,
      representativeId,
      title.trim(),
      scopeOfWork.trim(),
      deliverablesJson,
      lineItemsJson,
      codebridgeTotalMinor,
      thirdPartyTotalMinor,
      validOwnership,
      storeApprovalDisclaimer || standardDisclaimer,
      finalStructureType,
      paymentScheduleJson,
      cleanAmountMinor,
      targetCurrency,
      finalStatus,
      validUntil || null,
      termsNotes || null,
      session.userId,
      sentAt,
    ]);

    await recordAuditLog({
      userId: session.userId,
      action: 'PROPOSAL_CREATED',
      entity: 'proposals',
      entityId: proposalId,
      metadata: {
        proposalNumber,
        version: 1,
        status: finalStatus,
        paymentStructureType: finalStructureType,
        totalAmountMinor: cleanAmountMinor,
        codebridgeTotalMinor,
        thirdPartyTotalMinor,
        appStoreOwnership: validOwnership,
        currency: targetCurrency,
      },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return NextResponse.json({
      success: true,
      proposal: {
        id: proposalId,
        proposalNumber,
        version: 1,
        title,
        status: finalStatus,
        paymentStructureType: finalStructureType,
        paymentSchedule: scheduleItems,
        totalAmountMinor: cleanAmountMinor,
        currency: targetCurrency,
      },
    }, { status: 201 });
  } catch (err: any) {
    console.error('Failed to create proposal:', err);
    return NextResponse.json({ error: 'Failed to create proposal' }, { status: 500 });
  }
}
