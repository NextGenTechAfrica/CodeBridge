// src/app/contact/page.tsx
'use client';

import { useState } from 'react';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Send,
  HelpCircle
} from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    category: 'Technical Consultation / Scoping',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');
  const [leadRef, setLeadRef] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setFeedback('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || '',
          country: formData.country,
          category: formData.category,
          subject: formData.subject,
          message: formData.message,
        }),
      });

      const data = await res.json();


      if (res.ok) {
        setStatus('success');
        setLeadRef(data.leadId || 'INQ-' + Date.now().toString().slice(-6));
        setFeedback('Your message has been received. Our team will review your inquiry and respond as soon as possible.');
        setFormData({
          name: '',
          email: '',
          phone: '',
          country: '',
          category: 'Technical Consultation / Scoping',
          subject: '',
          message: '',
        });
      } else {
        setStatus('error');
        setFeedback(data.error || 'Failed to submit your message. Please try again.');
      }
    } catch {
      setStatus('error');
      setFeedback('An unexpected network error occurred. Please try again.');
    }
  };

  return (
    <>
      <Navbar />

      <main style={{ minHeight: '100vh', backgroundColor: 'var(--cb-bg-page)' }}>
        {/* ================================================================= */}
        {/* 1. HERO HEADER                                                    */}
        {/* ================================================================= */}
        <section style={{
          background: 'linear-gradient(180deg, rgba(0, 180, 216, 0.05) 0%, transparent 100%)',
          padding: '80px 0 60px',
          borderBottom: '1px solid var(--cb-border-subtle)',
        }}>
          <div className="cb-container" style={{ maxWidth: '820px', margin: '0 auto' }}>

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
              Get In Touch
            </div>

            <h1 style={{
              fontSize: 'clamp(32px, 5vw, 46px)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              color: 'var(--cb-text-primary)',
              marginBottom: '20px',
            }}>
              Connect with{' '}
              <span className="cb-text-gradient">
                CodeBridge
              </span>
            </h1>

            <p style={{
              fontSize: '17px',
              lineHeight: 1.65,
              color: 'var(--cb-text-secondary)',
              maxWidth: '680px',
              margin: '0 auto',
            }}>
              Whether you are planning custom software architecture, seeking technical scoping, or inquiring about our authorized sales representative partnership, send us a message below.
            </p>
            <p style={{ color: 'var(--cb-text-secondary)', fontSize: '15px', marginTop: '12px' }}>nextgentechafrica@gmail.com</p>
            </motion.div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 2. CONTACT FORM                                                    */}
        {/* ================================================================= */}
        <section style={{ padding: '60px 0 90px' }}>
          <div className="cb-container" style={{ maxWidth: '720px', margin: '0 auto' }}>

            {/* Contact Form Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="cb-glass"
              style={{
              borderRadius: '16px',
              padding: '36px',
              boxShadow: 'var(--cb-shadow-lg)',
              marginBottom: '32px',
            }}>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--cb-text-primary)', marginBottom: '6px' }}>
                  Send Us a Message
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--cb-text-secondary)' }}>
                  Fill out the form below with your inquiry. We will get back to you as soon as possible.
                </p>
              </div>

              {status === 'success' && (
                <div style={{
                  padding: '24px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  marginBottom: '24px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10B981', fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>
                    <CheckCircle2 size={22} />
                    Message Sent Successfully
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--cb-text-primary)', lineHeight: 1.6, margin: 0, marginBottom: '14px' }}>
                    {feedback}
                  </p>
                  {leadRef && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(34, 197, 94, 0.15)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#10B981',
                    }}>
                      Reference: {leadRef}
                    </div>
                  )}
                </div>
              )}

              {status === 'error' && (
                <div style={{
                  padding: '16px 18px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#EF4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '24px',
                  fontSize: '14px',
                }}>
                  <AlertCircle size={18} />
                  {feedback}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Full Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-primary)', marginBottom: '6px' }}>
                    Your Full Name <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your full name"
                    className="cb-input"
                  />
                </div>

                {/* Business Email & Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-primary)', marginBottom: '6px' }}>
                      Email Address <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                      className="cb-input"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-primary)', marginBottom: '6px' }}>
                      Phone / WhatsApp (Optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+234..."
                      className="cb-input"
                    />
                  </div>
                </div>

                {/* Country Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-primary)', marginBottom: '8px' }}>
                    Country <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="e.g. United States, United Kingdom..."
                    className="cb-input"
                  />
                </div>

                {/* Inquiry Category */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-primary)', marginBottom: '6px' }}>
                    Inquiry Category <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="cb-input"
                  >
                    <option value="Technical Consultation / Scoping">Technical Consultation / Scoping</option>
                    <option value="Custom Software & Web Application">Custom Software &amp; Web Application</option>
                    <option value="Corporate Website or Redesign">Corporate Website or Redesign</option>
                    <option value="E-commerce or Ordering System">E-commerce or Ordering System</option>
                    <option value="Representative Partnership Program">Representative Partnership Program</option>
                    <option value="General Inquiry">General Inquiry</option>
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-primary)', marginBottom: '6px' }}>
                    Subject <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Brief subject of your inquiry"
                    className="cb-input"
                  />
                </div>

                {/* Message Details */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-primary)', marginBottom: '6px' }}>
                    Message <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your inquiry, project scope, requirements, or questions in detail..."
                    className="cb-input"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="cb-btn cb-btn-cyan"
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '15px',
                    marginTop: '8px',
                    opacity: status === 'loading' ? 0.75 : 1,
                  }}
                >
                  {status === 'loading' ? (
                    <>Sending...</>
                  ) : (
                    <>
                      <Send size={16} />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {/* Scoping CTA Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{
              backgroundColor: 'var(--cb-gray-900)',
              borderRadius: '16px',
              padding: '30px',
              color: '#FFFFFF',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute',
                top: '-30px',
                right: '-30px',
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(0, 180, 216, 0.25) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                fontSize: '11px',
                fontWeight: 700,
                color: '#38BDF8',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '14px',
              }}>
                <HelpCircle size={12} />
                Ready for Formal Scoping?
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>
                Request a Project Proposal
              </h3>
              <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.6, marginBottom: '20px' }}>
                If you have defined specifications or require an exact milestone quote, jump directly into our project scoping form.
              </p>

              <Link
                href="/request-project"
                className="cb-btn cb-btn-cyan"
                style={{ padding: '10px 20px', fontSize: '13px' }}
              >
                Request Project Scope <ArrowRight size={14} />
              </Link>
            </motion.div>

            {/* Corporate Note */}
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{
              padding: '20px 24px',
              borderRadius: '12px',
              backgroundColor: 'var(--cb-bg-subtle)',
              border: '1px solid var(--cb-border-subtle)',
              fontSize: '13px',
              color: 'var(--cb-text-secondary)',
              lineHeight: 1.6,
              marginTop: '24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--cb-text-primary)', marginBottom: '6px' }}>
                <ShieldCheck size={16} style={{ color: 'var(--cb-cyan-500)' }} />
                Corporate Entity
              </div>
              CodeBridge is a technology delivery platform providing digital solutions for businesses and individuals.
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
