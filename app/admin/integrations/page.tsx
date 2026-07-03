import Link from 'next/link';
import type React from 'react';
import { getIntegrations, integrationScore, type IntegrationStatus } from '@/lib/integrations';

export const dynamic = 'force-dynamic';

const STATUS_META: Record<IntegrationStatus, { label: string; color: string; bg: string }> = {
  live: { label: 'Live ready', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  configured: { label: 'Configured', color: '#00E5C8', bg: 'rgba(0,229,200,0.1)' },
  missing: { label: 'Ready to connect', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
};

const iconStyle = {
  width: 42,
  height: 42,
  borderRadius: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
} satisfies React.CSSProperties;

function IntegrationIcon({ name }: { name: string }) {
  if (name === 'OpenAI') {
    return <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l7 4v8l-7 4-7-4V7z"/><path d="M12 7v10M8.5 9l7 4M15.5 9l-7 4"/></svg>;
  }
  if (name === 'Stripe') {
    return <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="6" width="16" height="12" rx="2"/><path d="M4 10h16M8 15h4"/></svg>;
  }
  return <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8l9-5 9 5-9 5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>;
}

export default function AdminIntegrationsPage() {
  const integrations = getIntegrations();
  const score = integrationScore(integrations);
  const liveCount = integrations.filter(i => i.status === 'live').length;
  const configuredCount = integrations.filter(i => i.status === 'configured').length;
  const laterCount = integrations.filter(i => i.status === 'missing').length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: '0.62rem', fontWeight: 900, color: '#00E5C8', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>Operations center</div>
          <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '2.25rem', fontWeight: 400, letterSpacing: '0.05em', lineHeight: 1 }}>Integrations</h1>
          <p style={{ color: 'rgba(255,255,255,0.42)', fontSize: '0.82rem', marginTop: 5, maxWidth: 720 }}>
            External services are mapped for the next phase. The site can stay clean and production-ready now, then connect AI, payments, and fulfillment when you decide.
          </p>
        </div>
        <Link href="/admin" style={{ padding: '9px 13px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.58)', textDecoration: 'none', fontSize: '0.76rem', fontWeight: 800, background: 'rgba(255,255,255,0.03)' }}>Back to overview</Link>
      </div>

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 0.9fr) minmax(360px, 1.6fr)', gap: 14, marginBottom: 18 }}>
        <div style={{ borderRadius: 18, border: '1px solid rgba(0,229,200,0.16)', background: 'linear-gradient(145deg,rgba(0,229,200,0.09),rgba(255,255,255,0.025))', padding: 18, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 82% 0%,rgba(0,153,255,0.18),transparent 45%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.42)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Build readiness</div>
            <div style={{ display: 'flex', alignItems: 'end', gap: 8, marginTop: 8 }}>
              <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '4.2rem', lineHeight: 0.9, color: '#00E5C8' }}>{score}</div>
              <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: '0.9rem', fontWeight: 900, marginBottom: 8 }}>/100</div>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginTop: 12 }}>
              <div style={{ width: `${score}%`, height: '100%', background: 'linear-gradient(90deg,#00E5C8,#0099FF)', borderRadius: 999 }} />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', lineHeight: 1.55, marginTop: 14 }}>
              Integration plans are documented and isolated from the customer experience. Connect keys later without redesigning the site.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {[
            { label: 'Live', value: liveCount, color: '#10B981' },
            { label: 'Configured', value: configuredCount, color: '#00E5C8' },
            { label: 'Connect later', value: laterCount, color: '#F59E0B' },
          ].map(s => (
            <div key={s.label} style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.025)', padding: 16 }}>
              <div style={{ fontSize: '0.58rem', fontWeight: 900, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '2.4rem', color: s.color, lineHeight: 1, marginTop: 10 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ display: 'grid', gap: 14 }}>
        {integrations.map(integration => {
          const meta = STATUS_META[integration.status];
          return (
            <section key={integration.key} style={{ borderRadius: 18, border: `1px solid ${integration.accent}26`, background: 'rgba(255,255,255,0.025)', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px,0.95fr) minmax(320px,1.35fr)', gap: 0 }}>
                <div style={{ padding: 18, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                    <div style={{ ...iconStyle, background: `${integration.accent}14`, border: `1px solid ${integration.accent}35`, color: integration.accent }}>
                      <IntegrationIcon name={integration.name} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1rem', fontWeight: 950, color: 'rgba(255,255,255,0.88)' }}>{integration.name}</h2>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, padding: '4px 9px', borderRadius: 999, color: meta.color, background: meta.bg, border: `1px solid ${meta.color}33`, fontSize: '0.58rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        <span style={{ width: 6, height: 6, borderRadius: 999, background: meta.color }} />{meta.label}
                      </span>
                    </div>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', lineHeight: 1.6, marginTop: 14 }}>{integration.tagline}</p>

                  <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
                    {integration.env.map(env => (
                      <div key={env.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.16)' }}>
                        <code style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.68)' }}>{env.key}</code>
                        <span style={{ color: env.present ? '#10B981' : '#F59E0B', fontSize: '0.6rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{env.present ? 'Present' : 'Later'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 950, color: 'rgba(255,255,255,0.36)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 9 }}>Capabilities</div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {integration.capabilities.map(item => (
                        <div key={item} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', color: 'rgba(255,255,255,0.68)', fontSize: '0.76rem', lineHeight: 1.45 }}>
                          <span style={{ width: 16, height: 16, borderRadius: 999, background: `${integration.accent}12`, border: `1px solid ${integration.accent}32`, color: integration.accent, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                            <svg viewBox="0 0 12 12" width={10} height={10} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 6.5l2 2 5-5"/></svg>
                          </span>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 950, color: 'rgba(255,255,255,0.36)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 9 }}>Next build steps</div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {integration.nextSteps.map((item, index) => (
                        <div key={item} style={{ display: 'grid', gridTemplateColumns: '22px 1fr', gap: 8, color: 'rgba(255,255,255,0.58)', fontSize: '0.76rem', lineHeight: 1.45 }}>
                          <span style={{ width: 22, height: 22, borderRadius: 8, background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.07)', color: integration.accent, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 950 }}>{index + 1}</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <section style={{ marginTop: 18, borderRadius: 18, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.025)', padding: 18 }}>
        <div style={{ fontSize: '0.62rem', fontWeight: 950, color: '#00E5C8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Build rule</div>
        <p style={{ color: 'rgba(255,255,255,0.56)', fontSize: '0.82rem', lineHeight: 1.65, maxWidth: 920 }}>
          Keep the product experience complete without external dependencies. When the site flow is final, connect Stripe for payment confirmation, Printify for fulfillment, and OpenAI through protected server routes only.
        </p>
      </section>
    </div>
  );
}
