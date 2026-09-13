// scripts/seed.mjs
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'codebridge.db');
const db = new DatabaseSync(dbPath);

db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

// Import schema DDL
import { CREATE_TABLES_SQL } from '../src/lib/db/schema.js';
db.exec(CREATE_TABLES_SQL);

console.log('🌱 Starting CodeBridge database seeding [DEMO DATA]...');

const passwordHash = bcrypt.hashSync('CodeBridge@2025!', 10);

// 1. Seed Countries
console.log('-> Seeding Countries (Nigeria, Kenya)...');
const insertCountry = db.prepare(`
  INSERT OR REPLACE INTO countries (id, code, name, currency, phone_code, timezone, is_active)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

insertCountry.run('c_ng', 'NG', 'Nigeria', 'NGN', '+234', 'Africa/Lagos', 1);
insertCountry.run('c_ke', 'KE', 'Kenya', 'KES', '+254', 'Africa/Nairobi', 1);

// 2. Seed Services Catalog (14 Business Technology Services)
console.log('-> Seeding 14 CodeBridge Services...');
const insertService = db.prepare(`
  INSERT OR REPLACE INTO services (id, code, name, description, category, base_price_minor, currency, is_active)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const services = [
  ['srv_biz_web', 'BIZ-WEB', 'Business Websites', 'Modern, high-converting corporate and brand websites engineered for market credibility and lead generation.', 'Websites', 45000000, 'NGN', 1],
  ['srv_ecom', 'E-COMM', 'E-commerce Websites', 'Scalable online storefronts with cart management, inventory tracking, and seamless checkout flows.', 'E-commerce', 85000000, 'NGN', 1],
  ['srv_rest', 'REST-ORDER', 'Restaurant Websites & Ordering Systems', 'Custom restaurant digital hubs with real-time digital menus, table reservation, and direct order workflows.', 'Hospitality', 65000000, 'NGN', 1],
  ['srv_prop', 'PROP-AIRBNB', 'Property & Airbnb Websites', 'Direct booking and showcase platforms for real estate developers, short-let operators, and property managers.', 'Real Estate', 75000000, 'NGN', 1],
  ['srv_book', 'BOOK-SYS', 'Booking Systems', 'Automated reservation, appointment scheduling, calendar integration, and client notification engines.', 'Applications', 55000000, 'NGN', 1],
  ['srv_land', 'LAND-PAGES', 'Landing Pages', 'Precision-crafted single-page experiences optimized for paid ad campaigns and maximum conversion velocity.', 'Marketing', 25000000, 'NGN', 1],
  ['srv_webapp', 'WEB-APP', 'Custom Web Applications', 'Purpose-built software applications engineered to streamline core business operations and customer self-service.', 'Applications', 120000000, 'NGN', 1],
  ['srv_port', 'CUST-PORTAL', 'Customer Portals', 'Secure client-facing dashboards for document exchange, service requests, invoicing, and account management.', 'Applications', 90000000, 'NGN', 1],
  ['srv_dash', 'ADMIN-DASH', 'Admin Dashboards', 'Comprehensive control panels with operational metrics, analytics, permissions, and business management tools.', 'Dashboards', 80000000, 'NGN', 1],
  ['srv_soft', 'CUSTOM-SW', 'Custom Business Software', 'Tailor-made software solutions built around proprietary business workflows and operational bottlenecks.', 'Enterprise', 150000000, 'NGN', 1],
  ['srv_mgmt', 'BIZ-MGMT', 'Business Management Systems', 'End-to-end digital operating systems integrating CRM, resource planning, and internal communications.', 'Enterprise', 180000000, 'NGN', 1],
  ['srv_redesign', 'SITE-REDESIGN', 'Website Redesigns', 'Complete architectural overhaul, performance upgrade, and visual modernization of legacy corporate sites.', 'Websites', 40000000, 'NGN', 1],
  ['srv_maint', 'TECH-SUPPORT', 'Maintenance & Technical Support', 'Ongoing code upkeep, security patches, uptime monitoring, and SLA-backed engineering support.', 'Support', 20000000, 'NGN', 1],
  ['srv_host', 'HOST-INFRA', 'Hosting & Domain Assistance', 'High-availability cloud deployment, DNS configuration, SSL provisioning, and cloud infrastructure setup.', 'Infrastructure', 15000000, 'NGN', 1],
];

for (const s of services) {
  insertService.run(...s);
}

// 3. Seed Users & Profiles across all 6 roles
console.log('-> Seeding Demo Users across 6 roles [DEMO DATA]...');
const insertUser = db.prepare(`
  INSERT OR REPLACE INTO users (id, email, password_hash, role, status, email_verified)
  VALUES (?, ?, ?, ?, ?, 1)
`);

const insertProfile = db.prepare(`
  INSERT OR REPLACE INTO user_profiles (user_id, first_name, last_name, phone, country_id, timezone)
  VALUES (?, ?, ?, ?, ?, ?)
`);

// (1) SUPER ADMIN (CodeBridge owner/admin)
insertUser.run('u_superadmin', 'superadmin@codebridge.com', passwordHash, 'SUPER_ADMIN', 'ACTIVE');
insertProfile.run('u_superadmin', 'CodeBridge', 'Administrator', '+2348000000001', 'c_ng', 'Africa/Lagos');

// (2) ADMIN / OPERATIONS
insertUser.run('u_admin_ops', 'ops@codebridge.com', passwordHash, 'ADMIN', 'ACTIVE');
insertProfile.run('u_admin_ops', 'Operations', 'Lead', '+2348000000002', 'c_ng', 'Africa/Lagos');

// (3) COUNTRY MANAGER (Kenya)
insertUser.run('u_cm_ke', 'countrymanager.ke@codebridge.com', passwordHash, 'COUNTRY_MANAGER', 'ACTIVE');
insertProfile.run('u_cm_ke', 'David', 'Kariuki', '+2547000000001', 'c_ke', 'Africa/Nairobi');

// (4) REPRESENTATIVE - ACTIVE (Kenya, 20% commission)
insertUser.run('u_rep_ke_active', 'rep.kenya@codebridge.com', passwordHash, 'REPRESENTATIVE', 'ACTIVE');
insertProfile.run('u_rep_ke_active', 'Joseph', 'Mwangi', '+2547110000001', 'c_ke', 'Africa/Nairobi');

const insertRep = db.prepare(`
  INSERT OR REPLACE INTO representatives (id, user_id, country_id, approval_status, commission_rate_bps, approved_at, approved_by, notes)
  VALUES (?, ?, ?, ?, ?, datetime('now'), 'u_superadmin', ?)
`);
insertRep.run('rep_ke_active', 'u_rep_ke_active', 'c_ke', 'ACTIVE', 2000, '[DEMO DATA] Founding Kenya representative');

// (5) REPRESENTATIVE - PENDING APPROVAL
insertUser.run('u_rep_pending', 'rep.pending@codebridge.com', passwordHash, 'REPRESENTATIVE', 'PENDING');
insertProfile.run('u_rep_pending', 'Grace', 'Onyango', '+2547220000002', 'c_ke', 'Africa/Nairobi');
insertRep.run('rep_ke_pending', 'u_rep_pending', 'c_ke', 'PENDING', 2000, null, null, '[DEMO DATA] Awaiting administrative approval');

// (6) DEVELOPER
insertUser.run('u_dev', 'dev@codebridge.com', passwordHash, 'DEVELOPER', 'ACTIVE');
insertProfile.run('u_dev', 'Tunde', 'Adeyemi', '+2348000000003', 'c_ng', 'Africa/Lagos');

// (7) CLIENT (ABC Restaurant Ltd, Nairobi)
insertUser.run('u_client_ke', 'client@abcrestaurants.com', passwordHash, 'CLIENT', 'ACTIVE');
insertProfile.run('u_client_ke', 'Martin', 'Kamau', '+2547330000003', 'c_ke', 'Africa/Nairobi');

const insertClient = db.prepare(`
  INSERT OR REPLACE INTO clients (id, user_id, company_name, industry, country_id, representative_id)
  VALUES (?, ?, ?, ?, ?, ?)
`);
insertClient.run('cli_abc_rest', 'u_client_ke', '[DEMO DATA] ABC Hospitality & Restaurants', 'Food & Beverage', 'c_ke', 'rep_ke_active');

// 4. Seed Leads (Lifecycle demonstration)
console.log('-> Seeding Demonstration Leads [DEMO DATA]...');
const insertLead = db.prepare(`
  INSERT OR REPLACE INTO leads (id, business_name, contact_person, email, phone, country_id, business_type, requirements, estimated_budget_minor, currency, representative_id, status, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insertLead.run(
  'lead_001',
  '[DEMO DATA] Nairobi Bistro & Lounge',
  'Martin Kamau',
  'martin@nairobibistro.ke',
  '+2547330000003',
  'c_ke',
  'Restaurant / Bar',
  'Need online food menu, table reservations, and WhatsApp automated order notifications.',
  25000000, // 250,000 KES
  'KES',
  'rep_ke_active',
  'QUALIFIED',
  'Met during Nairobi business networking event. High interest.'
);

insertLead.run(
  'lead_002',
  '[DEMO DATA] Prime Realty VI',
  'Chidinma Okafor',
  'chidinma@primerealty.ng',
  '+2348011112233',
  'c_ng',
  'Real Estate & Short-lets',
  'Property showcase platform with virtual tours, Airbnb sync, and client inquiry forms.',
  180000000, // 1,800,000 NGN
  'NGN',
  null,
  'REQUIREMENTS_COLLECTED',
  'Discussing tier 2 custom property package.'
);

insertLead.run(
  'lead_003',
  '[DEMO DATA] Safari Horizons Tours',
  'Wilson Mutua',
  'wilson@safarihorizons.co.ke',
  '+254744556677',
  'c_ke',
  'Tour Operator',
  'Multi-day safari package booking system with deposit payment capabilities and custom itineraries.',
  35000000, // 350,000 KES
  'KES',
  'rep_ke_active',
  'WON',
  'Contract approved; advancing to Project kickoff.'
);

insertLead.run(
  'lead_004',
  '[DEMO DATA] Apex Retail Express',
  'Emeka Nwosu',
  'emeka@apexexpress.ng',
  '+2348099887766',
  'c_ng',
  'Retail Store',
  'Multi-branch retail management portal and customer loyalty tracker.',
  250000000, // 2,500,000 NGN
  'NGN',
  null,
  'NEW',
  'Submitted via public website project scoping form.'
);

// 5. Seed Demonstration Project & Milestones
console.log('-> Seeding Demonstration Project & Milestones [DEMO DATA]...');
const insertProject = db.prepare(`
  INSERT OR REPLACE INTO projects (id, code, title, description, client_id, representative_id, service_id, status, budget_minor, currency, country_id, start_date, target_completion_date)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date('now', '-14 days'), date('now', '+30 days'))
`);

insertProject.run(
  'prj_001',
  'PRJ-KE-2025-001',
  '[DEMO DATA] ABC Restaurant Online Ordering System',
  'End-to-end digital ordering, reservation portal, and kitchen ticket management for ABC Restaurant.',
  'cli_abc_rest',
  'rep_ke_active',
  'srv_rest',
  'DEVELOPMENT',
  28000000, // 280,000 KES
  'KES',
  'c_ke'
);

const insertProjectMember = db.prepare(`
  INSERT OR REPLACE INTO project_members (id, project_id, user_id, role_in_project)
  VALUES (?, ?, ?, ?)
`);
insertProjectMember.run('pm_001', 'prj_001', 'u_dev', 'Lead Engineer');

const insertMilestone = db.prepare(`
  INSERT OR REPLACE INTO project_milestones (id, project_id, title, description, order_index, status, due_date)
  VALUES (?, ?, ?, ?, ?, ?, date('now', ?))
`);
insertMilestone.run('ms_001', 'prj_001', 'Requirement Specs & Architecture', 'Brand assets, menu structures, and UX wireframes completed.', 1, 'COMPLETED', '-7 days');
insertMilestone.run('ms_002', 'prj_001', 'Core Ordering System & Digital Menu', 'Customer ordering cart, item options, and mobile-optimized ordering interface.', 2, 'IN_PROGRESS', '+7 days');
insertMilestone.run('ms_003', 'prj_001', 'Kitchen Order Display & Admin Dashboard', 'Internal order acceptance screen and real-time status tracker.', 3, 'PENDING', '+20 days');
insertMilestone.run('ms_004', 'prj_001', 'Quality Assurance & Handover', 'End-to-end acceptance testing and staff onboarding.', 4, 'PENDING', '+30 days');

// 6. Seed Demonstration Commission (20% Representative Commission)
console.log('-> Seeding Representative Commission Architecture [DEMO DATA]...');
const insertCommission = db.prepare(`
  INSERT OR REPLACE INTO commissions (id, project_id, representative_id, rate_bps, base_amount_minor, commission_amount_minor, currency, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

// 20% of 280,000 KES = 56,000 KES (minor: 5,600,000)
insertCommission.run(
  'comm_001',
  'prj_001',
  'rep_ke_active',
  2000,
  28000000,
  5600000,
  'KES',
  'PENDING'
);

const insertAuditLog = db.prepare(`
  INSERT OR REPLACE INTO audit_logs (id, user_id, action, entity, entity_id, metadata_json, ip_address)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
insertAuditLog.run(
  'audit_001',
  'u_superadmin',
  'APPROVE_REPRESENTATIVE',
  'representatives',
  'rep_ke_active',
  JSON.stringify({ commission_rate_bps: 2000, country: 'Kenya', note: 'Approved active status' }),
  '127.0.0.1'
);

console.log('✅ Seed completed successfully! All 20+ entities initialized with [DEMO DATA].');
console.log('Default demo credentials password: CodeBridge@2025!');
