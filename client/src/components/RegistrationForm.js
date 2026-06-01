import React, { useState } from 'react';
import axios from 'axios';

const UPI_ID = '7668903828@pthdfc';
const PAYEE_NAME = 'Vidhi Ajmera';

export default function RegistrationForm({ selectedPlan, setSelectedPlan }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', college: '', transactionId: '', goal: '' });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const amount = selectedPlan === 'workshop' ? 49 : 89;

  // Generate the deep-link UPI URI
  const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Registration for ${selectedPlan === 'workshop' ? 'Workshop' : '1-on-1 Call'}`)}`;
  
  // Use QR Server API to generate high-quality QR code
  const qrCodeSrc = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}&margin=10`;

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const copyUPI = () => {
    navigator.clipboard.writeText(UPI_ID).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { name, phone, email, college, transactionId } = form;
    if (!name || !phone || !email || !college || !transactionId) {
      setError('Please fill in all required fields including the 12-digit transaction ID.');
      return;
    }
    setLoading(true);
    try {
      await axios.post('/api/register', { ...form, plan: selectedPlan, amount });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const s = {
    section: {
      padding: '80px 0',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
    },
    heading: {
      fontSize: 'clamp(24px, 4vw, 36px)',
      fontWeight: 800,
      marginBottom: 8,
      textAlign: 'center',
    },
    sub: {
      color: 'var(--text-secondary)',
      fontSize: 15,
      marginBottom: 48,
      textAlign: 'center',
      maxWidth: 540,
      margin: '0 auto 48px',
    },
    layout: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: 40,
      alignItems: 'start',
    },
    card: {
      background: 'var(--bg-primary)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '32px 24px',
      boxShadow: 'var(--shadow-md)',
    },
    payTitle: {
      fontWeight: 700,
      fontSize: 18,
      marginBottom: 20,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      color: 'var(--text-primary)',
    },
    alertBox: {
      background: '#fffbeb',
      border: '1px solid #fcd34d',
      borderRadius: 'var(--radius-sm)',
      padding: '16px',
      marginBottom: '24px',
      color: '#92400e',
      fontSize: '14px',
      lineHeight: '1.6',
    },
    qrContainer: {
      background: '#ffffff', // QR code requires white background for high contrast scanning
      padding: 16,
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      border: '1px solid var(--border)',
      width: '100%',
      maxWidth: 240,
      margin: '0 auto 20px',
      boxShadow: 'var(--shadow-sm)',
    },
    qrImg: {
      width: '100%',
      height: 'auto',
      maxWidth: 200,
      display: 'block',
    },
    upiRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 20,
    },
    upiBox: {
      flex: 1,
      background: 'var(--bg-tertiary)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      padding: '12px 14px',
      fontSize: 13,
      fontFamily: 'monospace',
      color: 'var(--text-primary)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    copyBtn: {
      background: 'var(--primary)',
      color: '#ffffff',
      borderRadius: 'var(--radius-sm)',
      padding: '12px 18px',
      fontSize: 13,
      fontWeight: 600,
      border: 'none',
      cursor: 'pointer',
    },
    copyBtnCopied: {
      background: 'var(--accent)',
    },
    steps: {
      fontSize: 14,
      color: 'var(--text-secondary)',
      lineHeight: 1.8,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    },
    stepItem: {
      display: 'flex',
      gap: 8,
    },
    stepNum: {
      fontWeight: 700,
      color: 'var(--primary)',
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 16,
    },
    field: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    },
    fieldFull: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      gridColumn: '1 / -1',
    },
    label: {
      fontSize: 12,
      color: 'var(--text-secondary)',
      fontWeight: 600,
      letterSpacing: '0.2px',
    },
    planToggle: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12,
      marginBottom: 20,
    },
    planOpt: {
      padding: '14px',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      cursor: 'pointer',
      transition: 'all 0.2s',
      background: 'var(--bg-secondary)',
      textAlign: 'center',
    },
    planOptActive: {
      borderColor: 'var(--primary)',
      background: 'var(--primary-light)',
      boxShadow: '0 0 0 2px var(--primary)',
    },
    planOptTitle: {
      fontSize: 14,
      fontWeight: 700,
      color: 'var(--text-primary)',
      marginBottom: 2,
    },
    planOptPrice: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--primary)',
    },
    submitBtn: {
      width: '100%',
      marginTop: 24,
      padding: '16px',
      background: 'var(--primary)',
      color: '#ffffff',
      borderRadius: 'var(--radius-sm)',
      fontSize: 15,
      fontWeight: 700,
      boxShadow: 'var(--shadow-md)',
      border: 'none',
      cursor: 'pointer',
    },
    submitBtnDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
    successBox: {
      textAlign: 'center',
      padding: '64px 32px',
      border: '1px solid var(--accent)',
      borderRadius: 'var(--radius-md)',
      background: 'var(--accent-light)',
      maxWidth: 600,
      margin: '0 auto',
      boxShadow: 'var(--shadow-lg)',
    },
    successIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    successTitle: {
      fontWeight: 800,
      fontSize: 26,
      marginBottom: 12,
      color: 'var(--accent)',
    },
    successSub: {
      fontSize: 15,
      color: 'var(--text-secondary)',
      lineHeight: 1.7,
    },
    errorMsg: {
      fontSize: 13,
      color: '#ef4444',
      marginTop: 12,
      fontWeight: 500,
      textAlign: 'center',
    },
    badge: {
      display: 'inline-block',
      padding: '3px 8px',
      background: 'var(--accent-orange-light)',
      color: 'var(--accent-orange)',
      fontSize: 11,
      fontWeight: 600,
      borderRadius: 4,
      marginBottom: 8,
      alignSelf: 'center',
    }
  };

  if (submitted) {
    return (
      <section id="register" style={s.section}>
        <div className="container">
          <div style={s.successBox} className="fade-up">
            <div style={s.successIcon}>🎉</div>
            <div style={s.successTitle}>Registration Received!</div>
            <p style={s.successSub}>
              Thank you, <strong>{form.name}</strong>. Your payment for the <strong>{selectedPlan === 'workshop' ? 'Group Workshop' : '1-on-1 Call'}</strong> is being verified.
              <br /><br />
              We will confirm your seat via WhatsApp and Email within 24 hours. Keep your receipt handy!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="register" style={s.section}>
      <div className="container">
        <h2 style={s.heading}>Register Now</h2>
        <p style={s.sub}>Scan the dynamic QR code below to complete your payment, then fill in your details.</p>

        <div style={s.layout}>
          {/* LEFT — Payment Box */}
          <div style={s.card} className="fade-up-2">
            
            <div style={s.alertBox}>
              <strong>⚠️ MANDATORY STEP:</strong> Your seat is NOT booked just by paying. You <strong>MUST</strong> fill out the form on the right and submit your Transaction ID/UTR to complete registration.
            </div>

            <div style={s.payTitle}>
              <span>💳</span> Secure Payment via UPI
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
              <div style={s.badge}>Amount: ₹{amount}</div>
              <div style={s.qrContainer}>
                <img src={qrCodeSrc} alt={`UPI QR Code for ₹${amount}`} style={s.qrImg} />
              </div>
              
              {/* Deep link button for mobile users */}
              <a 
                href={upiLink}
                style={{
                  display: 'inline-block',
                  background: '#22c55e', // Green for payment action
                  color: '#ffffff',
                  textDecoration: 'none',
                  padding: '12px 18px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '14px',
                  fontWeight: '700',
                  textAlign: 'center',
                  width: '100%',
                  maxWidth: '240px',
                  marginBottom: '12px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                ⚡ Pay via UPI App (Mobile)
              </a>

              <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 12 }}>
                Scan the QR or click the button above to pay via GPay, PhonePe, Paytm, etc.
              </p>
            </div>

            <div style={s.upiRow}>
              <div style={s.upiBox}>{UPI_ID}</div>
              <button 
                type="button"
                style={{ ...s.copyBtn, ...(copied ? s.copyBtnCopied : {}) }} 
                onClick={copyUPI}
              >
                {copied ? '✓ Copied' : 'Copy UPI'}
              </button>
            </div>

            <div style={s.steps}>
              <div style={s.stepItem}>
                <span style={s.stepNum}>1.</span>
                <span>Scan QR or click the button to send <strong>₹{amount}</strong>.</span>
              </div>
              <div style={s.stepItem}>
                <span style={s.stepNum}>2.</span>
                <span>Complete the transfer and copy your 12-digit UTR.</span>
              </div>
              <div style={s.stepItem}>
                <span style={s.stepNum}>3.</span>
                <span>Enter your <strong>Transaction ID / UTR number</strong> in the form.</span>
              </div>
              <div style={s.stepItem}>
                <span style={s.stepNum}>4.</span>
                <span>Click Submit Registration.</span>
              </div>
            </div>
          </div>

          {/* RIGHT — Form Box */}
          <div style={s.card} className="fade-up-3">
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.3px', textTransform: 'uppercase', fontWeight: 600 }}>
              Step 2: Submit Registration
            </div>
            <div style={s.planToggle}>
              {[
                { key: 'workshop', label: 'Group Workshop', price: '₹49' },
                { key: 'oneonone', label: '1-on-1 Call', price: '₹89' }
              ].map(p => (
                <div
                  key={p.key}
                  style={{ ...s.planOpt, ...(selectedPlan === p.key ? s.planOptActive : {}) }}
                  onClick={() => setSelectedPlan(p.key)}
                >
                  <div style={s.planOptTitle}>{p.label}</div>
                  <div style={s.planOptPrice}>{p.price}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={s.formGrid}>
              <div style={s.field}>
                <label style={s.label}>Full Name *</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. John Doe" required />
              </div>
              <div style={s.field}>
                <label style={s.label}>WhatsApp Number *</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="e.g. 9876543210" required />
              </div>
              <div style={s.fieldFull}>
                <label style={s.label}>Email Address *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="e.g. john@example.com" required />
              </div>
              <div style={s.fieldFull}>
                <label style={s.label}>College & Year *</label>
                <input name="college" value={form.college} onChange={handleChange} placeholder="e.g. IIT Delhi, 3rd Year BTech" required />
              </div>
              <div style={s.fieldFull}>
                <label style={s.label}>Transaction ID / UTR number *</label>
                <input name="transactionId" value={form.transactionId} onChange={handleChange} placeholder="Required: 12-digit UTR or Transaction Ref" required />
              </div>
              <div style={s.fieldFull}>
                <label style={s.label}>What do you want to learn? (optional)</label>
                <textarea name="goal" value={form.goal} onChange={handleChange} placeholder="e.g. Resume tips, interview process, etc." />
              </div>

              {error && <div style={{...s.fieldFull, ...s.errorMsg}}>⚠ {error}</div>}

              <div style={s.fieldFull}>
                <button
                  type="submit"
                  style={{ ...s.submitBtn, ...(loading ? s.submitBtnDisabled : {}) }}
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : `Submit Registration (₹${amount})`}
                </button>
              </div>
            </form>

            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 16, textAlign: 'center' }}>
              Only serious learners. Verification takes up to 24 hours.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
