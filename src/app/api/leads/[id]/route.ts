// src/app/api/leads/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession, recordAuditLog } from '@/lib/auth/session';
import { query, queryOne, execute, transaction } from '@/lib/db/connection';
import { LeadStatus } from '@/lib/db/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: leadId } = await params;
    const lead = await queryOne(`
      SELECT l.*, c.code as country_code, c.name as country_name,
             p.first_name as rep_first_name, p.last_name as rep_last_name
      FROM leads l
      JOIN countries c ON l.country_id = c.id
      LEFT JOIN representatives r ON l.representative_id = r.id
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE l.id = ?
    `, [leadId]);

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Role-based authorization
    if (session.role === 'CLIENT') {
      const client = await queryOne('SELECT id FROM clients WHERE user_id = ?', [session.userId]);
      if (!client || lead.client_id !== client.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (session.role === 'REPRESENTATIVE') {
      const rep = await queryOne('SELECT id FROM representatives WHERE user_id = ?', [session.userId]);
      if (!rep || lead.representative_id !== rep.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (session.role === 'COUNTRY_MANAGER') {
      const profile = await queryOne('SELECT country_id FROM user_profiles WHERE user_id = ?', [session.userId]);
      if (!profile?.country_id || lead.country_id !== profile.country_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (!['SUPER_ADMIN', 'ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ lead });
  } catch (err: any) {
    console.error('Failed to fetch lead:', err);
    return NextResponse.json({ error: 'Failed to fetch lead' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {

  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: leadId } = await params;
    const body = await req.json();
    const { status, notes, convertToClient } = body;

    const lead = await queryOne('SELECT * FROM leads WHERE id = ?', [leadId]);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Role check: If representative, must be their own lead
    if (session.role === 'REPRESENTATIVE') {
      const rep = await queryOne('SELECT id FROM representatives WHERE user_id = ?', [session.userId]);
      if (!rep || lead.representative_id !== rep.id) {
        return NextResponse.json({ error: 'Forbidden: You cannot modify this lead' }, { status: 403 });
      }

      if (convertToClient || status === 'WON') {
        return NextResponse.json({
          error: 'Forbidden: Representatives cannot directly mark leads as WON. Conversion requires formal client proposal approval or administrative sign-off.',
        }, { status: 403 });
      }
    }

    const validStatuses: LeadStatus[] = [
      'NEW',
      'CONTACTED',
      'QUALIFIED',
      'REQUIREMENTS_COLLECTED',
      'PROPOSAL',
      'WON',
      'LOST',
    ];

    const targetStatus = status && validStatuses.includes(status) ? status : lead.status;

    // Handle conversion from WON lead to Client + Project
    if (convertToClient && targetStatus === 'WON') {
      let createdClientId = '';
      let createdProjectId = '';

      await transaction(async (tx) => {
        // 1. Check if user already exists for lead email
        let clientUserId: string;
        const existingUser = await tx.queryOne('SELECT id FROM users WHERE LOWER(email) = ?', [lead.email.toLowerCase()]);

        if (existingUser) {
          clientUserId = existingUser.id;
        } else {
          clientUserId = `u_cli_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          // Seed temporary hash for client activation
          await tx.execute(`
            INSERT INTO users (id, email, password_hash, role, status, email_verified, created_at, updated_at)
            VALUES (?, ?, '$2a$10$DemoHashForConvertedClientUnset1234567890abcdef', 'CLIENT', 'ACTIVE', 0, datetime('now'), datetime('now'))
          `, [clientUserId, lead.email.toLowerCase()]);

          await tx.execute(`
            INSERT INTO user_profiles (user_id, first_name, last_name, phone, country_id, timezone, updated_at)
            VALUES (?, ?, 'Client', ?, ?, 'Africa/Nairobi', datetime('now'))
          `, [clientUserId, lead.contact_person, lead.phone, lead.country_id]);
        }

        // 2. Create or find Client record
        const existingClient = await tx.queryOne('SELECT id FROM clients WHERE user_id = ?', [clientUserId]);
        if (existingClient) {
          createdClientId = existingClient.id;
        } else {
          createdClientId = `cli_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          await tx.execute(`
            INSERT INTO clients (id, user_id, lead_id, company_name, industry, country_id, representative_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          `, [
            createdClientId,
            clientUserId,
            leadId,
            lead.business_name,
            lead.business_type,
            lead.country_id,
            lead.representative_id
          ]);
        }

        // 3. Create Project record
        createdProjectId = `prj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const projectCode = `PRJ-${lead.currency}-${Math.floor(1000 + Math.random() * 9000)}`;
        await tx.execute(`
          INSERT INTO projects (
            id, code, title, description, client_id, representative_id, lead_id,
            status, budget_minor, currency, country_id, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, 'PLANNING', ?, ?, ?, datetime('now'), datetime('now'))
        `, [
          createdProjectId,
          projectCode,
          `Digital Solution for ${lead.business_name}`,
          lead.requirements,
          createdClientId,
          lead.representative_id,
          leadId,
          lead.estimated_budget_minor,
          lead.currency,
          lead.country_id
        ]);

        // 4. Update Lead status to WON
        await tx.execute(`
          UPDATE leads SET status = 'WON', notes = ?, updated_at = datetime('now')
          WHERE id = ?
        `, [notes || lead.notes, leadId]);

        // 5. If lead had a representative, initialize commission record (default rate 20% or rep specific)
        if (lead.representative_id) {
          const rep = await tx.queryOne('SELECT commission_rate_bps FROM representatives WHERE id = ?', [lead.representative_id]);
          const rateBps = rep ? rep.commission_rate_bps : 2000;
          const commissionMinor = Math.round((lead.estimated_budget_minor * rateBps) / 10000);
          const commId = `comm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

          await tx.execute(`
            INSERT INTO commissions (
              id, project_id, representative_id, rate_bps, base_amount_minor,
              commission_amount_minor, currency, status, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', datetime('now'), datetime('now'))
          `, [
            commId,
            createdProjectId,
            lead.representative_id,
            rateBps,
            lead.estimated_budget_minor,
            commissionMinor,
            lead.currency
          ]);
        }
      });

      await recordAuditLog({
        userId: session.userId,
        action: 'CONVERT_LEAD_TO_CLIENT',
        entity: 'leads',
        entityId: leadId,
        metadata: { clientId: createdClientId, projectId: createdProjectId },
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1'
      });

      return NextResponse.json({
        success: true,
        converted: true,
        clientId: createdClientId,
        projectId: createdProjectId,
        message: 'Lead successfully converted to Client and Project!'
      });
    }

    // Standard status and notes update
    await execute(`
      UPDATE leads
      SET status = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [targetStatus, notes !== undefined ? notes : lead.notes, leadId]);

    await recordAuditLog({
      userId: session.userId,
      action: 'UPDATE_LEAD_STATUS',
      entity: 'leads',
      entityId: leadId,
      metadata: { previousStatus: lead.status, newStatus: targetStatus },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1'
    });

    return NextResponse.json({
      success: true,
      leadId,
      status: targetStatus,
    });
  } catch (err: any) {
    console.error('Failed to update lead:', err);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: leadId } = await params;
    const lead = await queryOne<any>('SELECT * FROM leads WHERE id = ?', [leadId]);
    if (!lead) {
      return NextResponse.json({ error: 'Client record not found' }, { status: 404 });
    }

    // Role-based authorization
    if (session.role === 'REPRESENTATIVE') {
      const rep = await queryOne<any>('SELECT id FROM representatives WHERE user_id = ?', [session.userId]);
      if (!rep || lead.representative_id !== rep.id) {
        return NextResponse.json({ error: 'Forbidden: You cannot delete this client record' }, { status: 403 });
      }
    } else if (session.role === 'COUNTRY_MANAGER') {
      const profile = await queryOne<any>('SELECT country_id FROM user_profiles WHERE user_id = ?', [session.userId]);
      if (!profile?.country_id || lead.country_id !== profile.country_id) {
        return NextResponse.json({ error: 'Forbidden: You cannot delete this client record' }, { status: 403 });
      }
    } else if (!['SUPER_ADMIN', 'ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    // Safeguard: Do not allow deletion if there are active paid projects
    const paidProject = await queryOne<any>(
      "SELECT id FROM projects WHERE lead_id = ? AND payment_status IN ('PARTIALLY_PAID', 'PAID')",
      [leadId]
    );
    if (paidProject) {
      return NextResponse.json(
        { error: 'Cannot delete client with active paid projects or verified milestones.' },
        { status: 400 }
      );
    }

    // Execute cascading deletion safely in a transaction
    await transaction(async (tx) => {
      // 1. Delete message cursors and messages
      await tx.execute('DELETE FROM message_read_cursors WHERE lead_id = ?', [leadId]);
      await tx.execute('DELETE FROM messages WHERE lead_id = ?', [leadId]);

      // 2. Delete any unpaid/draft projects linked to this lead
      const linkedProjects = await tx.query<any>('SELECT id FROM projects WHERE lead_id = ?', [leadId]);
      for (const p of linkedProjects) {
        await tx.execute('DELETE FROM commissions WHERE project_id = ?', [p.id]);
        await tx.execute('DELETE FROM project_members WHERE project_id = ?', [p.id]);
        await tx.execute('DELETE FROM invoices WHERE project_id = ?', [p.id]);
        await tx.execute('DELETE FROM projects WHERE id = ?', [p.id]);
      }

      // 3. Delete proposals linked to this lead
      await tx.execute('DELETE FROM proposals WHERE lead_id = ?', [leadId]);

      // 4. Detach from clients table if referenced
      await tx.execute('UPDATE clients SET lead_id = NULL WHERE lead_id = ?', [leadId]);

      // 5. Delete lead
      await tx.execute('DELETE FROM leads WHERE id = ?', [leadId]);
    });

    await recordAuditLog({
      userId: session.userId,
      action: 'DELETE_LEAD',
      entity: 'leads',
      entityId: leadId,
      metadata: { businessName: lead.business_name, contactPerson: lead.contact_person },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return NextResponse.json({
      success: true,
      message: `Client record "${lead.business_name}" successfully deleted.`,
    });
  } catch (err: any) {
    console.error('Failed to delete lead:', err);
    return NextResponse.json({ error: 'Failed to delete client record' }, { status: 500 });
  }
}
