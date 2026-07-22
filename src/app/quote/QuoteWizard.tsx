"use client";

// Self-serve quote builder at /quote.
//
// Five steps: pick disciplines → configure the actual deliverables → set the
// project conditions → leave your details → get a real quote document you can
// print, save as PDF, share as a link, or send over.
//
// Pricing lives entirely in lib/quotePricing.ts; the catalogue in
// data/quoteCatalogue.ts. This file is UI only.

import { useCallback, useEffect, useMemo, useState } from 'react';
import PageTransition from '@/components/PageTransition';
import QuoteDocument, { type QuoteMeta } from './QuoteDocument';
import {
  DISCIPLINES, ALL_ITEMS, PRICING, RATES, RATE_LABELS, CURRENCY, CONTACT_EMAIL,
  TURNAROUND, TRAVEL, LICENCES, QUOTE_VALID_DAYS,
} from '@/data/quoteCatalogue';
import {
  priceItem, priceQuote, defaultValues, encodeState, decodeState, clamp, plural,
  type CatalogItem, type Param, type ParamValues, type ProjectOptions, type QuoteLine, type Selection,
} from '@/lib/quotePricing';

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
const hrs = (n: number) => `${Math.round(n * 10) / 10}h`;

const STEPS = ['Work', 'Scope', 'Project', 'Details', 'Quote'];

const DEFAULT_OPTIONS: ProjectOptions = {
  turnaround: 'standard',
  travel: 'local',
  licence: 'organic',
  extraRevisions: 0,
  sourceFiles: false,
};

const dateFmt = (d: Date) =>
  d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

