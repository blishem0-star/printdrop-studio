import type { OrderStatus } from '@/lib/types';

// Real transactional email via the Resend HTTP API (no SDK dependency).
// When RESEND_API_KEY is missing nothing is faked: send() reports
// {sent:false, reason:'not_configured'} and callers/admin surface that state.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function fromAddress() {
  return process.env.EMAIL_FROM?.trim() || 'STYLX <onboarding@resend.dev>';
}

export type SendResult = { sent: true; id: string | null } | { sent: false; reason: string };

export async function sendEmail(to: string, subject: string, html: string): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return { sent: false, reason: 'not_configured' };
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromAddress(), to: [to], subject, html }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error(`[email] send failed ${res.status}: ${detail.slice(0, 300)}`);
      return { sent: false, reason: `provider_${res.status}` };
    }
    const data = (await res.json().catch(() => null)) as { id?: string } | null;
    return { sent: true, id: data?.id ?? null };
  } catch (e) {
    console.error('[email] network error', e);
    return { sent: false, reason: 'network_error' };
  }
}

// --- Templates -------------------------------------------------------------

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

function shell(title: string, bodyHtml: string) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#07070a;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="font-size:22px;font-weight:800;letter-spacing:0.08em;color:#ffffff;margin-bottom:22px">STYLX<span style="color:#00E5C8">.</span></div>
    <div style="background:#101016;border:1px solid #23232e;border-radius:14px;padding:26px 24px;color:#d7d7e0">
      <div style="font-size:18px;font-weight:800;color:#ffffff;margin-bottom:12px">${esc(title)}</div>
      ${bodyHtml}
    </div>
    <div style="font-size:11px;color:#5a5a66;margin-top:18px;line-height:1.6">You are receiving this email because an order request was placed at STYLX with this address. Questions? Just reply to this email.</div>
  </div>
</body></html>`;
}

const row = (label: string, value: string) =>
  `<tr><td style="padding:6px 0;color:#8a8a96;font-size:13px">${esc(label)}</td><td style="padding:6px 0;color:#e8e8f0;font-size:13px;font-weight:700;text-align:right">${esc(value)}</td></tr>`;

export type OrderEmailData = {
  orderId: string;
  customerName: string;
  colorName: string;
  size: string;
  total: number;
  siteUrl?: string;
};

export function orderReceivedEmail(d: OrderEmailData) {
  const ref = d.orderId.slice(0, 8).toUpperCase();
  const link = `${d.siteUrl ?? ''}/orders/${d.orderId}`;
  return {
    subject: `We got your order request #${ref}`,
    html: shell(`Thanks, ${d.customerName.split(' ')[0]}! Your request is in.`, `
      <p style="font-size:14px;line-height:1.7;margin:0 0 16px">We received your custom shirt request and our team is reviewing it. <strong style="color:#00E5C8">No payment has been taken</strong> - we only confirm payment after your design is approved for production.</p>
      <table style="width:100%;border-collapse:collapse;border-top:1px solid #23232e;border-bottom:1px solid #23232e;margin-bottom:18px">
        ${row('Request', `#${ref}`)}
        ${row('Shirt', `${d.colorName} / ${d.size}`)}
        ${row('Total (on approval)', `$${d.total.toFixed(2)}`)}
      </table>
      <a href="${link}" style="display:inline-block;background:#00E5C8;color:#050507;font-weight:800;font-size:14px;text-decoration:none;padding:12px 22px;border-radius:10px">Track your request</a>
    `),
  };
}

const STATUS_EMAIL_COPY: Partial<Record<OrderStatus, { subject: string; title: string; body: string }>> = {
  PAID: {
    subject: 'Payment confirmed - your shirt is queued',
    title: 'Payment confirmed',
    body: 'Your payment is confirmed and your shirt is queued for production. We will email you again the moment it moves.',
  },
  IN_PRODUCTION: {
    subject: 'Your shirt is being printed',
    title: 'In production',
    body: 'Your design is on the press right now. Printing and quality checks typically take a few business days.',
  },
  SHIPPED: {
    subject: 'Your shirt is on the way',
    title: 'Shipped!',
    body: 'Your order has left the facility and is on its way to your address.',
  },
  DELIVERED: {
    subject: 'Delivered - enjoy your shirt',
    title: 'Delivered',
    body: 'Your order was marked as delivered. We would love to see it on you - reply with a photo or share your design link with friends.',
  },
  CANCELLED: {
    subject: 'Your order request was cancelled',
    title: 'Request cancelled',
    body: 'This order request was cancelled. No payment was taken. If this is a mistake, just reply to this email.',
  },
};

export function orderStatusEmail(status: OrderStatus, d: OrderEmailData) {
  const copy = STATUS_EMAIL_COPY[status];
  if (!copy) return null;
  const ref = d.orderId.slice(0, 8).toUpperCase();
  const link = `${d.siteUrl ?? ''}/orders/${d.orderId}`;
  return {
    subject: `${copy.subject} (#${ref})`,
    html: shell(copy.title, `
      <p style="font-size:14px;line-height:1.7;margin:0 0 16px">${esc(copy.body)}</p>
      <table style="width:100%;border-collapse:collapse;border-top:1px solid #23232e;border-bottom:1px solid #23232e;margin-bottom:18px">
        ${row('Order', `#${ref}`)}
        ${row('Shirt', `${d.colorName} / ${d.size}`)}
      </table>
      <a href="${link}" style="display:inline-block;background:#00E5C8;color:#050507;font-weight:800;font-size:14px;text-decoration:none;padding:12px 22px;border-radius:10px">View order status</a>
    `),
  };
}

export function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, '') || 'http://localhost:3000';
}
