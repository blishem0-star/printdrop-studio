'use client';
import { useState } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';

export default function CheckoutPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', address: '', city: '', zip: '', country: 'US', card: '', expiry: '', cvv: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  if (submitted) {
    return (
      <main style={{ paddingTop: 80, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 1.5rem' }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontSize: 72, marginBottom: 24 }}>✅</div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 12 }}>You&apos;re all set!</h1>
          <p style={{ color: '#777', lineHeight: 1.7, marginBottom: 32 }}>
            Order confirmed. You&apos;ll get a shipping notification within 24 hours.
            Expected delivery: <strong style={{ color: '#10B981' }}>72 hours</strong>.
          </p>
          <Link href="/" className="btn-primary">Back to Home</Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ paddingTop: 80, minHeight: '100vh' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem' }}>Checkout</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
          <form onSubmit={e => { e.preventDefault(); setSubmitted(true); }}>
            {/* Shipping */}
            <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 16, padding: '1.5rem', marginBottom: '1.25rem' }}>
              <h2 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1rem' }}>📦 Shipping Details</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[
                  { name: 'name', placeholder: 'Full Name', colSpan: 2 },
                  { name: 'email', placeholder: 'Email Address', colSpan: 2 },
                  { name: 'address', placeholder: 'Street Address', colSpan: 2 },
                  { name: 'city', placeholder: 'City', colSpan: 1 },
                  { name: 'zip', placeholder: 'ZIP Code', colSpan: 1 },
                ].map(f => (
                  <input key={f.name} name={f.name} placeholder={f.placeholder}
                    value={form[f.name as keyof typeof form]} onChange={handleChange} required
                    style={{
                      gridColumn: `span ${f.colSpan}`,
                      background: '#0d0d0d', border: '1px solid #222', borderRadius: 10,
                      padding: '0.75rem 1rem', color: '#fff', fontSize: 14, outline: 'none',
                    }}
                  />
                ))}
                <select name="country" value={form.country} onChange={handleChange}
                  style={{ gridColumn: 'span 2', background: '#0d0d0d', border: '1px solid #222', borderRadius: 10, padding: '0.75rem 1rem', color: '#fff', fontSize: 14, outline: 'none' }}>
                  <option value="US">🇺🇸 United States</option>
                  <option value="GB">🇬🇧 United Kingdom</option>
                  <option value="IL">🇮🇱 Israel</option>
                  <option value="DE">🇩🇪 Germany</option>
                  <option value="CA">🇨🇦 Canada</option>
                </select>
              </div>
            </div>

            {/* Payment */}
            <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 16, padding: '1.5rem', marginBottom: '1.25rem' }}>
              <h2 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1rem' }}>💳 Payment</h2>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <input name="card" placeholder="Card Number (demo — not real)" value={form.card} onChange={handleChange}
                  style={{ background: '#0d0d0d', border: '1px solid #222', borderRadius: 10, padding: '0.75rem 1rem', color: '#fff', fontSize: 14, outline: 'none' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <input name="expiry" placeholder="MM/YY" value={form.expiry} onChange={handleChange}
                    style={{ background: '#0d0d0d', border: '1px solid #222', borderRadius: 10, padding: '0.75rem 1rem', color: '#fff', fontSize: 14, outline: 'none' }} />
                  <input name="cvv" placeholder="CVV" value={form.cvv} onChange={handleChange}
                    style={{ background: '#0d0d0d', border: '1px solid #222', borderRadius: 10, padding: '0.75rem 1rem', color: '#fff', fontSize: 14, outline: 'none' }} />
                </div>
              </div>
              <p style={{ color: '#444', fontSize: 12, marginTop: 10 }}>🔒 This is a demo checkout — no real payment is processed.</p>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1rem' }}>
              Place Order →
            </button>
          </form>

          {/* Order summary */}
          <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 16, padding: '1.5rem', height: 'fit-content', position: 'sticky', top: 90 }}>
            <h2 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1rem' }}>Order Summary</h2>
            <div style={{ borderBottom: '1px solid #1a1a1a', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ fontSize: 36 }}>🌌</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Cosmic Wanderer</div>
                  <div style={{ color: '#666', fontSize: 12 }}>Black · Size M · Qty 1</div>
                </div>
                <div style={{ marginLeft: 'auto', color: '#FF4D1C', fontWeight: 700 }}>$29.99</div>
              </div>
            </div>
            {[['Subtotal', '$29.99'], ['Shipping', '$4.99'], ['Tax', '$2.40']].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: '#666' }}>{l}</span>
                <span>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #1a1a1a', fontWeight: 800, fontSize: '1.05rem', marginTop: 4 }}>
              <span>Total</span>
              <span style={{ color: '#FF4D1C' }}>$37.38</span>
            </div>
            <div style={{ marginTop: '1rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '0.75rem', fontSize: 12, color: '#10B981' }}>
              🚀 Estimated delivery: <strong>72 hours</strong>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
