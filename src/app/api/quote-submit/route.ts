import { Resend } from 'resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body {
  name?: string;
  email?: string;
  company?: string;
  budget?: string;
  timeline?: string;
  message?: string;
  disciplines?: string[];
  items?: { name: string; cost: number }[];
  total?: number;
  currency?: string;
  website?: string; // honeypot — bots fill this; humans never see it
}

const esc = (s = '') => String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]!));

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Bad request' }, { status: 400 });
  }

  // Honeypot: pretend success so bots don't learn anything.
  if (body.website) return Response.json({ ok: true });

  const name = (body.name ?? '').trim();
  const email = (body.email ?? '').trim();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'A valid name and email are required.' }, { status: 400 });
  }

  const key = process.env.RESEND_API_KEY;
  const to = process.env.QUOTE_TO_EMAIL || 'hello@benjaminarnedo.com';
  const from = process.env.QUOTE_FROM_EMAIL || 'Quote Builder <onboarding@resend.dev>';
  // Not configured yet → tell the client so it can fall back to a mailto.
  if (!key) return Response.json({ error: 'Email is not configured yet.' }, { status: 503 });

  const cur = body.currency || 'AUD';
  const items = Array.isArray(body.items) ? body.items : [];
  const rows = items.map((i) => `<tr><td style="padding:4px 12px 4px 0">${esc(i.name)}</td><td style="padding:4px 0;text-align:right">${cur} ${Math.round(i.cost).toLocaleString()}</td></tr>`).join('');

  const html = `
    <div style="font-family:system-ui,sans-serif;color:#111;max-width:560px">
      <h2 style="margin:0 0 4px">New quote request — ${esc(name)}</h2>
      <p style="margin:0 0 16px;color:#555">${esc(email)}${body.company ? ` · ${esc(body.company)}` : ''}</p>
      <p style="margin:0 0 4px"><b>Disciplines:</b> ${esc((body.disciplines ?? []).join(', ')) || '—'}</p>
      <p style="margin:0 0 4px"><b>Budget:</b> ${esc(body.budget || '—')} &nbsp; <b>Timeline:</b> ${esc(body.timeline || '—')}</p>
      ${body.message ? `<p style="margin:12px 0;padding:12px;background:#f5f5f5;border-radius:8px">${esc(body.message)}</p>` : ''}
      <table style="border-collapse:collapse;margin:12px 0;width:100%">${rows}
        <tr><td style="padding:8px 12px 0 0;border-top:1px solid #ddd"><b>Estimated total</b></td><td style="padding:8px 0 0;text-align:right;border-top:1px solid #ddd"><b>${cur} ${Math.round(body.total ?? 0).toLocaleString()}</b></td></tr>
      </table>
      <p style="color:#888;font-size:12px">Sent from the self-serve quote builder.</p>
    </div>`;

  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: `New quote — ${name}${body.company ? ` (${body.company})` : ''}`,
      html,
    });
    if (error) return Response.json({ error: error.message }, { status: 502 });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: (e as Error)?.message ?? 'Send failed' }, { status: 502 });
  }
}
