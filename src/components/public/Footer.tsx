// src/components/public/Footer.tsx
import Link from 'next/link';
import { ShieldCheck, Globe2 } from 'lucide-react';
import CodeBridgeLogo from '@/components/common/CodeBridgeLogo';

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: '#070F26',
      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      paddingTop: '64px',
      paddingBottom: '40px',
      marginTop: 'auto',
      color: '#FFFFFF',
    }}>
      <div className="cb-container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '40px',
          marginBottom: '52px'
        }}>
          {/* Col 1: Brand & Regional Focus */}
          <div>
            <div style={{ marginBottom: '18px' }}>
              <CodeBridgeLogo size="md" variant="light-text" href="/" showTagline={true} />
            </div>
            <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: 1.65, marginBottom: '20px' }}>
              Digital products &amp; custom technology solutions engineered for market impact. Delivering web platforms, e-commerce, and business management systems for enterprises globally.
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '9999px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '12px',
              color: '#CBD5E1',
            }}>
              <Globe2 size={14} color="#00B4D8" />
              Serving businesses globally
            </div>
          </div>

          {/* Col 2: Real Solutions Catalog */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '18px' }}>
              Solutions
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '11px', fontSize: '14px', color: '#94A3B8' }}>
              <li><Link href="/services#business-websites" style={{ transition: 'color 0.15s' }}>Business Websites</Link></li>
              <li><Link href="/services#ecommerce" style={{ transition: 'color 0.15s' }}>E-Commerce &amp; Storefronts</Link></li>
              <li><Link href="/services#web-applications" style={{ transition: 'color 0.15s' }}>Custom Web Applications</Link></li>
              <li><Link href="/services#business-management-systems" style={{ transition: 'color 0.15s' }}>Business Management Systems</Link></li>
              <li><Link href="/services#booking-systems" style={{ transition: 'color 0.15s' }}>Booking &amp; Reservation Engines</Link></li>
              <li><Link href="/services#hosting-domain-assistance" style={{ transition: 'color 0.15s' }}>Cloud Hosting &amp; Architecture</Link></li>
              <li style={{ marginTop: '4px' }}>
                <Link href="/services" style={{ color: '#38BDF8', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Explore All 14 Solutions &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Platform & Partnership */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '18px' }}>
              Platform
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '11px', fontSize: '14px', color: '#94A3B8' }}>
              <li><Link href="/how-it-works">How It Works</Link></li>
              <li><Link href="/how-it-works#representatives">Sales Representatives</Link></li>
              <li><Link href="/about">About CodeBridge</Link></li>
              <li><Link href="/contact">Contact Us</Link></li>
              <li><Link href="/request-project">Request Project Scope</Link></li>
              <li><Link href="/about#faq">Frequently Asked Questions</Link></li>
            </ul>
          </div>

          {/* Col 4: Workspaces & Portals Explained */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '18px' }}>
              Workspaces &amp; Portals
            </h4>
            <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.55, marginBottom: '16px' }}>
              Dedicated self-service workspaces for our clients and authorized sales partners:
            </p>

            {/* Micro portal explanations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
              <div style={{
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '12px',
                color: '#CBD5E1',
              }}>
                <strong style={{ color: '#FFFFFF', display: 'block', marginBottom: '2px' }}>Client Portal</strong>
                Sprint milestones, deliverables &amp; invoice payments
              </div>

              <div style={{
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '12px',
                color: '#CBD5E1',
              }}>
                <strong style={{ color: '#FFFFFF', display: 'block', marginBottom: '2px' }}>Representative Workspace</strong>
                Client lead registration &amp; commission tracking
              </div>
            </div>

            {/* High-contrast action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link
                href="/login"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  padding: '9px 16px',
                  borderRadius: '9999px',
                  backgroundColor: '#1E293B',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                }}
              >
                Sign In to Workspace &rarr;
              </Link>
              <Link
                href="/register"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  padding: '9px 16px',
                  borderRadius: '9999px',
                  backgroundColor: '#00B4D8',
                  color: '#FFFFFF',
                  border: '1px solid #00B4D8',
                  fontSize: '13px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 2px 10px rgba(0, 180, 216, 0.3)',
                }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>

        {/* Corporate Sub-footer */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          fontSize: '13px',
          color: '#64748B'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="#10B981" />
            <span>
              &copy; {new Date().getFullYear()} CodeBridge. A platform by NextGen Tech. All rights reserved.
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span>Serving businesses globally.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
