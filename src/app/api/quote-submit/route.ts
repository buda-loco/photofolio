import { Resend } from 'resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Line {
  discipline?: string;
  name?: string;
  spec?: string;
  hours?: number;
  cost?: number;
}

interface Body {
  name?: string;
  locale?: string;
  region?: string;
  email?: string;
  company?: string;
  timeline?: string;
  message?: string;
  quoteNumber?: string;
  validUntil?: string;
  total?: number;
  deposit?: number;
  hours?: number;
  hasPoa?: boolean;
  currency?: string;
  options?: {
    turnaround?: string;
    travel?: string;
    licence?: string;
    extraRevisions?: number;
    sourceFiles?: boolean;
  };
  lines?: Line[];
  charges?: Record<string, number>;
  website?: string; // honeypot — bots fill this; humans never see it
}

const esc = (s: unknown = '') =>
  String(s ?? '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]!));

const symbolFor = (currency?: string) => (currency === 'USD' ? 'US$' : '$');
const fmt = (n: unknown, sym: string) => `${sym}${Math.round(Number(n) || 0).toLocaleString()}`;

const CHARGE_LABELS: Record<string, Record<string, string>> = {
  en: {
    itemFees: 'Equipment & hire',
    revisions: 'Extra revision rounds',
    rush: 'Rush fee',
    travelLabour: 'Travel time',
    travelExpenses: 'Travel expenses',
    licence: 'Usage licence',
    sourceFiles: 'Working files released',
  },
  es: {
    itemFees: 'Equipamiento y alquileres',
    revisions: 'Rondas de revisión extra',
    rush: 'Recargo por urgencia',
    travelLabour: 'Tiempo de viaje',
    travelExpenses: 'Gastos de viaje',
    licence: 'Licencia de uso',
    sourceFiles: 'Entrega de archivos editables',
  },
};

/** Client-facing wording. The internal copy to Benjamin stays in English. */
const CLIENT_COPY = {
  en: {
    subject: (ref: string) => `Your quote${ref} — Benjamin Arnedo`,
    heading: (ref: string) => `Your quote${ref}`,
    intro: (first: string, until: string) =>
      `Thanks ${first} — here's a copy of the quote you just built.${until ? ` It's valid until ${until}.` : ''} I'll be in touch shortly to talk it through.`,
    total: 'Total',
    deposit: '50% deposit to book',
    poa: 'Some items are POA and will be confirmed once the details are settled.',
    terms: '2 rounds of revisions are included. A 50% deposit confirms the booking, with the balance due on delivery. This is a quote, not an invoice.',
  },
  es: {
    subject: (ref: string) => `Tu presupuesto${ref} — Benjamin Arnedo`,
    heading: (ref: string) => `Tu presupuesto${ref}`,
    intro: (first: string, until: string) =>
      `Gracias ${first} — acá va una copia del presupuesto que armaste.${until ? ` Es válido hasta el ${until}.` : ''} Te escribo en breve para charlarlo.`,
    total: 'Total',
    deposit: '50% de anticipo para reservar',
    poa: 'Algunos ítems figuran a consultar y se confirman una vez definidos los detalles.',
    terms: 'Incluye 2 rondas de revisión. Un anticipo del 50% confirma la reserva y el saldo se abona contra entrega. Esto es un presupuesto, no una factura.',
  },
};

const langOf = (body: Body) => (body.locale?.startsWith('es') ? 'es' : 'en');

/** The scope table, shared by both emails. */
function scopeTable(body: Body, cur: string) {
  const labels = CHARGE_LABELS[langOf(body)];
  const L = CLIENT_COPY[langOf(body)];
  const sym = symbolFor(body.currency);
  const money = (n: unknown) => fmt(n, sym);
  const lines = Array.isArray(body.lines) ? body.lines : [];
  const rows = lines
    .map(
      (l) => `<tr>
        <td style="padding:6px 12px 6px 0;border-top:1px solid #eee">
          <b>${esc(l.name)}</b>
          <div style="color:#888;font-size:12px">${esc(l.discipline)}${l.spec ? ` · ${esc(l.spec)}` : ''}</div>
        </td>
        <td style="padding:6px 0;text-align:right;border-top:1px solid #eee;white-space:nowrap">${money(l.cost)}</td>
      </tr>`,
    )
    .join('');

  const charges = Object.entries(body.charges ?? {})
    .filter(([, v]) => Number(v) > 0)
    .map(
      ([k, v]) => `<tr>
        <td style="padding:6px 12px 6px 0;border-top:1px solid #eee;color:#555">${esc(labels[k] ?? k)}</td>
        <td style="padding:6px 0;text-align:right;border-top:1px solid #eee">${money(v)}</td>
      </tr>`,
    )
    .join('');

  return `<table style="border-collapse:collapse;width:100%;margin:16px 0;font-size:14px">
    ${rows}${charges}
    <tr>
      <td style="padding:10px 12px 0 0;border-top:2px solid #111"><b>${esc(L.total)} (${esc(cur)})</b></td>
      <td style="padding:10px 0 0;text-align:right;border-top:2px solid #111"><b>${money(body.total)}</b></td>
    </tr>
    <tr>
      <td style="padding:4px 12px 0 0;color:#888;font-size:13px">${esc(L.deposit)}</td>
      <td style="padding:4px 0 0;text-align:right;color:#888;font-size:13px">${money(body.deposit)}</td>
    </tr>
  </table>`;
}

function conditions(body: Body) {
  const o = body.options ?? {};
  const bits = [
    o.turnaround && `Turnaround: ${o.turnaround}`,
    o.travel && `Location: ${o.travel}`,
    o.licence && o.licence !== 'n/a' && `Licence: ${o.licence}`,
    o.extraRevisions ? `+${o.extraRevisions} revision round(s)` : null,
    o.sourceFiles ? 'Working files included' : null,
  ].filter(Boolean);
  return bits.length ? `<p style="margin:0 0 4px;color:#555;font-size:13px">${esc(bits.join(' · '))}</p>` : '';
}

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
  const ref = body.quoteNumber ? ` ${body.quoteNumber}` : '';
  const table = scopeTable(body, cur);
  const conds = conditions(body);
  const L = CLIENT_COPY[langOf(body)];
  const clientPoa = body.hasPoa
    ? `<p style="margin:8px 0;padding:10px;background:#f6f6f4;border-radius:8px;font-size:13px;color:#555">${esc(L.poa)}</p>`
    : '';
  const internalPoa = body.hasPoa
    ? `<p style="margin:8px 0;padding:10px;background:#f6f6f4;border-radius:8px;font-size:13px;color:#555">${esc(CLIENT_COPY.en.poa)}</p>`
    : '';
  const origin = body.region === 'ar' ? 'benjaminarnedo.com/cotizacion (es-AR · USD)' : 'benjaminarnedo.com/quote';

  const internal = `
    <div style="font-family:system-ui,sans-serif;color:#111;max-width:620px">
      <h2 style="margin:0 0 4px">New quote${esc(ref)} — ${esc(name)}</h2>
      <p style="margin:0 0 12px;color:#555">${esc(email)}${body.company ? ` · ${esc(body.company)}` : ''}${body.timeline ? ` · needs it ${esc(body.timeline)}` : ''}</p>
      ${conds}
      <p style="margin:0 0 4px;color:#555;font-size:13px">${Math.round(Number(body.hours) || 0)} hrs total${body.validUntil ? ` · valid until ${esc(body.validUntil)}` : ''}</p>
      ${body.message ? `<p style="margin:12px 0;padding:12px;background:#f5f5f5;border-radius:8px">${esc(body.message)}</p>` : ''}
      ${table}
      ${internalPoa}
      <p style="color:#888;font-size:12px">Sent from the quote builder at ${esc(origin)}</p>
    </div>`;

  // The client's copy follows the language of the page they used.
  const confirmation = `
    <div style="font-family:system-ui,sans-serif;color:#111;max-width:620px" lang="${esc(body.locale || 'en')}">
      <h2 style="margin:0 0 4px">${esc(L.heading(ref))}</h2>
      <p style="margin:0 0 16px;color:#555">${esc(L.intro(name.split(' ')[0], body.validUntil ?? ''))}</p>
      ${table}
      ${clientPoa}
      <p style="font-size:13px;color:#555">${esc(L.terms)}</p>
      <p style="color:#888;font-size:12px">Benjamin Arnedo · ${esc(to)} · benjaminarnedo.com</p>
    </div>`;

  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: `New quote${ref} — ${name}${body.company ? ` (${body.company})` : ''} · ${fmt(body.total, symbolFor(body.currency))} ${cur}`,
      html: internal,
    });
    if (error) return Response.json({ error: error.message }, { status: 502 });

    // The client's copy is a nicety — if it bounces (unverified sending domain,
    // for instance) the enquiry has still landed, so don't fail the request.
    try {
      await resend.emails.send({
        from,
        to: email,
        replyTo: to,
        subject: L.subject(ref),
        html: confirmation,
      });
    } catch { /* the internal copy already went through */ }

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: (e as Error)?.message ?? 'Send failed' }, { status: 502 });
  }
}
