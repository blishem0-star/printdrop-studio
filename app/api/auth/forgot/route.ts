import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimit';
import { sendEmail, siteUrl } from '@/lib/email';

// Always responds success so the endpoint can't be used to probe which
// emails have accounts. The reset link goes out only via email.
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  if (!rateLimit(`forgot:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ ok: true }); // same shape - no signal for abusers
  }
  let email = '';
  try { email = String((await req.json()).email ?? '').toLowerCase().trim(); } catch { /* fall through */ }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: true });

  const customer = await prisma.customer.findUnique({ where: { email }, select: { id: true, name: true, password: true } });
  if (customer?.password) {
    const reset = await prisma.passwordReset.create({
      data: { customerId: customer.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });
    const link = `${siteUrl()}/reset?token=${reset.token}`;
    sendEmail(email, 'Reset your STYLX password', `<!doctype html><html><body style="margin:0;padding:0;background:#07070a;font-family:Arial,sans-serif"><div style="max-width:560px;margin:0 auto;padding:32px 20px"><div style="font-size:22px;font-weight:800;letter-spacing:0.08em;color:#fff;margin-bottom:22px">STYLX<span style="color:#00E5C8">.</span></div><div style="background:#101016;border:1px solid #23232e;border-radius:14px;padding:26px 24px;color:#d7d7e0"><div style="font-size:18px;font-weight:800;color:#fff;margin-bottom:12px">Reset your password</div><p style="font-size:14px;line-height:1.7;margin:0 0 16px">Hi ${customer.name.split(' ')[0]}, tap the button below to choose a new password. The link works once and expires in 1 hour. If you did not ask for this, you can ignore this email.</p><a href="${link}" style="display:inline-block;background:#00E5C8;color:#050507;font-weight:800;font-size:14px;text-decoration:none;padding:12px 22px;border-radius:10px">Choose a new password</a></div></div></body></html>`).catch(() => null);
  }
  return NextResponse.json({ ok: true });
}
