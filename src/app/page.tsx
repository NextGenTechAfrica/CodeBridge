"use client";

// src/app/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import {
  Code,
  Smartphone,
  Layout,
  Layers,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
} from 'lucide-react';

export default function HomePage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as any } },
  };

  return (
    <div style={{ backgroundColor: 'var(--cb-bg-page)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1 }}>
        {/* ================================================================= */}
        {/* 1. HERO SECTION                                                   */}
        {/* ================================================================= */}
        <section style={{
          padding: '70px 0 60px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Subtle background gradient radial */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: '1400px',
            height: '100%',
            background: 'radial-gradient(circle at 15% 20%, rgba(0, 180, 216, 0.06), transparent 50%), radial-gradient(circle at 85% 40%, rgba(14, 165, 233, 0.05), transparent 45%)',
            pointerEvents: 'none',
          }} />

          <div className="cb-container" style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '48px',
              alignItems: 'center',
            }}>
              {/* Left Column: Headline, Copy, Dual Pill Buttons, Trust Props */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Eyebrow Pill */}
                <motion.div variants={itemVariants} style={{
                  display: 'inline-block',
                  fontSize: '12px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  color: 'var(--cb-cyan-500)',
                  backgroundColor: 'rgba(0, 180, 216, 0.1)',
                  padding: '6px 12px',
                  borderRadius: '100px',
                  textTransform: 'uppercase',
                  marginBottom: '24px',
                }}>
                  ENTERPRISE ENGINEERING &bull; CUSTOM DIGITAL PRODUCTS
                </motion.div>

                {/* Main Headline */}
                <motion.h1 variants={itemVariants} style={{
                  fontSize: 'clamp(38px, 5.2vw, 58px)',
                  fontWeight: 900,
                  lineHeight: 1.12,
                  letterSpacing: '-0.03em',
                  color: 'var(--cb-text-primary)',
                  marginBottom: '20px',
                }}>
                  Build Your Project.<br />
                  Bridge to <span className="cb-text-gradient">Success.</span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p variants={itemVariants} style={{
                  fontSize: 'clamp(15px, 1.8vw, 17px)',
                  lineHeight: 1.6,
                  color: 'var(--cb-text-secondary)',
                  maxWidth: '520px',
                  marginBottom: '32px',
                }}>
                  CodeBridge designs, develops, and deploys high-performance digital products and custom business software for companies globally &mdash; delivered on time and within budget.
                </motion.p>

                {/* Dual Pill CTA Buttons */}
                <motion.div variants={itemVariants} style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', marginBottom: '40px' }}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/request-project"
                      className="cb-btn cb-btn-cyan"
                      style={{ padding: '13px 28px', fontSize: '15px' }}
                    >
                      Get Started
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/how-it-works"
                      className="cb-btn cb-btn-outline-pill"
                      style={{ padding: '13px 28px', fontSize: '15px', borderColor: 'var(--cb-border-light)', color: 'var(--cb-text-primary)' }}
                    >
                      Learn More
                    </Link>
                  </motion.div>
                </motion.div>

                {/* Trust / Value Props Row */}
                <motion.div variants={itemVariants} style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '16px',
                  paddingTop: '20px',
                  borderTop: '1px solid var(--cb-border-subtle)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ color: 'var(--cb-text-primary)', marginTop: '2px' }}>
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-primary)' }}>Dedicated Engineering</div>
                      <div style={{ fontSize: '11px', color: 'var(--cb-text-muted)' }}>Production-ready delivery</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ color: 'var(--cb-text-primary)', marginTop: '2px' }}>
                      <Zap size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-primary)' }}>Fast Delivery</div>
                      <div style={{ fontSize: '11px', color: 'var(--cb-text-muted)' }}>Get results, on time</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ color: 'var(--cb-text-primary)', marginTop: '2px' }}>
                      <Lock size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-primary)' }}>Secure &amp; Reliable</div>
                      <div style={{ fontSize: '11px', color: 'var(--cb-text-muted)' }}>Your project, our priority</div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Right Column: Hero Visual with Doodles and Floating Badge */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                style={{ position: 'relative' }}
              >
                {/* Playful Doodles: Top right star and curved note */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    position: 'absolute',
                    top: '-24px',
                    right: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    zIndex: 2,
                    pointerEvents: 'none',
                  }}
                >
                  <span style={{
                    fontFamily: 'cursive, var(--cb-font-sans)',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: 'var(--cb-cyan-500)',
                    transform: 'rotate(4deg)',
                    whiteSpace: 'nowrap',
                    textShadow: '0 1px 2px rgba(255,255,255,0.2)',
                  }}>
                    Great engineering builds great products
                  </span>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L14.5 8.5L21 9.5L16 14.5L17.5 21L12 17.5L6.5 21L8 14.5L3 9.5L9.5 8.5L12 2Z" stroke="var(--cb-cyan-400)" strokeWidth="2" fill="rgba(0,180,216,0.15)"/>
                  </svg>
                </motion.div>

                {/* Hand-drawn curved arrow doodle */}
                <motion.div
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 1 }}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '-10px',
                    zIndex: 2,
                    pointerEvents: 'none',
                  }}
                >
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <motion.path 
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, delay: 0.8 }}
                      d="M8 28 C 14 12, 28 8, 36 14" stroke="var(--cb-cyan-400)" strokeWidth="2.5" strokeLinecap="round"
                    />
                    <motion.path 
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 2.3 }}
                      d="M30 8 L 36 14 L 32 20" stroke="var(--cb-cyan-400)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    />
                  </svg>
                </motion.div>

                {/* Hero Collaboration Image Container */}
                <div style={{
                  position: 'relative',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  boxShadow: 'var(--cb-shadow-lg)',
                  aspectRatio: '3/2',
                  backgroundColor: 'var(--cb-bg-subtle)',
                }}>
                  <Image
                    src="/images/hero-talent.jpg"
                    alt="CodeBridge engineering team collaborating on software architecture"
                    fill
                    sizes="(max-width: 768px) 100vw, 560px"
                    priority
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>



        {/* ================================================================= */}
        {/* 3. SERVICES SHOWCASE SECTION                                      */}
        {/* ================================================================= */}
        <section style={{
          padding: '80px 0',
          position: 'relative',
        }}>
          <div className="cb-container">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={containerVariants}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '48px',
                alignItems: 'center',
              }}
            >
              {/* Left Column: Heading, Description, CTA */}
              <div>
                <motion.div variants={itemVariants} style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  color: 'var(--cb-cyan-500)',
                  textTransform: 'uppercase',
                  marginBottom: '14px',
                }}>
                  OUR SERVICES
                </motion.div>

                <motion.h2 variants={itemVariants} style={{
                  fontSize: 'clamp(28px, 3.6vw, 40px)',
                  fontWeight: 900,
                  lineHeight: 1.2,
                  letterSpacing: '-0.03em',
                  color: 'var(--cb-text-primary)',
                  marginBottom: '18px',
                }}>
                  End-to-End Software Engineering &amp; Digital Solutions
                </motion.h2>

                <motion.p variants={itemVariants} style={{
                  fontSize: '15px',
                  lineHeight: 1.6,
                  color: 'var(--cb-text-secondary)',
                  marginBottom: '32px',
                  maxWidth: '440px',
                }}>
                  From strategy and architecture to engineering, deployment, and handover &mdash; we build tailored digital products and robust business systems for your exact needs.
                </motion.p>

                <motion.div variants={itemVariants} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ display: 'inline-block' }}>
                  <Link
                    href="/services"
                    className="cb-btn cb-btn-cyan"
                    style={{ padding: '13px 28px', fontSize: '14px' }}
                  >
                    Explore All Services
                  </Link>
                </motion.div>
              </div>

              {/* Right Column: 2x2 Service Cards Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px',
              }}>
                {[
                  { title: "Web Development", icon: <Code size={20} />, desc: "Modern, scalable web applications for your business." },
                  { title: "Mobile App Development", icon: <Smartphone size={20} />, desc: "iOS and Android apps that users love." },
                  { title: "UI/UX Design", icon: <Layout size={20} />, desc: "Beautiful, intuitive designs that convert." },
                  { title: "Business Systems & BMS", icon: <Layers size={20} />, desc: "Centralized portals, inventory & operations software." }
                ].map((service, idx) => (
                  <motion.div
                    key={idx}
                    variants={itemVariants}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="cb-glass"
                    style={{
                      padding: '24px',
                      borderRadius: '16px',
                      boxShadow: 'var(--cb-shadow-sm)',
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--cb-cyan-500)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                    }}>
                      {service.icon}
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cb-text-primary)', marginBottom: '8px' }}>
                      {service.title}
                    </h3>
                    <p style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--cb-text-secondary)' }}>
                      {service.desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 4. FINAL CONVERSION CTA SECTION                                   */}
        {/* ================================================================= */}
        <section style={{
          background: 'linear-gradient(135deg, var(--cb-navy-950) 0%, var(--cb-navy-900) 50%, var(--cb-navy-800) 100%)',
          padding: '96px 0',
          textAlign: 'center',
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
          borderTop: '1px solid rgba(0, 180, 216, 0.15)',
        }}>
          {/* Decorative glow and ambient aura */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            maxWidth: '840px',
            height: '80%',
            background: 'radial-gradient(ellipse at center, rgba(0, 180, 216, 0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="cb-container"
            style={{ position: 'relative', zIndex: 1, maxWidth: '780px', margin: '0 auto' }}
          >
            {/* Eyebrow */}
            <div style={{
              display: 'inline-block',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.1em',
              color: 'var(--cb-cyan-400)',
              backgroundColor: 'rgba(0, 180, 216, 0.12)',
              border: '1px solid rgba(0, 180, 216, 0.25)',
              padding: '6px 14px',
              borderRadius: '100px',
              textTransform: 'uppercase',
              marginBottom: '20px',
            }}>
              READY TO BUILD?
            </div>

            {/* Main Headline */}
            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.2,
              marginBottom: '18px',
              color: '#FFFFFF',
            }}>
              Turn Your Business Idea Into a Working Digital Product.
            </h2>

            {/* Supporting copy */}
            <p style={{
              fontSize: 'clamp(15px, 1.8vw, 17px)',
              color: '#94A3B8',
              maxWidth: '620px',
              margin: '0 auto 36px',
              lineHeight: 1.65,
            }}>
              Tell our engineering team what you need to build, improve, or automate. We&apos;ll review your requirements and help you map out the right technical solution.
            </p>

            {/* Dual CTAs */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link
                  href="/request-project"
                  className="cb-btn cb-btn-cyan"
                  style={{
                    padding: '14px 32px',
                    fontSize: '15px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>Request a Project</span>
                  <ArrowRight size={16} />
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link
                  href="/contact"
                  className="cb-btn cb-btn-outline-light"
                  style={{
                    padding: '14px 28px',
                    fontSize: '15px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ color: '#FFFFFF' }}>Contact Technical Desk</span>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