export default function QuoteWizard() {
  const [step, setStep] = useState(0);
  const [disciplines, setDisciplines] = useState<Set<string>>(new Set());
  const [selection, setSelection] = useState<Selection>({});
  const [options, setOptions] = useState<ProjectOptions>(DEFAULT_OPTIONS);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ name: '', email: '', company: '', timeline: '', message: '', website: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [meta, setMeta] = useState<QuoteMeta | null>(null);
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');

  /* ── Restore from a share link, once, after mount ──
     Deliberately client-only: reading location during render would desync
     the server-rendered markup. */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q');
    if (!q) return;
    const decoded = decodeState(q);
    if (!decoded) return;

    const valid: Selection = {};
    for (const [id, values] of Object.entries(decoded.s ?? {})) {
      if (ALL_ITEMS[id]) valid[id] = values;
    }
    if (!Object.keys(valid).length) return;

    setSelection(valid);
    setDisciplines(new Set(Object.keys(valid).map((id) => ALL_ITEMS[id].discipline.id)));
    setOptions({ ...DEFAULT_OPTIONS, ...(decoded.o ?? {}) });
    setStep(1);
  }, []);

  /* ── Quote identity — generated on the client so SSR stays deterministic ── */
  useEffect(() => {
    const now = new Date();
    const until = new Date(now.getTime() + QUOTE_VALID_DAYS * 86_400_000);
    const stamp = `${now.getFullYear()}`.slice(2)
      + `${now.getMonth() + 1}`.padStart(2, '0')
      + `${now.getDate()}`.padStart(2, '0');
    const suffix = Math.floor(1000 + Math.random() * 9000);
    setMeta({ number: `BA-${stamp}-${suffix}`, issued: dateFmt(now), validUntil: dateFmt(until) });
  }, []);

  /* ── Derived pricing ── */
  const lines: QuoteLine[] = useMemo(
    () =>
      Object.entries(selection)
        .map(([id, values]) => {
          const entry = ALL_ITEMS[id];
          if (!entry) return null;
          return {
            item: entry.item,
            discipline: entry.discipline,
            values,
            breakdown: priceItem(entry.item, values, RATES),
          };
        })
        .filter((l): l is QuoteLine => l !== null)
        // Keep the catalogue's order so the quote reads consistently.
        .sort((a, b) => Object.keys(ALL_ITEMS).indexOf(a.item.id) - Object.keys(ALL_ITEMS).indexOf(b.item.id)),
    [selection],
  );

  const totals = useMemo(() => priceQuote(lines, options, PRICING), [lines, options]);
  const anyLicensable = lines.some((l) => l.item.licensable);
  const anyOnLocation = lines.some((l) => l.item.onLocation);
  const selectedCount = lines.length;

  /* ── Mutations ── */
  // All of these use functional updates: two toggles dispatched in the same
  // tick must not read the same stale snapshot and clobber each other.
  const toggleDiscipline = (id: string) => {
    setDisciplines((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    // Drop any selected items belonging to a discipline that's been removed.
    setSelection((sel) =>
      disciplines.has(id)
        ? Object.fromEntries(Object.entries(sel).filter(([itemId]) => ALL_ITEMS[itemId]?.discipline.id !== id))
        : sel,
    );
  };

  const toggleItem = (item: CatalogItem) => {
    const wasSelected = !!selection[item.id];
    setSelection((sel) => {
      if (sel[item.id]) {
        const { [item.id]: _removed, ...rest } = sel;
        return rest;
      }
      return { ...sel, [item.id]: defaultValues(item) };
    });
    // Opening the params on selection makes the parametrisation discoverable.
    setExpanded((e) => {
      const next = new Set(e);
      if (wasSelected) next.delete(item.id);
      else if ((item.params?.length ?? 0) > 0) next.add(item.id);
      return next;
    });
  };

  const setParam = (itemId: string, paramId: string, value: number | string | boolean) =>
    setSelection((sel) => (sel[itemId] ? { ...sel, [itemId]: { ...sel[itemId], [paramId]: value } } : sel));

  /* ── Share link ── */
  const share = useCallback(async () => {
    const url = `${window.location.origin}${window.location.pathname}?q=${encodeState(selection, options)}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareState('copied');
      setTimeout(() => setShareState('idle'), 2000);
    } catch {
      // Clipboard blocked (insecure context / permissions) — show it instead so
      // the link is never simply lost.
      window.prompt('Copy your quote link:', url);
    }
  }, [selection, options]);

  /* ── Submit ── */
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const canAdvance = [disciplines.size > 0, selectedCount > 0, true, form.name.trim() !== '' && emailOk, true][step];

  const payload = () => ({
    ...form,
    currency: CURRENCY,
    quoteNumber: meta?.number ?? '',
    validUntil: meta?.validUntil ?? '',
    total: totals.total,
    deposit: totals.deposit,
    hours: totals.hours + totals.revisionsHours + totals.travelHours,
    hasPoa: totals.hasPoa,
    options: {
      turnaround: TURNAROUND.find((t) => t.id === options.turnaround)?.label ?? '',
      travel: anyOnLocation ? TRAVEL.find((t) => t.id === options.travel)?.label ?? '' : 'n/a',
      licence: anyLicensable ? LICENCES.find((l) => l.id === options.licence)?.label ?? '' : 'n/a',
      extraRevisions: options.extraRevisions,
      sourceFiles: options.sourceFiles,
    },
    lines: lines.map((l) => ({
      discipline: l.discipline.label,
      name: l.item.name,
      spec: l.breakdown.spec.join(' · '),
      hours: l.breakdown.hours,
      cost: l.breakdown.total,
    })),
    charges: {
      itemFees: totals.itemFees,
      revisions: totals.revisionsCost,
      rush: totals.rushAmount,
      travelLabour: totals.travelLabour,
      travelExpenses: totals.travelExpenses,
      licence: totals.licenceFee,
      sourceFiles: totals.sourceFilesFee,
    },
  });

  const mailtoFallback = () => {
    const body = [
      `Quote ${meta?.number ?? ''}`,
      `${form.name} · ${form.email}${form.company ? ` · ${form.company}` : ''}`,
      '',
      ...lines.map((l) => `- ${l.item.name}${l.breakdown.spec.length ? ` (${l.breakdown.spec.join(' · ')})` : ''} — ${money(l.breakdown.total)}`),
      '',
      `Total: ${CURRENCY} ${money(totals.total)}`,
      form.message && `\n${form.message}`,
    ].filter(Boolean).join('\n');
    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Quote request — ${form.name}`)}&body=${encodeURIComponent(body)}`;
  };

  const submit = async () => {
    setStatus('sending');
    setErrorMsg('');
    try {
      const res = await fetch('/api/quote-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload()),
      });
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

  /* ── Param controls ── */
  const renderParam = (itemId: string, p: Param, values: ParamValues) => {
    if (p.kind === 'qty') {
      const v = clamp(Number(values[p.id] ?? p.default), p.min, p.max);
      return (
        <div key={p.id} className="qw-param">
          <div className="qw-param-head">
            <span className="qw-param-label">{p.label}</span>
            <div className="qw-stepper">
              <button type="button" onClick={() => setParam(itemId, p.id, clamp(v - p.step, p.min, p.max))} disabled={v <= p.min} aria-label={`Fewer ${p.unit}s`}>−</button>
              <input
                type="number"
                className="qw-stepper-input"
                value={v}
                min={p.min}
                max={p.max}
                step={p.step}
                onChange={(e) => setParam(itemId, p.id, clamp(Number(e.target.value), p.min, p.max))}
                aria-label={p.label}
              />
              <button type="button" onClick={() => setParam(itemId, p.id, clamp(v + p.step, p.min, p.max))} disabled={v >= p.max} aria-label={`More ${p.unit}s`}>+</button>
            </div>
          </div>
          <input
            type="range"
            className="quote-slider qw-param-range"
            min={p.min}
            max={p.max}
            step={p.step}
            value={v}
            onChange={(e) => setParam(itemId, p.id, Number(e.target.value))}
            aria-label={`${p.label} slider`}
          />
          <span className="qw-param-help">{plural(v, p.unit)}{p.help ? ` · ${p.help}` : ''}</span>
        </div>
      );
    }

    if (p.kind === 'choice') {
      const current = String(values[p.id] ?? p.default);
      return (
        <div key={p.id} className="qw-param">
          <span className="qw-param-label">{p.label}</span>
          <div className="qw-choice-row">
            {p.options.map((o) => (
              <button
                key={o.id}
                type="button"
                className="qw-choice"
                data-active={current === o.id}
                onClick={() => setParam(itemId, p.id, o.id)}
              >
                <span className="qw-choice-label">{o.label}</span>
                {o.desc && <span className="qw-choice-desc">{o.desc}</span>}
              </button>
            ))}
          </div>
          {p.help && <span className="qw-param-help">{p.help}</span>}
        </div>
      );
    }

    const on = values[p.id] === true;
    return (
      <label key={p.id} className="qw-toggle" data-active={on}>
        <input type="checkbox" checked={on} onChange={(e) => setParam(itemId, p.id, e.target.checked)} />
        <span className="qw-toggle-box" aria-hidden />
        <span className="qw-toggle-text">
          <span className="qw-toggle-label">{p.label}</span>
          {p.desc && <span className="qw-choice-desc">{p.desc}</span>}
        </span>
        {p.feeAdd ? <span className="qw-toggle-price">+{money(p.feeAdd)}</span> : null}
      </label>
    );
  };

  /* ── Sent confirmation ── */
  if (status === 'sent') {
    return (
      <PageTransition>
        <div className="quote-page">
          <main className="qw-main qw-screen">
            <div className="quote-card qw-done">
              <span className="label" style={{ color: 'var(--color-accent)' }}>Sent</span>
              <h1 className="display-md" style={{ marginTop: 'var(--sp-2)' }}>
                Thanks, {form.name.split(' ')[0]} — quote {meta?.number} is on its way.
              </h1>
              <p className="body-text">
                I’ve got your {money(totals.total)} {CURRENCY} quote ({selectedCount} item{selectedCount === 1 ? '' : 's'})
                and sent a copy to <b>{form.email}</b>. I’ll be in touch shortly.
              </p>
              <div className="qw-done-actions">
                <button className="quote-cta" onClick={() => window.print()}>Save as PDF</button>
                <a className="qw-back" href="/">Back to site</a>
              </div>
            </div>
          </main>
          {meta && (
            <div className="qw-print-only">
              <QuoteDocument totals={totals} options={options} client={form} meta={meta} />
            </div>
          )}
        </div>
      </PageTransition>
    );
  }

  const visibleDisciplines = DISCIPLINES.filter((d) => disciplines.has(d.id));

  return (
    <PageTransition>
      <div className="quote-page">
        <header className="quote-header qw-screen">
          <span className="label quote-eyebrow">Quote builder</span>
          <h1 className="display-xl quote-title">Build your quote</h1>
          <p className="body-text quote-lead">
            Pick what you need, set the details, and get a real itemised quote — priced the same way
            I’d price it in a meeting. Print it, save it as a PDF, or send it straight to me.
          </p>
        </header>

        <main className="qw-main qw-screen">
          {/* Progress */}
          <nav className="qw-progress" aria-label="Progress">
            {STEPS.map((s, i) => (
              <button
                key={s}
                className="qw-progress-step"
                data-state={i === step ? 'current' : i < step ? 'done' : 'todo'}
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                aria-current={i === step ? 'step' : undefined}
              >
                <span className="qw-progress-dot">{i < step ? '✓' : i + 1}</span>
                <span className="qw-progress-label">{s}</span>
              </button>
            ))}
          </nav>

          {/* Two columns once the rail has something to say; a single wide
              column for the quote document, which needs the full measure. */}
          <div className="qw-layout" data-rail={step >= 1 && step < 4}>
          <div className="quote-card qw-card">
            {/* ── Step 0 — Disciplines ── */}
            {step === 0 && (
              <div className="qw-step">
                <h2 className="display-md">What do you need?</h2>
                <p className="quote-section-sub">Pick everything that applies — you’ll configure the specifics next.</p>
                <div className="qw-chip-grid">
                  {DISCIPLINES.map((d) => (
                    <button key={d.id} className="qw-chip" data-active={disciplines.has(d.id)} onClick={() => toggleDiscipline(d.id)}>
                      <span className="qw-chip-label">{d.label}</span>
                      <span className="qw-chip-blurb">{d.blurb}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Step 1 — Scope ── */}
            {step === 1 && (
              <div className="qw-step">
                <h2 className="display-md">Build the scope</h2>
                <p className="quote-section-sub">
                  Select an item, then set its detail. Every number below feeds straight into the price.
                </p>
                {visibleDisciplines.map((d) => (
                  <div key={d.id} className="quote-phase">
                    <span className="label quote-subhead">{d.label}</span>
                    <ul className="qw-item-list">
                      {d.items.map((item) => {
                        const values = selection[item.id];
                        const on = !!values;
                        const open = on && expanded.has(item.id);
                        const b = on ? priceItem(item, values, RATES) : null;
                        const hasParams = (item.params?.length ?? 0) > 0;
                        return (
                          <li key={item.id} className="qw-item" data-scope={on ? 'in' : 'out'}>
                            <div className="qw-item-head">
                              <button type="button" className="qw-item-toggle" onClick={() => toggleItem(item)} aria-pressed={on}>
                                <span className={`qw-check ${on ? 'on' : ''}`} aria-hidden>{on ? '✓' : ''}</span>
                                <span className="qw-item-text">
                                  <span className="qw-item-name">{item.name}</span>
                                  {item.desc && <span className="qw-item-desc">{item.desc}</span>}
                                </span>
                              </button>
                              <span className="qw-item-meta">
                                {b ? (
                                  <>
                                    <span className="qw-item-hours">{hrs(b.hours)} · {RATE_LABELS[item.rate]}</span>
                                    <span className="qw-item-cost">{money(b.total)}</span>
                                  </>
                                ) : (
                                  <span className="qw-item-hours">{RATE_LABELS[item.rate]} ${RATES[item.rate]}/h</span>
                                )}
                              </span>
                              {on && hasParams && (
                                <button
                                  type="button"
                                  className="qw-item-expand"
                                  aria-expanded={open}
                                  onClick={() => setExpanded((e) => {
                                    const next = new Set(e);
                                    next.has(item.id) ? next.delete(item.id) : next.add(item.id);
                                    return next;
                                  })}
                                >
                                  {open ? 'Hide detail' : 'Set detail'}
                                </button>
                              )}
                            </div>
                            {open && values && (
                              <div className="qw-params">
                                {item.params!.map((p) => renderParam(item.id, p, values))}
                                {b && b.fees > 0 && (
                                  <p className="qw-param-note">Includes {money(b.fees)} in equipment and hire costs.</p>
                                )}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* ── Step 2 — Project conditions ── */}
            {step === 2 && (
              <div className="qw-step">
                <h2 className="display-md">Project conditions</h2>
                <p className="quote-section-sub">The things that change a price without changing the deliverables.</p>

                <div className="qw-param">
                  <span className="qw-param-label">Turnaround</span>
                  <div className="qw-choice-row">
                    {TURNAROUND.map((t) => (
                      <button key={t.id} type="button" className="qw-choice" data-active={options.turnaround === t.id} onClick={() => setOptions({ ...options, turnaround: t.id })}>
                        <span className="qw-choice-label">{t.label}</span>
                        <span className="qw-choice-desc">{t.desc}</span>
                        {t.mult > 1 && <span className="qw-choice-tag">+{Math.round((t.mult - 1) * 100)}%</span>}
                      </button>
                    ))}
                  </div>
                  <span className="qw-param-help">A rush fee applies to production time only — never to travel, equipment or licensing.</span>
                </div>

                {/* Only asked when something actually puts me on location. */}
                {anyOnLocation && (
                <div className="qw-param">
                  <span className="qw-param-label">Where’s the shoot?</span>
                  <div className="qw-choice-row">
                    {TRAVEL.map((t) => (
                      <button key={t.id} type="button" className="qw-choice" data-active={options.travel === t.id} onClick={() => setOptions({ ...options, travel: t.id })}>
                        <span className="qw-choice-label">{t.label}</span>
                        <span className="qw-choice-desc">{t.desc}</span>
                        {t.hours > 0 && <span className="qw-choice-tag">{t.poa ? 'POA' : `+${money(t.hours * RATES.shoot + t.expenses)}`}</span>}
                      </button>
                    ))}
                  </div>
                  <span className="qw-param-help">Travel time is billed at the shoot rate; flights and accommodation are estimated and billed at cost. Only applies because you’ve selected work that puts me on location.</span>
                </div>
                )}

                {anyLicensable && (
                  <div className="qw-param">
                    <span className="qw-param-label">Usage licence</span>
                    <div className="qw-choice-row">
                      {LICENCES.map((l) => (
                        <button key={l.id} type="button" className="qw-choice" data-active={options.licence === l.id} onClick={() => setOptions({ ...options, licence: l.id })}>
                          <span className="qw-choice-label">{l.label}</span>
                          <span className="qw-choice-desc">{l.desc}</span>
                          <span className="qw-choice-tag">{l.poa ? 'POA' : l.fee === 0 ? 'Included' : `+${money(l.fee)}`}</span>
                        </button>
                      ))}
                    </div>
                    <span className="qw-param-help">Where and for how long the shot work runs. Only applies because you’ve selected shoot or edit work.</span>
                  </div>
                )}

                <div className="qw-param">
                  <div className="qw-param-head">
                    <span className="qw-param-label">Extra revision rounds</span>
                    <div className="qw-stepper">
                      <button type="button" onClick={() => setOptions({ ...options, extraRevisions: Math.max(0, options.extraRevisions - 1) })} disabled={options.extraRevisions <= 0} aria-label="Fewer rounds">−</button>
                      <input type="number" className="qw-stepper-input" value={options.extraRevisions} min={0} max={10} onChange={(e) => setOptions({ ...options, extraRevisions: clamp(Number(e.target.value), 0, 10) })} aria-label="Extra revision rounds" />
                      <button type="button" onClick={() => setOptions({ ...options, extraRevisions: Math.min(10, options.extraRevisions + 1) })} disabled={options.extraRevisions >= 10} aria-label="More rounds">+</button>
                    </div>
                  </div>
                  <span className="qw-param-help">
                    {PRICING.revisionsIncluded} rounds are already included. Each extra round is {PRICING.revisionHours}h at ${RATES[PRICING.revisionRate]}/h.
                  </span>
                </div>

                <label className="qw-toggle" data-active={options.sourceFiles}>
                  <input type="checkbox" checked={options.sourceFiles} onChange={(e) => setOptions({ ...options, sourceFiles: e.target.checked })} />
                  <span className="qw-toggle-box" aria-hidden />
                  <span className="qw-toggle-text">
                    <span className="qw-toggle-label">Keep the working files</span>
                    <span className="qw-choice-desc">
                      Layered source files and project files, not just the final exports — so another designer can pick the work up.
                      {' '}{Math.round(PRICING.sourceFiles.percent * 100)}% of production time, minimum {money(PRICING.sourceFiles.min)}.
                    </span>
                  </span>
                  {totals.sourceFilesFee > 0 && <span className="qw-toggle-price">+{money(totals.sourceFilesFee)}</span>}
                </label>
              </div>
            )}

            {/* ── Step 3 — Details ── */}
            {step === 3 && (
              <div className="qw-step">
                <h2 className="display-md">Your details</h2>
                <p className="quote-section-sub">These go on the quote document, and let me send you a copy.</p>
                <div className="qw-form">
                  <label className="qw-field"><span>Name *</span><input className="qw-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" /></label>
                  <label className="qw-field"><span>Email *</span><input className="qw-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-ok={form.email === '' || emailOk} autoComplete="email" /></label>
                  <label className="qw-field"><span>Company</span><input className="qw-input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} autoComplete="organization" /></label>
                  <label className="qw-field"><span>When do you need it?</span><input className="qw-input" value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })} placeholder="e.g. mid-August" /></label>
                  <label className="qw-field qw-field-full"><span>Anything I should know?</span><textarea className="qw-input" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="A sentence about the project helps me sanity-check the quote." /></label>
                  <input className="qw-hp" tabIndex={-1} autoComplete="off" aria-hidden value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
                </div>
              </div>
            )}

            {/* ── Step 4 — The quote ── */}
            {step === 4 && meta && (
              <div className="qw-step">
                <div className="qw-quote-actions">
                  <div>
                    <h2 className="display-md">Your quote</h2>
                    <p className="quote-section-sub">Quote {meta.number} · valid until {meta.validUntil}</p>
                  </div>
                  <div className="qw-quote-buttons">
                    <button className="qw-ghost-btn" onClick={share}>{shareState === 'copied' ? '✓ Link copied' : 'Copy link'}</button>
                    <button className="qw-ghost-btn" onClick={() => window.print()}>Save as PDF</button>
                  </div>
                </div>

                <div className="qw-doc-frame">
                  <QuoteDocument totals={totals} options={options} client={form} meta={meta} />
                </div>

                {status === 'error' && (
                  <p className="qw-error">
                    Couldn’t send ({errorMsg}). <a href={mailtoFallback()}>Email it to me directly →</a>
                  </p>
                )}
              </div>
            )}

            {/* Nav */}
            <div className="qw-nav">
              <button className="qw-back" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || status === 'sending'}>Back</button>
              {step < 4 ? (
                <button className="quote-cta" onClick={() => canAdvance && setStep((s) => s + 1)} disabled={!canAdvance} data-disabled={!canAdvance}>
                  {step === 3 ? 'See my quote' : 'Continue'}
                </button>
              ) : (
                <button className="quote-cta" onClick={submit} disabled={status === 'sending'}>
                  {status === 'sending' ? 'Sending…' : 'Send it to Benjamin'}
                </button>
              )}
            </div>
          </div>

          {/* Running total */}
          {step >= 1 && step < 4 && (
            <aside className="qw-rail" aria-live="polite">
              <span className="label">Running total</span>
              <span className="qw-rail-total">{money(totals.total)} <small>{CURRENCY}</small></span>
              <span className="qw-rail-sub">
                {selectedCount} item{selectedCount === 1 ? '' : 's'} · {hrs(totals.hours + totals.revisionsHours + totals.travelHours)}
              </span>

              {lines.length > 0 && (
                <ul className="qw-rail-items">
                  {lines.map((l) => (
                    <li key={l.item.id}>
                      <span>{l.item.name}</span>
                      <b>{money(l.breakdown.total)}</b>
                    </li>
                  ))}
                </ul>
              )}

              {(totals.rushAmount > 0 || totals.travelLabour + totals.travelExpenses > 0
                || totals.licenceFee > 0 || totals.sourceFilesFee > 0 || totals.revisionsCost > 0) && (
                <ul className="qw-rail-items qw-rail-extras">
                  {totals.revisionsCost > 0 && <li><span>Extra revisions</span><b>+{money(totals.revisionsCost)}</b></li>}
                  {totals.rushAmount > 0 && <li><span>Rush fee</span><b>+{money(totals.rushAmount)}</b></li>}
                  {totals.travelLabour + totals.travelExpenses > 0 && <li><span>Travel</span><b>+{money(totals.travelLabour + totals.travelExpenses)}</b></li>}
                  {totals.licenceFee > 0 && <li><span>Usage licence</span><b>+{money(totals.licenceFee)}</b></li>}
                  {totals.sourceFilesFee > 0 && <li><span>Working files</span><b>+{money(totals.sourceFilesFee)}</b></li>}
                </ul>
              )}

              <span className="qw-rail-deposit">{money(totals.deposit)} deposit to book</span>
              {totals.hasPoa && <span className="qw-rail-line">Some items are POA</span>}
            </aside>
          )}
          </div>
        </main>

        {/* Print always renders the document, whatever step you're on — and the
            on-screen copy in step 4 is hidden by the print stylesheet so it
            never doubles up. */}
        {meta && (
          <div className="qw-print-only">
            <QuoteDocument totals={totals} options={options} client={form} meta={meta} />
          </div>
        )}
      </div>
    </PageTransition>
  );
}
