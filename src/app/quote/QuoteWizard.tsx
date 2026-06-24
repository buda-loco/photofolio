"use client";

import { useMemo, useState } from 'react';
import PageTransition from '@/components/PageTransition';
import { DISCIPLINES, ALL_ITEMS, itemCost, itemHours, CURRENCY } from '@/data/quoteCatalogue';

const fmt = (n: number) => Math.round(n).toLocaleString();
const STEPS = ['Work', 'Deliverables', 'Details', 'Review'];
const BUDGETS = ['Under $5k', '$5–10k', '$10–20k', '$20–40k', '$40k+', 'Not sure'];
const TIMELINES = ['ASAP', '1–2 months', '3–6 months', 'Flexible'];
const CONTACT = 'hello@benjaminarnedo.com';

export default function QuoteWizard() {
  const [step, setStep] = useState(0);
  const [disc, setDisc] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ name: '', email: '', company: '', budget: '', timeline: '', message: '', website: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const visibleDisciplines = useMemo(() => DISCIPLINES.filter((d) => disc.has(d.id)), [disc]);
  const chosen = useMemo(() => [...items].map((id) => ALL_ITEMS[id]).filter(Boolean), [items]);
  const total = useMemo(() => chosen.reduce((s, c) => s + itemCost(c.item), 0), [chosen]);
  const hours = useMemo(() => chosen.reduce((s, c) => s + itemHours(c.item), 0), [chosen]);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const canNext = [disc.size > 0, items.size > 0, form.name.trim() !== '' && emailOk, true][step];

  const toggle = (set: Set<string>, id: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    setter(next);
  };

  // De-select items whose discipline was removed.
  const toggleDiscipline = (id: string) => {
    const next = new Set(disc);
    if (next.has(id)) {
      next.delete(id);
      const stillVisible = new Set(DISCIPLINES.filter((d) => next.has(d.id)).flatMap((d) => d.items.map((i) => i.id)));
      setItems(new Set([...items].filter((i) => stillVisible.has(i))));
    } else next.add(id);
    setDisc(next);
  };

  const payload = () => ({
    name: form.name, email: form.email, company: form.company,
    budget: form.budget, timeline: form.timeline, message: form.message,
    website: form.website,
    disciplines: visibleDisciplines.map((d) => d.label),
    items: chosen.map((c) => ({ name: c.item.name, cost: itemCost(c.item) })),
    total, currency: CURRENCY,
  });

  const mailtoFallback = () => {
    const lines = [
      `Name: ${form.name}`, `Email: ${form.email}`, form.company && `Company: ${form.company}`,
      `Budget: ${form.budget || '—'} · Timeline: ${form.timeline || '—'}`, '',
      ...chosen.map((c) => `- ${c.item.name} (${CURRENCY} ${fmt(itemCost(c.item))})`),
      '', `Estimated total: ${CURRENCY} ${fmt(total)}`, form.message && `\n${form.message}`,
    ].filter(Boolean).join('\n');
    return `mailto:${CONTACT}?subject=${encodeURIComponent(`Quote request — ${form.name}`)}&body=${encodeURIComponent(lines)}`;
  };

  const submit = async () => {
    setStatus('sending');
    setErrorMsg('');
    try {
      const res = await fetch('/api/quote-submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload()) });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Could not send.');
      }
      setStatus('sent');
    } catch (e) {
      setErrorMsg((e as Error).message);
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <PageTransition>
        <div className="quote-page">
          <main className="qw-main">
            <div className="quote-card qw-done">
              <span className="label" style={{ color: 'var(--color-accent)' }}>Sent</span>
              <h1 className="display-md" style={{ marginTop: 'var(--sp-2)' }}>Thanks, {form.name.split(' ')[0]} — your quote is on its way.</h1>
              <p className="body-text">I’ve received your {CURRENCY} {fmt(total)} estimate ({chosen.length} deliverable{chosen.length === 1 ? '' : 's'}) and will reply to <b>{form.email}</b> shortly.</p>
              <a className="quote-cta" href="/">Back to site</a>
            </div>
          </main>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="quote-page">
        <header className="quote-header">
          <span className="label quote-eyebrow">Quote builder</span>
          <h1 className="display-xl quote-title">Build your quote</h1>
          <p className="body-text quote-lead">
            Tell me what you need and get a transparent, itemised estimate in a minute — any kind of design work. Submit it and I’ll be in touch.
          </p>
        </header>

        <main className="qw-main">
          {/* Progress */}
          <div className="qw-progress">
            {STEPS.map((s, i) => (
              <button key={s} className="qw-progress-step" data-state={i === step ? 'current' : i < step ? 'done' : 'todo'} onClick={() => i < step && setStep(i)} disabled={i > step}>
                <span className="qw-progress-dot">{i < step ? '✓' : i + 1}</span>
                <span className="qw-progress-label">{s}</span>
              </button>
            ))}
          </div>

          <div className="quote-card qw-card">
            {/* Step 0 — Work */}
            {step === 0 && (
              <div className="qw-step">
                <h2 className="display-md">What kind of work?</h2>
                <p className="quote-section-sub">Pick everything that applies — you’ll choose specific deliverables next.</p>
                <div className="qw-chip-grid">
                  {DISCIPLINES.map((d) => (
                    <button key={d.id} className="qw-chip" data-active={disc.has(d.id)} onClick={() => toggleDiscipline(d.id)}>
                      <span className="qw-chip-label">{d.label}</span>
                      <span className="qw-chip-blurb">{d.blurb}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1 — Deliverables */}
            {step === 1 && (
              <div className="qw-step">
                <h2 className="display-md">Pick your deliverables</h2>
                <p className="quote-section-sub">Toggle what you want. The estimate updates live.</p>
                {visibleDisciplines.map((d) => (
                  <div key={d.id} className="quote-phase">
                    <span className="label quote-subhead">{d.label}</span>
                    <ul className="quote-list">
                      {d.items.map((it) => {
                        const on = items.has(it.id);
                        return (
                          <li key={it.id} className="quote-item qw-pick" data-scope={on ? 'in' : 'out'} onClick={() => toggle(items, it.id, setItems)}>
                            <span className={`qw-check ${on ? 'on' : ''}`}>{on ? '✓' : ''}</span>
                            <span className="quote-item-name">{it.name}{it.desc && <em className="qw-desc"> — {it.desc}</em>}</span>
                            <span className="quote-item-hours">{it.pricing === 'fixed' ? 'Fixed' : `${it.hours}h`}</span>
                            <span className="quote-item-cost" style={{ color: on ? 'var(--color-accent)' : undefined }}>${fmt(itemCost(it))}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Step 2 — Details */}
            {step === 2 && (
              <div className="qw-step">
                <h2 className="display-md">Your details</h2>
                <p className="quote-section-sub">So I can send the quote back to you.</p>
                <div className="qw-form">
                  <label className="qw-field"><span>Name *</span><input className="qw-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
                  <label className="qw-field"><span>Email *</span><input className="qw-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-ok={form.email === '' || emailOk} /></label>
                  <label className="qw-field"><span>Company</span><input className="qw-input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></label>
                  <label className="qw-field"><span>Budget</span>
                    <select className="qw-input" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })}>
                      <option value="">Select…</option>{BUDGETS.map((b) => <option key={b}>{b}</option>)}
                    </select>
                  </label>
                  <label className="qw-field"><span>Timeline</span>
                    <select className="qw-input" value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })}>
                      <option value="">Select…</option>{TIMELINES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </label>
                  <label className="qw-field qw-field-full"><span>Anything else?</span><textarea className="qw-input" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></label>
                  {/* honeypot */}
                  <input className="qw-hp" tabIndex={-1} autoComplete="off" aria-hidden value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
                </div>
              </div>
            )}

            {/* Step 3 — Review */}
            {step === 3 && (
              <div className="qw-step">
                <h2 className="display-md">Review &amp; send</h2>
                <p className="quote-section-sub">{chosen.length} deliverable{chosen.length === 1 ? '' : 's'} · {hours} hrs of work</p>
                <ul className="quote-list qw-summary">
                  {chosen.map((c) => (
                    <li key={c.item.id} className="quote-item" data-scope="in">
                      <span className="quote-item-name">{c.item.name} <em className="qw-desc">· {c.discipline.label}</em></span>
                      <span className="quote-item-cost" style={{ color: 'var(--color-accent)' }}>${fmt(itemCost(c.item))}</span>
                    </li>
                  ))}
                </ul>
                <div className="qw-total">
                  <span>Estimated total</span>
                  <b>${fmt(total)} <small>{CURRENCY}</small></b>
                </div>
                <p className="quote-fineprint">{form.name} · {form.email}{form.company ? ` · ${form.company}` : ''} · Budget {form.budget || '—'} · {form.timeline || '—'}</p>
                {status === 'error' && (
                  <p className="qw-error">Couldn’t send ({errorMsg}). <a href={mailtoFallback()}>Email it to me directly →</a></p>
                )}
              </div>
            )}

            {/* Nav */}
            <div className="qw-nav">
              <button className="qw-back" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || status === 'sending'}>Back</button>
              {step < 3 ? (
                <button className="quote-cta" onClick={() => canNext && setStep((s) => s + 1)} disabled={!canNext} data-disabled={!canNext}>Continue</button>
              ) : (
                <button className="quote-cta" onClick={submit} disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Send quote request'}</button>
              )}
            </div>
          </div>

          {/* Running total rail (steps 1–3) */}
          {step >= 1 && (
            <div className="qw-rail">
              <span className="label">Running estimate</span>
              <span className="qw-rail-total">${fmt(total)} <small>{CURRENCY}</small></span>
              <span className="qw-rail-sub">{chosen.length} item{chosen.length === 1 ? '' : 's'} · {hours} hrs</span>
            </div>
          )}
        </main>
      </div>
    </PageTransition>
  );
}
