import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

export default function CrewInviteForm() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invite, setInvite] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    first_name: '', last_name: '', address: '', email: '', phone: '',
    passport: '', date_of_birth: '', nationality: '',
    gdpr_consent1: false, gdpr_consent2: false, gdpr_consent3: false,
  });
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState('');

  useEffect(() => {
    if (!token) { setError('Invalid link'); setLoading(false); return; }
    fetch('/api/crew-invitations.php?action=validate&token=' + encodeURIComponent(token))
      .then(r => r.json())
      .then(res => {
        if (!res.success) setError(res.error || 'Link invalid or expired');
        else {
          setInvite(res.data);
          setForm(prev => Object.assign({}, prev, {
            first_name: res.data.invite_first_name || '',
            last_name: res.data.invite_last_name || '',
            email: res.data.invite_email || '',
          }));
        }
      })
      .catch(() => setError('Failed to load invitation'))
      .finally(() => setLoading(false));
  }, [token]);

  const getPos = (e) => {
    const c = canvasRef.current; if (!c) return { x: 0, y: 0 };
    const rect = c.getBoundingClientRect();
    const sx = c.width / rect.width, sy = c.height / rect.height;
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (cx - rect.left) * sx, y: (cy - rect.top) * sy };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const p = getPos(e); ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.stroke();
  };

  const stopDraw = () => {
    setIsDrawing(false);
    const c = canvasRef.current; if (!c) return;
    setSignatureData(c.toDataURL('image/png'));
  };

  const clearSig = () => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    setSignatureData('');
  };

  const handleSubmit = async () => {
    const missing = [];
    if (!form.first_name) missing.push('First Name');
    if (!form.last_name) missing.push('Last Name');
    if (!form.address) missing.push('Address');
    if (!form.email) missing.push('Email');
    if (!form.phone) missing.push('Phone');
    if (!form.passport) missing.push('Passport Number');
    if (!form.date_of_birth) missing.push('Date of Birth');
    if (!form.nationality) missing.push('Nationality');
    if (!signatureData) missing.push('Signature');
    if (!form.gdpr_consent1 || !form.gdpr_consent2 || !form.gdpr_consent3) missing.push('All GDPR consents');
    if (missing.length) { alert('Please complete: ' + missing.join(', ')); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/crew-invitations.php?action=submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({ token: token, signature: signatureData }, form))
      });
      const data = await res.json();
      if (data.success) setSubmitted(true);
      else setError(data.error || 'Submission failed');
    } catch (e) { setError('Network error'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;

  if (error) return (
    <div style={{ maxWidth: 600, margin: '40px auto', background: 'white', padding: 30, borderRadius: 12, textAlign: 'center' }}>
      <h1 style={{ color: '#dc2626' }}>Link Error</h1>
      <p>{error}</p>
    </div>
  );

  if (submitted) return (
    <div style={{ maxWidth: 600, margin: '40px auto', background: 'white', padding: 30, borderRadius: 12, textAlign: 'center' }}>
      <h1 style={{ color: '#059669' }}>Thank You</h1>
      <p>Your details have been submitted successfully. You may close this page.</p>
    </div>
  );

  const fld = (label, field, type) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 14 }}>{label} *</label>
      <input type={type || 'text'} value={form[field]} onChange={(e) => setForm(p => Object.assign({}, p, { [field]: e.target.value }))}
        style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: 15, boxSizing: 'border-box' }} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0c4a6e 0%,#0ea5e9 100%)', padding: '20px 10px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', background: 'white', borderRadius: 16, padding: 30, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ color: '#0c4a6e', margin: '0 0 8px 0' }}>Tailwind Yachting</h1>
          <h2 style={{ color: '#334155', fontSize: 18, fontWeight: 500, margin: 0 }}>Crew/Skipper Details Form</h2>
          {invite && invite.booking_number && <p style={{ color: '#64748b', fontSize: 14, marginTop: 8 }}>Booking: <strong>{invite.booking_number}</strong> | Role: <strong>{invite.role}</strong></p>}
        </div>
        <div style={{ background: '#eff6ff', border: '1px solid #dbeafe', padding: 12, borderRadius: 8, fontSize: 13, color: '#1e40af', marginBottom: 20 }}>
          Please fill in all fields in Latin characters only. Your details will be used for the Crew List and Charter Party documents.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{fld('First Name', 'first_name')}{fld('Last Name', 'last_name')}</div>
        {fld('Address', 'address')}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{fld('Email', 'email', 'email')}{fld('Phone', 'phone', 'tel')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{fld('Passport Number', 'passport')}{fld('Date of Birth', 'date_of_birth', 'date')}</div>
        {fld('Nationality', 'nationality')}

        <h3 style={{ color: '#0c4a6e', marginTop: 24, fontSize: 16 }}>GDPR Consent</h3>
        <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8, fontSize: 13 }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
            <input type='checkbox' checked={form.gdpr_consent1} onChange={(e) => setForm(p => Object.assign({}, p, { gdpr_consent1: e.target.checked }))} style={{ marginTop: 3 }} />
            <span>I consent to Tailwind Yachting processing my personal data (name, address, passport, contact) for the Charter Party Agreement, Crew List, and port authority requirements.</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
            <input type='checkbox' checked={form.gdpr_consent2} onChange={(e) => setForm(p => Object.assign({}, p, { gdpr_consent2: e.target.checked }))} style={{ marginTop: 3 }} />
            <span>I understand my data will be shared with port authorities, maritime regulators, and insurance providers as required by law.</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <input type='checkbox' checked={form.gdpr_consent3} onChange={(e) => setForm(p => Object.assign({}, p, { gdpr_consent3: e.target.checked }))} style={{ marginTop: 3 }} />
            <span>I confirm all information provided is accurate and I am authorized to provide it.</span>
          </label>
        </div>

        <h3 style={{ color: '#0c4a6e', marginTop: 24, fontSize: 16 }}>Signature *</h3>
        <div style={{ border: '2px dashed #cbd5e1', borderRadius: 8, padding: 8, background: 'white' }}>
          <canvas ref={canvasRef} width={600} height={150}
            style={{ width: '100%', height: 150, border: '1px solid #e5e7eb', borderRadius: 4, touchAction: 'none', cursor: 'crosshair' }}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
          <button type='button' onClick={clearSig} style={{ marginTop: 8, padding: '6px 16px', background: '#e5e7eb', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Clear Signature</button>
          {signatureData && <span style={{ marginLeft: 10, color: '#059669', fontSize: 13 }}>Signed</span>}
        </div>

        <button onClick={handleSubmit} disabled={submitting}
          style={{ width: '100%', marginTop: 24, padding: '14px 20px', background: submitting ? '#9ca3af' : 'linear-gradient(135deg,#059669,#10b981)', color: 'white', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer' }}>
          {submitting ? 'Submitting...' : 'Submit Details'}
        </button>

        <p style={{ textAlign: 'center', color: '#64748b', fontSize: 12, marginTop: 16 }}>Your data is transmitted securely. Link expires 7 days from issuance.</p>
      </div>
    </div>
  );
}
