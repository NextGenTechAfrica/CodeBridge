// scripts/seed-pg-test-users.mjs
import postgres from 'postgres';
import bcrypt from 'bcryptjs';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL environment variable is required.');
  process.exit(1);
}
const sql = postgres(url, { ssl: 'require', prepare: false });

async function seedPg() {
  console.log('Seeding PostgreSQL with test/demo actors...');
  const passwordHash = await bcrypt.hash('CodeBridge@2025!', 10);

  // Ensure countries
  await sql`
    INSERT INTO countries (id, code, name, currency, phone_code, timezone, is_active)
    VALUES 
      ('c_ng', 'NG', 'Nigeria', 'NGN', '+234', 'Africa/Lagos', 1),
      ('c_ke', 'KE', 'Kenya', 'KES', '+254', 'Africa/Nairobi', 1)
    ON CONFLICT (id) DO NOTHING;
  `;

  // Users to seed
  const users = [
    { id: 'u_superadmin', email: 'superadmin@codebridge.com', role: 'SUPER_ADMIN', hash: passwordHash, fn: 'CodeBridge', ln: 'Administrator', phone: '+2348000000001', country: 'c_ng' },
    { id: 'u_admin_ops', email: 'ops@codebridge.com', role: 'ADMIN', hash: passwordHash, fn: 'Operations', ln: 'Lead', phone: '+2348000000002', country: 'c_ng' },
    { id: 'u_cm_ke', email: 'countrymanager.ke@codebridge.com', role: 'COUNTRY_MANAGER', hash: passwordHash, fn: 'David', ln: 'Kariuki', phone: '+2547000000001', country: 'c_ke' },
    { id: 'u_rep_ke_active', email: 'rep.kenya@codebridge.com', role: 'REPRESENTATIVE', hash: 'oauth:google', fn: 'Joseph', ln: 'Mwangi', phone: '+2547110000001', country: 'c_ke' },
    { id: 'u_dev', email: 'dev@codebridge.com', role: 'DEVELOPER', hash: passwordHash, fn: 'Tunde', ln: 'Adeyemi', phone: '+2348000000003', country: 'c_ng' },
    { id: 'u_client_ke', email: 'client@abcrestaurants.com', role: 'CLIENT', hash: passwordHash, fn: 'Martin', ln: 'Kamau', phone: '+2547330000003', country: 'c_ke' },
  ];

  for (const u of users) {
    await sql`
      INSERT INTO users (id, email, password_hash, role, status, email_verified)
      VALUES (${u.id}, ${u.email}, ${u.hash}, ${u.role}, 'ACTIVE', 1)
      ON CONFLICT (id) DO UPDATE SET 
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        status = 'ACTIVE';
    `;

    await sql`
      INSERT INTO user_profiles (user_id, first_name, last_name, phone, country_id, timezone)
      VALUES (${u.id}, ${u.fn}, ${u.ln}, ${u.phone}, ${u.country}, 'Africa/Lagos')
      ON CONFLICT (user_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        country_id = EXCLUDED.country_id;
    `;
  }

  // Representative record
  await sql`
    INSERT INTO representatives (id, user_id, country_id, approval_status, commission_rate_bps, approved_at, approved_by, notes)
    VALUES ('rep_ke_active', 'u_rep_ke_active', 'c_ke', 'ACTIVE', 2000, NOW(), 'u_superadmin', 'Founding Kenya representative')
    ON CONFLICT (id) DO UPDATE SET approval_status = 'ACTIVE';
  `;

  // Client record
  await sql`
    INSERT INTO clients (id, user_id, company_name, industry, country_id, representative_id)
    VALUES ('cli_abc_rest', 'u_client_ke', 'ABC Hospitality & Restaurants', 'Food & Beverage', 'c_ke', 'rep_ke_active')
    ON CONFLICT (id) DO NOTHING;
  `;

  // Demo lead
  await sql`
    INSERT INTO leads (id, business_name, contact_person, email, phone, country_id, business_type, requirements, estimated_budget_minor, currency, representative_id, status, notes)
    VALUES ('lead_001', 'Nairobi Bistro & Lounge', 'Martin Kamau', 'martin@nairobibistro.ke', '+2547330000003', 'c_ke', 'Restaurant / Bar', 'Need online food menu and reservations.', 25000000, 'KES', 'rep_ke_active', 'QUALIFIED', 'Seeded demo lead')
    ON CONFLICT (id) DO NOTHING;
  `;

  console.log('✅ Successfully seeded PostgreSQL test/demo actors!');
  await sql.end({ timeout: 1 });
}

seedPg().catch(err => {
  console.error('Error seeding PG:', err);
  process.exit(1);
});
