import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'How STYLX works: ordering, payment, printing, shipping, sizing, and cancellations.',
  alternates: { canonical: 'https://stylx.ai/faq' },
};

const FAQS: [string, string][] = [
  ['How does ordering work?', 'Design your shirt (or pick a catalog design), submit an order request, and our team reviews it for printability. Nothing is charged at submission - payment is confirmed only after your design is approved.'],
  ['When do I pay?', 'Only after your design passes review. The total you saw at checkout - including any volume discounts and print-location charges - is exactly what you pay, plus the flat shipping fee shown.'],
  ['Can I cancel?', 'Yes - while your request is in review you can cancel it yourself from your order page, free. After payment but before printing, contact us for a full refund. Once printing starts, custom items cannot be cancelled.'],
  ['What if my shirt arrives damaged or misprinted?', 'Send a photo within 14 days of delivery and we will reprint or refund it at no cost.'],
  ['What sizes do you offer?', 'Unisex XS through XXL, standard US fit. See the size guide, or let the studio recommend a size from your height and weight.'],
  ['Can I print on the back or sleeves?', 'Yes - the studio supports front, back, chest, and both sleeves. The front print is included in the base price; back and sleeve prints add a small per-shirt charge, shown before you submit.'],
  ['Do I keep the rights to my design?', 'Yes. Artwork and text you create stay yours - we only use them to print your order.'],
  ['Can I sell my own designs on STYLX?', 'Yes - register as an artist, upload designs, and earn 50% of the design price on every sale once approved.'],
  ['Do you ship outside the US?', 'US shipping only for now. Europe is planned next.'],
];

export default function FaqPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#050507,#060610)', color: '#fff' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '1.2rem', color: '#fff', textDecoration: 'none', letterSpacing: '0.05em' }}>STYLX<span style={{ color: '#00E5C8' }}>.</span></Link>
      </header>
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontWeight: 400, fontSize: '2.6rem', letterSpacing: '0.04em', margin: '0 0 24px' }}>Questions, answered</h1>
        <div style={{ display: 'grid', gap: 10 }}>
          {FAQS.map(([q, a]) => (
            <details key={q} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px', background: 'rgba(255,255,255,0.02)' }}>
              <summary style={{ fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer', color: 'rgba(255,255,255,0.88)' }}>{q}</summary>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.84rem', lineHeight: 1.7, margin: '10px 0 2px' }}>{a}</p>
            </details>
          ))}
        </div>
        <p style={{ marginTop: 26, color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem' }}>
          Something else? Reply to any STYLX email and a human answers. See also the <Link href="/size-guide" style={{ color: '#00E5C8', textDecoration: 'none' }}>size guide</Link> and <Link href="/legal/refunds" style={{ color: '#00E5C8', textDecoration: 'none' }}>refund policy</Link>.
        </p>
      </main>
    </div>
  );
}
