'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building, User, FileText, Lock, DollarSign, CheckCircle2, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { INDUSTRY_SECTORS } from '@/lib/constants/industries';

export default function IntakeForm({ initialService = 'Business Websites' }: { initialService?: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successLead, setSuccessLead] = useState<any>(null);

  const [servicesList, setServicesList] = useState<{ id: string; name: string; category: string }[]>([]);

  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setServicesList(data.data);
        }
      })
      .catch(err => console.error('Failed to load services:', err));
  }, []);

  const [formData, setFormData] = useState({
    businessName: '',
    industry: INDUSTRY_SECTORS[0] as string,
    customIndustryText: '',
    countryCode: 'NG',
    businessDescription: '',
    
    firstName: '',
    lastName: '',
    email: '',
    phone: '',

    serviceCategory: initialService,
    requirements: '',
    timeline: '2-4 months',
    estimatedBudget: '1500000',
    currency: 'NGN',

    authMode: 'register', // 'register' or 'login'
    password: '',
    confirmPassword: '',
  });

  const handleCountryChange = (code: string) => {
    setFormData(prev => ({
      ...prev,
      countryCode: code,
      currency: code === 'NG' ? 'NGN' : 'KES',
      estimatedBudget: code === 'NG' ? '1500000' : '250000',
    }));
  };

  const nextStep = () => {
    setErrorMsg('');
    if (step === 1) {
      if (!formData.businessName || !formData.businessDescription) {
        setErrorMsg('Please fill out all required business fields.');
        return;
      }
    }
    if (step === 2) {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
        setErrorMsg('Please fill out all required contact fields.');
        return;
      }
    }
    if (step === 3) {
      if (!formData.requirements) {
        setErrorMsg('Please provide project requirements.');
        return;
      }
    }
    if (step === 4) {
      if (!formData.password) {
        setErrorMsg('Please enter a password.');
        return;
      }
      if (formData.authMode === 'register' && formData.password !== formData.confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setErrorMsg('');
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 5) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const effectiveIndustry =
        formData.industry === 'Other / Custom (Specify)' && formData.customIndustryText?.trim()
          ? formData.customIndustryText.trim()
          : formData.industry === 'Other / Custom (Specify)'
          ? 'Other / Custom'
          : formData.industry;

      // Step 1: Auth (Register or Login)
      const authEndpoint = formData.authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const authPayload = formData.authMode === 'register' 
        ? {
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            countryCode: formData.countryCode,
            accountType: 'CLIENT',
            companyName: formData.businessName,
            industry: effectiveIndustry,
          }
        : {
            email: formData.email,
            password: formData.password,
          };
      
      const authRes = await fetch(authEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authPayload),
      });

      const authData = await authRes.json();
      if (!authRes.ok) {
        setErrorMsg(authData.error || 'Authentication failed.');
        setLoading(false);
        return;
      }

      // Step 2: Submit Project Request
      const reqRes = await fetch('/api/request-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: formData.businessName,
          contactPerson: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          countryCode: formData.countryCode,
          businessType: effectiveIndustry,
          serviceCategory: formData.serviceCategory,
          requirements: formData.requirements,
          estimatedBudget: formData.estimatedBudget,
          currency: formData.currency,
          timeline: formData.timeline,
        }),
      });

      const reqData = await reqRes.json();
      if (reqRes.ok) {
        setSuccessLead(reqData);
      } else {
        setErrorMsg(reqData.error || 'Failed to submit project request.');
      }
    } catch (err) {
      setErrorMsg('An unexpected network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (successLead) {
    return (
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        border: '1px solid #E2E8F0',
        padding: '60px 40px',
        textAlign: 'center',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
        maxWidth: '680px',
        margin: '0 auto',
      }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%', backgroundColor: 'rgba(5, 150, 105, 0.15)', border: '2px solid rgba(5, 150, 105, 0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#10B981',
        }}>
          <CheckCircle2 size={40} />
        </div>
        <h2 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--cb-text-primary)', marginBottom: '12px' }}>
          Project Scoping Request Submitted!
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--cb-text-secondary)', lineHeight: 1.65, marginBottom: '24px' }}>
          {successLead.message} Your technical requirements have been recorded into our project evaluation queue with permanent reference:
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '10px 20px', borderRadius: '10px',
          backgroundColor: 'var(--cb-bg-subtle)', border: '1px solid var(--cb-border-subtle)', fontFamily: 'monospace', fontSize: '15px',
          fontWeight: 700, color: 'var(--cb-cyan-500)', marginBottom: '32px',
        }}>
          Reference ID: {successLead.leadId}
        </div>
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => router.push('/dashboard/client')}
            style={{
              padding: '12px 24px', borderRadius: '8px', backgroundColor: '#0284C7', color: '#FFFFFF',
              fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '8px',
            }}
          >
            Go to Client Portal <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--cb-bg-card)', borderRadius: '18px', border: '1px solid var(--cb-border-subtle)', padding: '38px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
      {/* Progress Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', position: 'relative' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ 
            width: '32px', height: '32px', borderRadius: '50%', 
            backgroundColor: step >= i ? 'var(--cb-cyan-600)' : 'var(--cb-bg-subtle)', 
            color: step >= i ? '#FFFFFF' : 'var(--cb-text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontWeight: 700, fontSize: '14px', zIndex: 2
          }}>
            {i}
          </div>
        ))}
        <div style={{ position: 'absolute', top: '15px', left: '16px', right: '16px', height: '2px', backgroundColor: 'var(--cb-bg-subtle)', zIndex: 1 }}>
          <div style={{ width: `${(step - 1) * 25}%`, height: '100%', backgroundColor: 'var(--cb-cyan-600)', transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {errorMsg && (
        <div style={{ padding: '14px 18px', borderRadius: '10px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px', fontSize: '14px' }}>
          <AlertCircle size={18} />
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {step === 1 && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cb-text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={20} color="#0284C7" /> 1. Your Business
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-secondary)', marginBottom: '6px' }}>Business / Company Name *</label>
                <input type="text" value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} placeholder="e.g. Acme Logistics Ltd" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-secondary)', marginBottom: '6px' }}>Industry / Sector</label>
                  <select value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} style={inputStyle}>
                    {INDUSTRY_SECTORS.map((sector) => (
                      <option key={sector} value={sector} style={{ backgroundColor: 'var(--cb-bg-card, #0F172A)', color: 'var(--cb-text-primary, #FFFFFF)' }}>
                        {sector}
                      </option>
                    ))}
                  </select>
                  {formData.industry === 'Other / Custom (Specify)' && (
                    <div style={{ marginTop: '10px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#0284C7', marginBottom: '4px' }}>
                        Specify Custom Industry / Sector (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Clean Energy, Maritime, Biotechnology..."
                        value={formData.customIndustryText}
                        onChange={e => setFormData({ ...formData, customIndustryText: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-secondary)', marginBottom: '6px' }}>Operating Market</label>
                  <select value={formData.countryCode} onChange={e => handleCountryChange(e.target.value)} style={inputStyle}>
                    <option value="NG">Nigeria (NGN)</option>
                    <option value="KE">Kenya (KES)</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-secondary)', marginBottom: '6px' }}>Business Description *</label>
                <textarea value={formData.businessDescription} onChange={e => setFormData({...formData, businessDescription: e.target.value})} rows={3} placeholder="What does your business do?" style={{...inputStyle, resize: 'vertical'}} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cb-text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={20} color="#0284C7" /> 2. Contact Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-secondary)', marginBottom: '6px' }}>First Name *</label>
                  <input type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-secondary)', marginBottom: '6px' }}>Last Name *</label>
                  <input type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-secondary)', marginBottom: '6px' }}>Work Email *</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="you@company.com" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-secondary)', marginBottom: '6px' }}>Phone / WhatsApp *</label>
                <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={inputStyle} />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cb-text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} color="#0284C7" /> 3. Your Project
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-secondary)', marginBottom: '6px' }}>Service Category</label>
                <select value={formData.serviceCategory} onChange={e => setFormData({...formData, serviceCategory: e.target.value})} style={inputStyle}>
                  {servicesList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-secondary)', marginBottom: '6px' }}>Functional Scope & Requirements *</label>
                <textarea value={formData.requirements} onChange={e => setFormData({...formData, requirements: e.target.value})} rows={5} placeholder="Describe the application goals, key features, required user roles..." style={{...inputStyle, resize: 'vertical'}} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-secondary)', marginBottom: '6px' }}>Expected Timeline</label>
                  <select value={formData.timeline} onChange={e => setFormData({...formData, timeline: e.target.value})} style={inputStyle}>
                    <option value="1-2 months">1-2 months</option>
                    <option value="2-4 months">2-4 months</option>
                    <option value="4-6 months">4-6 months</option>
                    <option value="6+ months">6+ months</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-secondary)', marginBottom: '6px' }}>Estimated Budget ({formData.currency})</label>
                  <input type="number" step="1000" value={formData.estimatedBudget} onChange={e => setFormData({...formData, estimatedBudget: e.target.value})} style={inputStyle} />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cb-text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={20} color="#0284C7" /> 4. Your Account
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--cb-text-secondary)', marginBottom: '20px' }}>
              We need to securely associate this request with your CodeBridge client portal.
            </p>
            
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <button type="button" onClick={() => setFormData({...formData, authMode: 'register'})} style={{
                flex: 1, padding: '10px', borderRadius: '8px', border: formData.authMode === 'register' ? '2px solid #0284C7' : '1px solid var(--cb-border-subtle)', backgroundColor: formData.authMode === 'register' ? 'var(--cb-bg-subtle)' : 'var(--cb-bg-card)', color: 'var(--cb-text-primary)', fontWeight: 700, cursor: 'pointer'
              }}>New Account</button>
              <button type="button" onClick={() => setFormData({...formData, authMode: 'login'})} style={{
                flex: 1, padding: '10px', borderRadius: '8px', border: formData.authMode === 'login' ? '2px solid #0284C7' : '1px solid var(--cb-border-subtle)', backgroundColor: formData.authMode === 'login' ? 'var(--cb-bg-subtle)' : 'var(--cb-bg-card)', color: 'var(--cb-text-primary)', fontWeight: 700, cursor: 'pointer'
              }}>Sign In</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-secondary)', marginBottom: '6px' }}>Email (from Step 2)</label>
                <input type="email" value={formData.email} disabled style={{...inputStyle, backgroundColor: 'var(--cb-bg-subtle)', color: 'var(--cb-text-muted)'}} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-secondary)', marginBottom: '6px' }}>Password *</label>
                <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={inputStyle} />
              </div>
              {formData.authMode === 'register' && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-secondary)', marginBottom: '6px' }}>Confirm Password *</label>
                  <input type="password" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} style={inputStyle} />
                </div>
              )}
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cb-text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={20} color="#0284C7" /> 5. Review & Submit
            </h3>
            <div style={{ backgroundColor: 'var(--cb-bg-subtle)', borderRadius: '12px', border: '1px solid var(--cb-border-subtle)', padding: '20px', fontSize: '14px', color: 'var(--cb-text-primary)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <strong>Business:</strong> {formData.businessName} (
                {formData.industry === 'Other / Custom (Specify)' && formData.customIndustryText?.trim()
                  ? formData.customIndustryText.trim()
                  : formData.industry}
                )
              </div>
              <div><strong>Contact:</strong> {formData.firstName} {formData.lastName} ({formData.email})</div>
              <div><strong>Service:</strong> {formData.serviceCategory}</div>
              <div><strong>Budget:</strong> {formData.currency} {formData.estimatedBudget}</div>
              <div><strong>Timeline:</strong> {formData.timeline}</div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
          {step > 1 && (
            <button type="button" onClick={prevStep} style={{
              flex: 1, padding: '16px', borderRadius: '10px', backgroundColor: 'var(--cb-bg-card)', color: 'var(--cb-text-primary)', border: '1px solid var(--cb-border-subtle)', fontWeight: 700, cursor: 'pointer'
            }}>
              <ArrowLeft size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Back
            </button>
          )}
          
          {step < 5 ? (
            <button type="button" onClick={nextStep} style={{
              flex: 2, padding: '16px', borderRadius: '10px', backgroundColor: '#0284C7', color: '#FFFFFF', border: 'none', fontWeight: 800, cursor: 'pointer'
            }}>
              Next Step <ArrowRight size={18} style={{ marginLeft: '8px', verticalAlign: 'middle' }} />
            </button>
          ) : (
            <button type="submit" disabled={loading} style={{
              flex: 2, padding: '16px', borderRadius: '10px', backgroundColor: '#0284C7', color: '#FFFFFF', border: 'none', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
            }}>
              {loading ? 'Processing...' : 'Submit Request'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: '8px',
  border: '1px solid var(--cb-border-subtle)',
  backgroundColor: 'var(--cb-bg-input)',
  color: 'var(--cb-text-primary)',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box' as 'border-box',
};

