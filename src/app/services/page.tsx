// src/app/services/page.tsx
'use client';

import { useState } from 'react';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  ShoppingBag,
  Utensils,
  Home,
  Calendar,
  Layers,
  Layout,
  Users,
  Sliders,
  Cpu,
  RefreshCw,
  Wrench,
  Server,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface ServiceItem {
  id: string;
  title: string;
  category: string;
  filterKey: 'web' | 'commerce' | 'apps' | 'operations' | 'infra';
  icon: any;
  desc: string;
  features: string[];
  recommendedFor: string;
}

export default function ServicesPage() {
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const allServices: ServiceItem[] = [
    {
      id: 'business-websites',
      title: 'Business Websites',
      category: 'Websites & Branding',
      filterKey: 'web',
      icon: Globe,
      desc: 'Modern, high-converting corporate and brand websites engineered for market credibility, client lead generation, and fast page loads.',
      features: [
        'Mobile-first responsive architecture',
        'SEO-optimized schema & structured metadata',
        'Lead capture & CRM contact integrations',
        'Corporate email & domain routing setup'
      ],
      recommendedFor: 'Professional firms, corporate entities, consultancies'
    },
    {
      id: 'ecommerce',
      title: 'E-commerce Websites',
      category: 'Commerce & Booking',
      filterKey: 'commerce',
      icon: ShoppingBag,
      desc: 'Scalable online storefronts with cart management, inventory tracking, promotional engines, and multi-currency checkout readiness.',
      features: [
        'Product variations & real-time inventory management',
        'Customer accounts & order history portals',
        'Multi-currency pricing readiness',
        'Automated order confirmation receipts & email webhooks'
      ],
      recommendedFor: 'Retailers, DTC brands, wholesale distributors'
    },
    {
      id: 'restaurant-ordering',
      title: 'Restaurant Websites & Ordering',
      category: 'Commerce & Booking',
      filterKey: 'commerce',
      icon: Utensils,
      desc: 'Custom restaurant digital hubs with real-time digital menus, table reservation engines, and direct customer order workflows.',
      features: [
        'Digital QR & responsive online menu catalog',
        'Kitchen ticket order reception workflows',
        'Dine-in, takeaway & local delivery options',
        'Instant WhatsApp & SMS customer order alerts'
      ],
      recommendedFor: 'Restaurants, cloud kitchens, cafes, hospitality chains'
    },
    {
      id: 'property-airbnb',
      title: 'Property & Airbnb Websites',
      category: 'Websites & Branding',
      filterKey: 'web',
      icon: Home,
      desc: 'Direct booking and showcase platforms for real estate developers, short-let apartment operators, and property managers.',
      features: [
        'High-resolution virtual property showcases',
        'Calendar availability & nightly rate matrices',
        'Direct booking inquiry & reservation pipeline',
        'iCal synchronization readiness for Airbnb & Booking.com'
      ],
      recommendedFor: 'Real estate developers, short-let operators, brokers'
    },
    {
      id: 'booking-systems',
      title: 'Appointment & Booking Systems',
      category: 'Commerce & Booking',
      filterKey: 'commerce',
      icon: Calendar,
      desc: 'Automated reservation, appointment scheduling, calendar integration, and client notification engines for service businesses.',
      features: [
        'Staff allocation & service duration management',
        'Google Calendar & Outlook two-way sync readiness',
        'Automated client SMS & email appointment reminders',
        'Capacity buffers, break rules & holiday scheduling'
      ],
      recommendedFor: 'Medical clinics, salons, fitness studios, legal practices'
    },
    {
      id: 'landing-pages',
      title: 'High-Converting Landing Pages',
      category: 'Websites & Branding',
      filterKey: 'web',
      icon: Layout,
      desc: 'Precision-crafted single-page experiences optimized for paid ad campaigns, product launches, and maximum conversion velocity.',
      features: [
        'Sub-second page load performance (<1.2s)',
        'A/B conversion-focused visual hierarchy',
        'Integrated CRM lead capture & webhook forwarding',
        'Tracking pixel, tag manager & analytics tags pre-wired'
      ],
      recommendedFor: 'Marketing campaigns, product launches, event registration'
    },
    {
      id: 'web-applications',
      title: 'Custom Web Applications',
      category: 'Custom Applications',
      filterKey: 'apps',
      icon: Layers,
      desc: 'Purpose-built software platforms engineered to streamline core business operations, automate data entry, and enable customer self-service.',
      features: [
        'Role-based access control (RBAC) and user management',
        'Complex transactional and state-machine workflows',
        'Relational database architecture (PostgreSQL / Supabase)',
        'High-performance REST & GraphQL API endpoints'
      ],
      recommendedFor: 'Fintech, healthtech, logistics, B2B platforms'
    },
    {
      id: 'customer-portals',
      title: 'Client & Customer Portals',
      category: 'Custom Applications',
      filterKey: 'apps',
      icon: Users,
      desc: 'Secure client-facing dashboards for document exchange, service ticketing, project status, invoicing, and account management.',
      features: [
        'End-to-end encrypted user authentication',
        'Secure document upload & download vault',
        'Real-time project milestone progress tracking',
        'Account billing history & digital invoice access'
      ],
      recommendedFor: 'Agencies, financial advisory, logistics, membership clubs'
    },
    {
      id: 'admin-dashboards',
      title: 'Admin Dashboards & Ops Panels',
      category: 'Operational Tools',
      filterKey: 'operations',
      icon: Sliders,
      desc: 'Comprehensive executive control panels with operational metrics, user analytics, permission management, and audit trails.',
      features: [
        'Real-time operational charts & revenue KPI metrics',
        'Multi-level staff permission and territory scoping',
        'Exportable business reporting (CSV & PDF formats)',
        'Immutable system audit trail and compliance logging'
      ],
      recommendedFor: 'Business executives, operations managers, finance teams'
    },
    {
      id: 'custom-business-software',
      title: 'Custom Business Software',
      category: 'Custom Applications',
      filterKey: 'apps',
      icon: Cpu,
      desc: 'Tailored digital solutions built around unique operational workflows, proprietary business logic, and internal company operations.',
      features: [
        'Engineered to match your exact standard operating procedures',
        'Eliminates off-the-shelf software subscription bloat',
        'Seamless integration with existing databases and tools',
        'Full intellectual property ownership for your business'
      ],
      recommendedFor: 'Enterprises, manufacturing, supply chain, healthcare'
    },
    {
      id: 'business-management-systems',
      title: 'Business Management Systems (BMS)',
      category: 'Operational Tools',
      filterKey: 'operations',
      icon: RefreshCw,
      desc: 'Centralized platforms unifying inventory control, employee performance tracking, supplier records, and operational reporting.',
      features: [
        'Multi-location inventory and asset registers',
        'Vendor management and purchase order workflows',
        'Departmental milestone and task assignment tracking',
        'Consolidated executive performance analytics'
      ],
      recommendedFor: 'Growing SMEs, retail chains, distribution businesses'
    },
    {
      id: 'website-redesigns',
      title: 'Modern Website Redesigns',
      category: 'Websites & Branding',
      filterKey: 'web',
      icon: Wrench,
      desc: 'Complete transformation of outdated, slow, or low-converting websites into sleek, modern, mobile-first commercial assets.',
      features: [
        'Zero-downtime content & SEO ranking preservation',
        'Modern design aesthetic with rich interactive UX',
        'Dramatic Core Web Vitals and speed improvements',
        'Modernized security, SSL, and mobile responsiveness'
      ],
      recommendedFor: 'Companies seeking a modern, authoritative brand overhaul'
    },
    {
      id: 'maintenance-support',
      title: 'Maintenance & Technical Support',
      category: 'Cloud & Support',
      filterKey: 'infra',
      icon: ShieldCheck,
      desc: 'Proactive software maintenance, uptime monitoring, security patching, and technical support to keep systems operating flawlessly.',
      features: [
        '24/7 automated uptime & performance monitoring',
        'Regular database backups & disaster recovery plans',
        'Security vulnerability patching & library updates',
        'Dedicated monthly developer hours for feature requests'
      ],
      recommendedFor: 'Any business operating critical digital infrastructure'
    },
    {
      id: 'hosting-domain-assistance',
      title: 'Cloud Hosting & Domain Architecture',
      category: 'Cloud & Support',
      filterKey: 'infra',
      icon: Server,
      desc: 'High-availability cloud deployment, DNS configuration, SSL provisioning, and cloud infrastructure setup on resilient cloud providers.',
      features: [
        'Enterprise DNS configuration & multi-domain routing',
        'Automated SSL/TLS encryption certificate lifecycle',
        'Serverless or containerized deployment (Vercel, AWS, Supabase)',
        'Global CDN caching for instant loading globally'
      ],
      recommendedFor: 'Fast-scaling platforms, corporate portals, digital startups'
    }
  ];

  const filterTabs = [
    { key: 'all', label: 'All Services', count: 14 },
    { key: 'web', label: 'Websites & Branding', count: 4 },
    { key: 'commerce', label: 'Commerce & Booking', count: 3 },
    { key: 'apps', label: 'Custom Applications', count: 3 },
    { key: 'operations', label: 'Operational Tools', count: 2 },
    { key: 'infra', label: 'Cloud & Support', count: 2 },
  ];

  const filteredServices = activeFilter === 'all'
    ? allServices
    : allServices.filter(s => s.filterKey === activeFilter);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as any } },
  };

  return (
    <>
      <Navbar />

      <main style={{ minHeight: '100vh', backgroundColor: 'var(--cb-bg-page)' }}>
        {/* ================================================================= */}
        {/* 1. HERO SECTION WITH RICH BRANDING                                */}
        {/* ================================================================= */}
        <section style={{
          background: 'linear-gradient(180deg, rgba(0, 180, 216, 0.05) 0%, transparent 100%)',
          padding: '80px 0 60px',
          borderBottom: '1px solid var(--cb-border-subtle)',
        }}>
          <div className="cb-container" style={{ maxWidth: '860px', margin: '0 auto' }}>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{ textAlign: 'center' }}
            >
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(0, 180, 216, 0.1)',
              border: '1px solid rgba(0, 180, 216, 0.2)',
              color: 'var(--cb-cyan-500)',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '24px',
            }}>
              <Sparkles size={14} />
              Full Engineering Catalog • 14 Disciplines
            </div>

            <h1 style={{
              fontSize: 'clamp(32px, 5vw, 46px)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              color: 'var(--cb-text-primary)',
              marginBottom: '20px',
            }}>
              Digital Products &amp; Engineering Services Built for{' '}
              <span className="cb-text-gradient">
                Market Impact
              </span>
            </h1>

            <p style={{
              fontSize: '17px',
              lineHeight: 1.65,
              color: 'var(--cb-text-secondary)',
              marginBottom: '32px',
              maxWidth: '720px',
              margin: '0 auto 32px',
            }}>
              From high-converting corporate websites to complex mission-critical business software, CodeBridge delivers vetted engineering excellence with institutional reliability.
            </p>

            {/* Trust Highlights Strip */}
            <div 
              className="cb-glass"
              style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '20px',
              padding: '16px 24px',
              borderRadius: '16px',
              boxShadow: 'var(--cb-shadow-sm)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--cb-text-primary)' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--cb-cyan-500)' }} />
                <span>Fixed Milestone Scopes</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--cb-text-primary)' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--cb-cyan-500)' }} />
                <span>100% Milestone Escrow Protection</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--cb-text-primary)' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--cb-cyan-500)' }} />
                <span>Global Support</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--cb-text-primary)' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--cb-cyan-500)' }} />
                <span>Transparent Commercial Billing</span>
              </div>
            </div>
            </motion.div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 2. CATEGORY FILTER CONTROLS                                       */}
        {/* ================================================================= */}
        <section style={{ padding: '36px 0 20px' }}>
          <div className="cb-container">
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}>
              {filterTabs.map((tab) => {
                const isActive = activeFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveFilter(tab.key)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 18px',
                      borderRadius: '9999px',
                      fontSize: '13px',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--cb-bg-page)' : 'var(--cb-text-secondary)',
                      backgroundColor: isActive ? 'var(--cb-text-primary)' : 'var(--cb-bg-card)',
                      border: `1px solid ${isActive ? 'transparent' : 'var(--cb-border-subtle)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isActive ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none',
                    }}
                  >
                    <span>{tab.label}</span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'var(--cb-bg-subtle)',
                      color: isActive ? '#FFFFFF' : 'var(--cb-text-muted)',
                    }}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 3. 14 HIGH-FIDELITY SERVICE CARDS                                 */}
        {/* ================================================================= */}
        <section style={{ padding: '24px 0 80px' }}>
          <div className="cb-container">
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              key={activeFilter}
              style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '28px',
            }}>
              <AnimatePresence mode="popLayout">
              {filteredServices.map((service) => {
                const Icon = service.icon;
                return (
                  <motion.div
                    layout
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={service.id}
                    id={service.id}
                    className="cb-glass"
                    whileHover={{ y: -5 }}
                    style={{
                      borderRadius: '20px',
                      boxShadow: 'var(--cb-shadow-sm)',
                      padding: '32px 28px',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Card Header: Icon & Category Tag */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                      <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '14px',
                        backgroundColor: 'rgba(0, 180, 216, 0.1)',
                        border: '1px solid rgba(0, 180, 216, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--cb-cyan-500)',
                      }}>
                        <Icon size={26} />
                      </div>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--cb-bg-subtle)',
                        color: 'var(--cb-text-secondary)',
                      }}>
                        {service.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: 800,
                      color: 'var(--cb-text-primary)',
                      letterSpacing: '-0.02em',
                      marginBottom: '10px',
                      lineHeight: 1.3,
                    }}>
                      {service.title}
                    </h3>

                    {/* Description */}
                    <p style={{
                      fontSize: '14px',
                      lineHeight: 1.6,
                      color: 'var(--cb-text-secondary)',
                      marginBottom: '20px',
                    }}>
                      {service.desc}
                    </p>

                    {/* Recommended For pill */}
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--cb-cyan-600)',
                      backgroundColor: 'rgba(0, 180, 216, 0.05)',
                      border: '1px solid rgba(0, 180, 216, 0.15)',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      marginBottom: '20px',
                      fontWeight: 500,
                    }}>
                      <strong style={{ color: 'var(--cb-text-primary)' }}>Best For:</strong> {service.recommendedFor}
                    </div>

                    {/* Deliverables Box */}
                    <div style={{
                      backgroundColor: 'var(--cb-bg-subtle)',
                      borderRadius: '12px',
                      border: '1px solid var(--cb-border-subtle)',
                      padding: '16px 18px',
                      marginBottom: '24px',
                      flex: 1,
                    }}>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'var(--cb-text-muted)',
                        marginBottom: '12px',
                      }}>
                        Key Deliverables &amp; Capabilities
                      </div>
                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', padding: 0, margin: 0 }}>
                        {service.features.map((feature, fIdx) => (
                          <li key={fIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'var(--cb-text-primary)', lineHeight: 1.45 }}>
                            <CheckCircle2 size={16} style={{ color: 'var(--cb-cyan-500)', flexShrink: 0, marginTop: '2px' }} />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Button */}
                    <Link
                      href={`/request-project?service=${encodeURIComponent(service.title)}`}
                      className="cb-btn cb-btn-outline-pill"
                      style={{
                        width: '100%',
                        display: 'inline-flex',
                        justifyContent: 'center',
                      }}
                    >
                      <span>Scope this Project</span>
                      <ArrowRight size={16} />
                    </Link>
                  </motion.div>
                );
              })}
              </AnimatePresence>
            </motion.div>

            {/* ============================================================= */}
            {/* 4. CUSTOM BESPOKE SOLUTION CALLOUT                            */}
            {/* ============================================================= */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              style={{
              marginTop: '64px',
              background: 'linear-gradient(135deg, var(--cb-navy-950) 0%, var(--cb-navy-800) 100%)',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '48px 36px',
              textAlign: 'center',
              boxShadow: 'var(--cb-shadow-lg)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Subtle background glow */}
              <div style={{
                position: 'absolute',
                top: '-50%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '600px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(2, 132, 199, 0.25) 0%, rgba(7, 15, 38, 0) 70%)',
                pointerEvents: 'none',
              }} />

              <div style={{ position: 'relative', zIndex: 1, maxWidth: '680px', margin: '0 auto' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 14px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38BDF8',
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '16px',
                }}>
                  Custom Engineering
                </span>

                <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px', letterSpacing: '-0.02em' }}>
                  Need a Bespoke Solution Not Listed Here?
                </h2>

                <p style={{ fontSize: '15px', color: '#94A3B8', lineHeight: 1.65, marginBottom: '28px' }}>
                  From proprietary multi-tenant SaaS to custom internal ERP tools, our senior architects design and build custom software tailored specifically to your company&apos;s unique operational requirements.
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', justifyContent: 'center' }}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/request-project"
                      className="cb-btn cb-btn-cyan"
                      style={{ padding: '14px 28px', fontSize: '15px' }}
                    >
                      <span>Discuss Your Custom Requirements</span>
                      <ArrowRight size={16} />
                    </Link>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/contact"
                      className="cb-btn cb-btn-outline-light"
                      style={{
                        padding: '14px 24px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span style={{ color: '#FFFFFF' }}>Contact Technical Desk</span>
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
