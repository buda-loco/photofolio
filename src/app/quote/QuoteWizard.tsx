"use client";

// Self-serve quote builder — served in English at /quote (AUD) and in Spanish
// at /cotizacion (USD, 25% below the AU rate card).
//
// Five steps: pick disciplines → configure the actual deliverables → set the
// project conditions → leave your details → get a real quote document you can
// print, save as PDF, share as a link, or send over.
//
// Pricing lives entirely in lib/quotePricing.ts and the catalogue in
// data/quoteCatalogue.ts; everything regional arrives via the `bundle` prop.
// This file is UI only and holds no locale-specific strings.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PageTransition from '@/components/PageTransition';
import QuoteDocument, { type QuoteMeta } from './QuoteDocument';
import { getQuoteBundle, type QuoteRegion } from '@/data/quoteRegions';
import { whatsappLink } from '@/data/quoteCatalogue';
import {
  priceItem, priceQuote, defaultValues, encodeState, decodeState, clamp, plural,
  hoursFactorOf, HOURS_FACTOR_KEY, HOURS_FACTOR_MIN, HOURS_FACTOR_MAX,
  earliestStart, parseISODate, toISODate,
  presetValues, itemMatchesPreset, PRESETS, type PresetId,
  type CatalogItem, type Param, type ParamValues, type ProjectOptions, type QuoteLine, type Selection,
} from '@/lib/quotePricing';

const WhatsAppIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.2 8.2 0 0 1 5.83 2.42 8.2 8.2 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.29Z" />
  </svg>
);

/** The hours dial moves in 5% steps — finer than that is false precision. */
const HOURS_STEP = 0.05;
const pct = (factor: number) => Math.round(factor * 100);

/** What a preset sets beyond the per-item params. */
const PRESET_PROJECT: Record<PresetId, Pick<ProjectOptions, 'extraRevisions' | 'sourceFiles'>> = {
  minimum: { extraRevisions: 0, sourceFiles: false },
  recommended: { extraRevisions: 0, sourceFiles: false },
  complete: { extraRevisions: 1, sourceFiles: true },
};

/**
 * Scope and project options live in the URL so a refresh, a browser-back or a
 * forwarded link all survive. Contact details deliberately do NOT — they don't
 * belong in something that gets pasted into a chat — so they go to
 * sessionStorage instead, which survives a refresh but never leaves the tab.
 */
const DETAILS_KEY = 'ba-quote-details';
const LAST_STEP = 4;

const DEFAULT_OPTIONS: ProjectOptions = {
  preset: 'recommended',
  priority: false,
  startDate: '',
  travel: 'local',
  licence: 'organic',
  extraRevisions: 0,
  sourceFiles: false,
};

/**
 * Takes a region id rather than the built bundle: the copy object holds
 * formatting functions, and functions can't be serialised across the
 * server→client boundary. Resolving it here keeps the page a server component
 * (so it can still export metadata) while the bundle stays function-rich.
 */
export default function QuoteWizard({ regionId }: { regionId: QuoteRegion['id'] }) {
  const bundle = useMemo(() => getQuoteBundle(regionId), [regionId]);

  const { region, disciplines: DISCIPLINES, allItems: ALL_ITEMS, rates: RATES, rateLabels: RATE_LABELS,
    pricing: PRICING, travel: TRAVEL, licences: LICENCES, validDays, copy: T } = bundle;

  const money = useCallback(
    (n: number) => `${region.currencySymbol}${Math.round(n).toLocaleString(region.locale)}`,
    [region],
  );
  const hrs = (n: number) => `${Math.round(n * 10) / 10}h`;
  const dateFmt = useCallback(
    (d: Date) => d.toLocaleDateString(region.locale, { day: 'numeric', month: 'long', year: 'numeric' }),
    [region.locale],
  );
  const longDate = useCallback(
    (iso: string) => {
      const d = parseISODate(iso);
      return d
        ? d.toLocaleDateString(region.locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
        : iso;
    },
    [region.locale],
  );

  const [step, setStep] = useState(0);
  const [selectedDisciplines, setSelectedDisciplines] = useState<Set<string>>(new Set());
  const [selection, setSelection] = useState<Selection>({});
  const [options, setOptions] = useState<ProjectOptions>(DEFAULT_OPTIONS);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // No "when do you need it?" — the Delivery step already asks for a start date.
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '', website: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [meta, setMeta] = useState<QuoteMeta | null>(null);
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');
  const [minStartDate, setMinStartDate] = useState('');
  /** Blocks the URL sync until the incoming ?q= has been read. */
  const [hydrated, setHydrated] = useState(false);
  /** Errors stay quiet until a field is left or the step is submitted. */
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean }>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  /* ── Restore from a share link, once, after mount ──
     Deliberately client-only: reading location during render would desync
     the server-rendered markup. */
  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(DETAILS_KEY);
      if (saved) setForm((f) => ({ ...f, ...JSON.parse(saved), website: '' }));
    } catch { /* storage disabled or corrupt — start blank */ }

    const q = new URLSearchParams(window.location.search).get('q');
    const decoded = q ? decodeState(q) : null;
    if (!decoded) { setHydrated(true); return; }

    // Items absent from this region (on-location work on the remote-only page)
    // are dropped rather than silently priced.
    const valid: Selection = {};
    for (const [id, values] of Object.entries(decoded.s ?? {})) {
      if (ALL_ITEMS[id]) valid[id] = values;
    }
    if (!Object.keys(valid).length) { setHydrated(true); return; }

    setSelection(valid);
    setSelectedDisciplines(new Set(Object.keys(valid).map((id) => ALL_ITEMS[id].discipline.id)));
    setOptions({ ...DEFAULT_OPTIONS, ...(decoded.o ?? {}) });
    // A link written by "Copy link" carries no step and means "read this quote".
    // One written by the live URL sync carries the step the author was on, so a
    // refresh lands you back where you were rather than at the end.
    setStep(typeof decoded.p === 'number' ? clamp(Math.round(decoded.p), 0, LAST_STEP) : LAST_STEP);
    setHydrated(true);
  }, [ALL_ITEMS]);

  /* ── Keep the URL in step with the build ──
     replaceState rather than push: every keystroke shouldn't become a history
     entry. Debounced so dragging a slider doesn't rewrite the URL per frame. */
  useEffect(() => {
    if (!hydrated) return;
    const id = window.setTimeout(() => {
      const q = encodeState(selection, options, step);
      const url = q ? `${window.location.pathname}?q=${q}` : window.location.pathname;
      window.history.replaceState(window.history.state, '', url);
    }, 300);
    return () => window.clearTimeout(id);
  }, [hydrated, selection, options, step]);

  /* ── Contact details survive a refresh without entering the URL ── */
  useEffect(() => {
    if (!hydrated) return;
    try {
      const { website: _hp, ...rest } = form;
      window.sessionStorage.setItem(DETAILS_KEY, JSON.stringify(rest));
    } catch { /* storage disabled — the form still works, it just won't persist */ }
  }, [hydrated, form]);

  /* ── Quote identity — generated on the client so SSR stays deterministic ── */
  useEffect(() => {
    const now = new Date();
    const until = new Date(now.getTime() + validDays * 86_400_000);
    const stamp = `${now.getFullYear()}`.slice(2)
      + `${now.getMonth() + 1}`.padStart(2, '0')
      + `${now.getDate()}`.padStart(2, '0');
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const prefix = region.id === 'ar' ? 'BA-AR' : 'BA';
    setMeta({ number: `${prefix}-${stamp}-${suffix}`, issued: dateFmt(now), validUntil: dateFmt(until) });

    // Earliest bookable start, and the default the picker opens on.
    const soonest = toISODate(earliestStart(now, PRICING.schedule.leadDays));
    setMinStartDate(soonest);
    setOptions((o) => (o.startDate ? o : { ...o, startDate: soonest }));
  }, [validDays, dateFmt, region.id, PRICING.schedule.leadDays]);

  /* ── Derived pricing ── */
  const itemOrder = useMemo(() => Object.keys(ALL_ITEMS), [ALL_ITEMS]);

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
        .sort((a, b) => itemOrder.indexOf(a.item.id) - itemOrder.indexOf(b.item.id)),
    [selection, ALL_ITEMS, RATES, itemOrder],
  );

  const totals = useMemo(() => priceQuote(lines, options, PRICING), [lines, options, PRICING]);
  const anyLicensable = lines.some((l) => l.item.licensable);
  const anyOnLocation = lines.some((l) => l.item.onLocation);
  const offersTravel = TRAVEL.length > 0 && anyOnLocation;
  const selectedCount = lines.length;

  /* ── Mutations ── */
  // All of these use functional updates: two toggles dispatched in the same
  // tick must not read the same stale snapshot and clobber each other.
  const toggleDiscipline = (id: string) => {
    setSelectedDisciplines((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    // Drop any selected items belonging to a discipline that's been removed.
    setSelection((sel) =>
      selectedDisciplines.has(id)
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
      return { ...sel, [item.id]: presetValues(item, options.preset) };
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

  const applyPreset = (preset: PresetId) => {
    setOptions((o) => ({ ...o, preset, ...PRESET_PROJECT[preset] }));
    setSelection((sel) =>
      Object.fromEntries(
        Object.entries(sel).map(([id, values]) => {
          const entry = ALL_ITEMS[id];
          if (!entry) return [id, values];
          const next = presetValues(entry.item, preset);
          const factor = values[HOURS_FACTOR_KEY];
          return [id, factor === undefined ? next : { ...next, [HOURS_FACTOR_KEY]: factor }];
        }),
      ),
    );
  };

  /**
   * Which preset the current scope actually sits on. Recomputed rather than
   * trusted from state, so fine-tuning one item honestly clears the highlight
   * instead of leaving a button claiming something that's no longer true.
   */
  const activePreset: PresetId | null = useMemo(() => {
    const entries = Object.entries(selection);
    if (!entries.length) return options.preset;
    return PRESETS.find((preset) =>
      entries.every(([id, values]) => {
        const entry = ALL_ITEMS[id];
        return !entry || itemMatchesPreset(entry.item, values, preset);
      }),
    ) ?? null;
  }, [selection, ALL_ITEMS, options.preset]);

  /**
   * The global hours dial. Flattens every selected item to the same share of
   * its recommended time — that's what "distributes down to the items" means.
   * Individual items can then be nudged again on the Scope step.
   */
  const setGlobalHoursFactor = (factor: number) => {
    const f = clamp(factor, HOURS_FACTOR_MIN, HOURS_FACTOR_MAX);
    setSelection((sel) =>
      Object.fromEntries(Object.entries(sel).map(([id, values]) => [id, { ...values, [HOURS_FACTOR_KEY]: f }])),
    );
  };

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
      window.prompt(T.quote.copyPrompt, url);
    }
  }, [selection, options, T.quote.copyPrompt]);

  /* ── Submit ── */
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  // Step 4 is reachable directly from a share link, so this is now a real gate
  // rather than a formality — without it the API just returns a 400.
  const nameOk = form.name.trim() !== '';
  const detailsComplete = nameOk && emailOk;
  const canAdvance = [selectedDisciplines.size > 0, selectedCount > 0, true, detailsComplete, true][step];

  /** Why Continue is greyed out. Null when it isn't. */
  const blockedReason: string | null = canAdvance
    ? null
    : [T.nav.needWork, T.nav.needItems, null, T.quote.needDetails, null][step] ?? null;

  /**
   * Move to the details step and put the cursor on the first thing that's
   * wrong, rather than leaving the user to hunt for it.
   */
  const focusFirstError = () => {
    setTouched({ name: true, email: true });
    const target = !nameOk ? nameRef.current : !emailOk ? emailRef.current : null;
    target?.focus();
  };

  const submitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (detailsComplete) setStep(LAST_STEP);
    else focusFirstError();
  };

  const payload = () => ({
    ...form,
    locale: region.locale,
    region: region.id,
    currency: region.currency,
    quoteNumber: meta?.number ?? '',
    validUntil: meta?.validUntil ?? '',
    total: totals.total,
    deposit: totals.deposit,
    hours: totals.hours + totals.revisionsHours + totals.travelHours,
    hasPoa: totals.hasPoa,
    options: {
      priority: options.priority,
      travel: offersTravel ? TRAVEL.find((t) => t.id === options.travel)?.label ?? '' : 'n/a',
      licence: anyLicensable ? LICENCES.find((l) => l.id === options.licence)?.label ?? '' : 'n/a',
      extraRevisions: options.extraRevisions,
      sourceFiles: options.sourceFiles,
      startDate: totals.schedule.start ?? '',
      deliveryDate: totals.schedule.end ?? '',
      workingDays: totals.schedule.workingDays,
      hoursPerDay: totals.schedule.hoursPerDay,
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
      priority: totals.priorityAmount,
      travelLabour: totals.travelLabour,
      travelExpenses: totals.travelExpenses,
      licence: totals.licenceFee,
      sourceFiles: totals.sourceFilesFee,
    },
  });

  const mailtoFallback = () => {
    const body = [
      `${T.doc.stamp} ${meta?.number ?? ''}`,
      `${form.name} · ${form.email}${form.company ? ` · ${form.company}` : ''}`,
      '',
      ...lines.map((l) => `- ${l.item.name}${l.breakdown.spec.length ? ` (${l.breakdown.spec.join(' · ')})` : ''} — ${money(l.breakdown.total)}`),
      '',
      `${T.doc.total}: ${region.currency} ${money(totals.total)}`,
      form.message && `\n${form.message}`,
    ].filter(Boolean).join('\n');
    return `mailto:${bundle.business.email}?subject=${encodeURIComponent(`${T.doc.stamp} — ${form.name}`)}&body=${encodeURIComponent(body)}`;
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
              <button type="button" onClick={() => setParam(itemId, p.id, clamp(v - p.step, p.min, p.max))} disabled={v <= p.min} aria-label={T.scope.fewer(p.unit)}>−</button>
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
              <button type="button" onClick={() => setParam(itemId, p.id, clamp(v + p.step, p.min, p.max))} disabled={v >= p.max} aria-label={T.scope.more(p.unit)}>+</button>
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
            aria-label={p.label}
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
        <div className="quote-page" lang={region.locale}>
          <main className="qw-main qw-screen">
            <div className="quote-card qw-done">
              <span className="label" style={{ color: 'var(--color-accent)' }}>{T.sent.label}</span>
              <h1 className="display-md" style={{ marginTop: 'var(--sp-2)' }}>
                {T.sent.title(form.name.split(' ')[0], meta?.number ?? '')}
              </h1>
              <p className="body-text">
                {T.sent.body(money(totals.total), region.currency, selectedCount, form.email)}
              </p>
              <div className="qw-done-actions">
                <button className="quote-cta" onClick={() => window.print()}>{T.sent.savePdf}</button>
                <a
                  className="qw-ghost-btn qw-wa-btn"
                  href={whatsappLink(T.quote.whatsappMessage(meta?.number ?? '', money(totals.total), region.currency))}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon />
                  {T.sent.whatsapp}
                </a>
                <a className="qw-back" href="/">{T.sent.backToSite}</a>
              </div>
            </div>
          </main>
          {meta && (
            <div className="qw-print-only">
              <QuoteDocument bundle={bundle} totals={totals} options={options} client={form} meta={meta} />
            </div>
          )}
        </div>
      </PageTransition>
    );
  }

  const visibleDisciplines = DISCIPLINES.filter((d) => selectedDisciplines.has(d.id));

  return (
    <PageTransition>
      <div className="quote-page" lang={region.locale}>
        <header className="quote-header qw-screen">
          <span className="label quote-eyebrow">{T.header.eyebrow}</span>
          <h1 className="display-xl quote-title">{T.header.title}</h1>
          <p className="body-text quote-lead">{T.header.lead}</p>
        </header>

        <main className="qw-main qw-screen">
          {/* Progress */}
          <nav className="qw-progress" aria-label={T.header.eyebrow}>
            {T.steps.map((s, i) => (
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
                <h2 className="display-md">{T.work.title}</h2>
                <p className="quote-section-sub">{T.work.sub}</p>
                <div className="qw-chip-grid">
                  {DISCIPLINES.map((d) => (
                    <button key={d.id} className="qw-chip" data-active={selectedDisciplines.has(d.id)} onClick={() => toggleDiscipline(d.id)}>
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
                <h2 className="display-md">{T.scope.title}</h2>
                <p className="quote-section-sub">{T.scope.sub}</p>

                {/* One control for the whole quote — sets every item at once,
                    and anything added afterwards adopts it too. */}
                <div className="qw-presets">
                  <span className="qw-param-label">{T.presets.label}</span>
                  <div className="qw-choice-row">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        className="qw-choice"
                        data-active={activePreset === preset}
                        onClick={() => applyPreset(preset)}
                      >
                        <span className="qw-choice-label">{T.presets[preset].label}</span>
                        <span className="qw-choice-desc">{T.presets[preset].desc}</span>
                      </button>
                    ))}
                  </div>
                  <span className="qw-param-help">
                    {activePreset === null ? T.presets.custom : T.presets.help}
                  </span>
                </div>
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
                                  <span className="qw-item-hours">{RATE_LABELS[item.rate]} {T.scope.perHour(RATES[item.rate])}</span>
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
                                  {open ? T.scope.hideDetail : T.scope.setDetail}
                                </button>
                              )}
                            </div>
                            {open && values && b && (
                              <div className="qw-params">
                                {item.params!.map((p) => renderParam(item.id, p, values))}

                                {/* Per-item time dial. The recommendation comes
                                    from the params above; this only lets the
                                    client buy less of it. */}
                                <div className="qw-param qw-hours">
                                  <div className="qw-param-head">
                                    <span className="qw-param-label">{T.scope.hours}</span>
                                    <span className="qw-hours-readout" data-reduced={b.reduced}>
                                      {b.reduced
                                        ? T.scope.hoursOf(hrs(b.hours), hrs(b.recommendedHours))
                                        : T.scope.hoursFull}
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    className="quote-slider qw-param-range"
                                    min={HOURS_FACTOR_MIN}
                                    max={HOURS_FACTOR_MAX}
                                    step={HOURS_STEP}
                                    value={b.hoursFactor}
                                    onChange={(e) => setParam(item.id, HOURS_FACTOR_KEY, Number(e.target.value))}
                                    aria-label={T.scope.hours}
                                    aria-valuetext={T.scope.hoursOf(hrs(b.hours), hrs(b.recommendedHours))}
                                  />
                                  {b.reduced && (
                                    <span className="qw-param-help qw-warn">{T.scope.hoursReduced(pct(b.hoursFactor))}</span>
                                  )}
                                </div>

                                {b.fees > 0 && (
                                  <p className="qw-param-note">{T.scope.includesFees(money(b.fees))}</p>
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
                <h2 className="display-md">{T.project.title}</h2>
                <p className="quote-section-sub">{T.project.sub}</p>

                {/* Hours dial — the budget lever. Sits first because it's the
                    decision that reshapes everything below it. */}
                <div className="qw-param qw-hours qw-hours-global">
                  <div className="qw-param-head">
                    <span className="qw-param-label">{T.project.hours}</span>
                    <span className="qw-hours-total" data-reduced={totals.reduced}>
                      {hrs(totals.hours)}
                    </span>
                  </div>

                  <input
                    type="range"
                    className="quote-slider"
                    min={HOURS_FACTOR_MIN}
                    max={HOURS_FACTOR_MAX}
                    step={HOURS_STEP}
                    value={totals.hoursFactor}
                    onChange={(e) => setGlobalHoursFactor(Number(e.target.value))}
                    aria-label={T.project.hours}
                    aria-valuetext={T.project.hoursBuying(hrs(totals.hours), pct(totals.hoursFactor))}
                  />

                  <div className="qw-hours-scale">
                    <span>{pct(HOURS_FACTOR_MIN)}%</span>
                    <span>{pct(HOURS_FACTOR_MAX)}%</span>
                  </div>

                  <p className="qw-hours-compare" data-reduced={totals.reduced}>
                    {totals.reduced
                      ? T.project.hoursBuying(hrs(totals.hours), pct(totals.hoursFactor))
                      : T.project.hoursRecommended(hrs(totals.recommendedHours), money(totals.recommendedLabour))}
                  </p>

                  {totals.hoursFactor <= HOURS_FACTOR_MIN && (
                    <p className="qw-param-help qw-warn">{T.project.hoursAtFloor}</p>
                  )}

                  <span className="qw-param-help">{T.project.hoursHelp(pct(HOURS_FACTOR_MIN))}</span>
                </div>

                {/* Only asked when something actually puts me on location. */}
                {offersTravel && (
                <div className="qw-param">
                  <span className="qw-param-label">{T.project.travel}</span>
                  <div className="qw-choice-row">
                    {TRAVEL.map((t) => (
                      <button key={t.id} type="button" className="qw-choice" data-active={options.travel === t.id} onClick={() => setOptions({ ...options, travel: t.id })}>
                        <span className="qw-choice-label">{t.label}</span>
                        <span className="qw-choice-desc">{t.desc}</span>
                        {t.hours > 0 && <span className="qw-choice-tag">{t.poa ? T.project.poa : `+${money(t.hours * RATES.shoot + t.expenses)}`}</span>}
                      </button>
                    ))}
                  </div>
                  <span className="qw-param-help">{T.project.travelHelp}</span>
                </div>
                )}

                {anyLicensable && (
                  <div className="qw-param">
                    <span className="qw-param-label">{T.project.licence}</span>
                    <div className="qw-choice-row">
                      {LICENCES.map((l) => (
                        <button key={l.id} type="button" className="qw-choice" data-active={options.licence === l.id} onClick={() => setOptions({ ...options, licence: l.id })}>
                          <span className="qw-choice-label">{l.label}</span>
                          <span className="qw-choice-desc">{l.desc}</span>
                          <span className="qw-choice-tag">{l.poa ? T.project.poa : l.fee === 0 ? T.project.included : `+${money(l.fee)}`}</span>
                        </button>
                      ))}
                    </div>
                    <span className="qw-param-help">{T.project.licenceHelp}</span>
                  </div>
                )}

                <div className="qw-param">
                  <div className="qw-param-head">
                    <span className="qw-param-label">{T.project.revisions}</span>
                    <div className="qw-stepper">
                      <button type="button" onClick={() => setOptions({ ...options, extraRevisions: Math.max(0, options.extraRevisions - 1) })} disabled={options.extraRevisions <= 0} aria-label={T.project.fewerRounds}>−</button>
                      <input type="number" className="qw-stepper-input" value={options.extraRevisions} min={0} max={10} onChange={(e) => setOptions({ ...options, extraRevisions: clamp(Number(e.target.value), 0, 10) })} aria-label={T.project.revisions} />
                      <button type="button" onClick={() => setOptions({ ...options, extraRevisions: Math.min(10, options.extraRevisions + 1) })} disabled={options.extraRevisions >= 10} aria-label={T.project.moreRounds}>+</button>
                    </div>
                  </div>
                  <span className="qw-param-help">
                    {T.project.revisionsHelp(PRICING.revisionsIncluded, PRICING.revisionHours, RATES[PRICING.revisionRate])}
                  </span>
                </div>

                <label className="qw-toggle" data-active={options.sourceFiles}>
                  <input type="checkbox" checked={options.sourceFiles} onChange={(e) => setOptions({ ...options, sourceFiles: e.target.checked })} />
                  <span className="qw-toggle-box" aria-hidden />
                  <span className="qw-toggle-text">
                    <span className="qw-toggle-label">{T.project.sourceFiles}</span>
                    <span className="qw-choice-desc">
                      {T.project.sourceFilesDesc(Math.round(PRICING.sourceFiles.percent * 100), money(PRICING.sourceFiles.min))}
                    </span>
                  </span>
                  {totals.sourceFilesFee > 0 && <span className="qw-toggle-price">+{money(totals.sourceFilesFee)}</span>}
                </label>

                {/* ── Delivery — everything time-related, in one place, last ── */}
                <div className="qw-delivery">
                  <h3 className="qw-delivery-head">{T.delivery.title}</h3>
                  <p className="quote-section-sub">{T.delivery.sub}</p>

                  <label className="qw-toggle" data-active={options.priority}>
                    <input
                      type="checkbox"
                      checked={options.priority}
                      onChange={(e) => setOptions({ ...options, priority: e.target.checked })}
                    />
                    <span className="qw-toggle-box" aria-hidden />
                    <span className="qw-toggle-text">
                      <span className="qw-toggle-label">{T.delivery.priority}</span>
                      <span className="qw-choice-desc">
                        {T.delivery.priorityDesc(
                          PRICING.schedule.hoursPerDay,
                          PRICING.schedule.priorityHoursPerDay,
                          Math.round(PRICING.schedule.priorityUplift * 100),
                        )}
                      </span>
                    </span>
                    {totals.priorityAmount > 0 && <span className="qw-toggle-price">+{money(totals.priorityAmount)}</span>}
                  </label>

                  <div className="qw-delivery-grid">
                    <label className="qw-field">
                      <span>{T.delivery.startLabel}</span>
                      <input
                        type="date"
                        className="qw-input"
                        value={options.startDate}
                        min={minStartDate}
                        onChange={(e) => setOptions({ ...options, startDate: e.target.value })}
                      />
                    </label>

                    <div className="qw-delivery-result">
                      {totals.schedule.workingDays > 0 ? (
                        <>
                          <span className="qw-delivery-days">
                            {T.delivery.duration(totals.schedule.workingDays)}
                          </span>
                          <span className="qw-delivery-pace">
                            {T.delivery.pace(totals.schedule.hoursPerDay)}
                          </span>
                          {totals.schedule.end ? (
                            <span className="qw-delivery-date">
                              {T.delivery.deliveryLabel}: <b>{longDate(totals.schedule.end)}</b>
                            </span>
                          ) : (
                            <span className="qw-delivery-pace">{T.delivery.pickDate}</span>
                          )}
                        </>
                      ) : (
                        <span className="qw-delivery-pace">{T.delivery.pickDate}</span>
                      )}
                    </div>
                  </div>

                  <p className="qw-param-help">{T.delivery.startHelp(PRICING.schedule.leadDays)}</p>
                  <p className="qw-delivery-note">{T.delivery.note}</p>
                </div>
              </div>
            )}

            {/* ── Step 3 — Details ── */}
            {step === 3 && (
              <div className="qw-step">
                <h2 className="display-md">{T.details.title}</h2>
                <p className="quote-section-sub">{T.details.sub}</p>
                {/* A real <form>, so Enter finishes the step like it does
                    everywhere else on the web. */}
                <form className="qw-form" onSubmit={submitDetails} noValidate>
                  <label className="qw-field">
                    <span>{T.details.name}</span>
                    <input
                      ref={nameRef}
                      className="qw-input"
                      name="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                      autoComplete="name"
                      aria-invalid={touched.name && !nameOk ? true : undefined}
                      aria-describedby={touched.name && !nameOk ? 'qw-err-name' : undefined}
                    />
                    {touched.name && !nameOk && (
                      <span className="qw-field-error" id="qw-err-name">{T.details.nameRequired}</span>
                    )}
                  </label>

                  <label className="qw-field">
                    <span>{T.details.email}</span>
                    <input
                      ref={emailRef}
                      className="qw-input"
                      type="email"
                      name="email"
                      inputMode="email"
                      spellCheck={false}
                      autoCapitalize="none"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                      data-ok={!(touched.email && !emailOk)}
                      autoComplete="email"
                      aria-invalid={touched.email && !emailOk ? true : undefined}
                      aria-describedby={touched.email && !emailOk ? 'qw-err-email' : undefined}
                    />
                    {touched.email && !emailOk && (
                      <span className="qw-field-error" id="qw-err-email">{T.details.emailInvalid}</span>
                    )}
                  </label>

                  <label className="qw-field">
                    <span>{T.details.company}</span>
                    <input className="qw-input" name="organization" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} autoComplete="organization" />
                  </label>

                  <label className="qw-field qw-field-full">
                    <span>{T.details.message}</span>
                    <textarea className="qw-input" name="message" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder={T.details.messagePlaceholder} />
                  </label>

                  <input className="qw-hp" tabIndex={-1} autoComplete="off" aria-hidden name="website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
                  {/* Enter needs a submit target; the visible CTA lives in the shared nav. */}
                  <button type="submit" className="qw-hp" tabIndex={-1} aria-hidden>{T.nav.seeQuote}</button>
                </form>
              </div>
            )}

            {/* ── Step 4 — The quote ── */}
            {step === 4 && meta && (
              <div className="qw-step">
                <div className="qw-quote-actions">
                  <div>
                    <h2 className="display-md">{T.quote.title}</h2>
                    <p className="quote-section-sub">{T.quote.sub(meta.number, meta.validUntil)}</p>
                  </div>
                  <div className="qw-quote-buttons">
                    <button className="qw-ghost-btn" onClick={share}>{shareState === 'copied' ? T.quote.copied : T.quote.copyLink}</button>
                    <button className="qw-ghost-btn" onClick={() => window.print()}>{T.quote.savePdf}</button>
                    <a
                      className="qw-ghost-btn qw-wa-btn"
                      href={whatsappLink(T.quote.whatsappMessage(meta.number, money(totals.total), region.currency))}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <WhatsAppIcon />
                      {T.quote.whatsapp}
                    </a>
                  </div>
                </div>

                <div className="qw-doc-frame">
                  <QuoteDocument bundle={bundle} totals={totals} options={options} client={form} meta={meta} />
                </div>

                {status === 'error' && (
                  <p className="qw-error">
                    {T.quote.sendError(errorMsg)} <a href={mailtoFallback()}>{T.quote.emailDirectly}</a>
                  </p>
                )}
              </div>
            )}

            {/* Nav */}
            <div className="qw-nav">
              <button className="qw-back" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || status === 'sending'}>{T.nav.back}</button>
              {step < LAST_STEP ? (
                <div className="qw-send">
                  {blockedReason && (
                    <span className="qw-send-hint" role="status">{blockedReason}</span>
                  )}
                  {/* Stays clickable so it can explain itself instead of being a
                      dead end; it just doesn't advance until the step is valid. */}
                  <button
                    className="quote-cta"
                    onClick={() => (canAdvance ? setStep((s) => s + 1) : focusFirstError())}
                    data-disabled={!canAdvance}
                    aria-disabled={!canAdvance}
                  >
                    {step === 3 ? T.nav.seeQuote : T.nav.continue}
                  </button>
                </div>
              ) : (
                <div className="qw-send">
                  {!detailsComplete && (
                    <button className="qw-send-hint" onClick={() => setStep(3)}>
                      {T.quote.needDetails}
                    </button>
                  )}
                  <button
                    className="quote-cta"
                    onClick={submit}
                    disabled={status === 'sending' || !detailsComplete}
                    data-disabled={!detailsComplete}
                  >
                    {status === 'sending' ? T.nav.sending : T.nav.send}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Running total */}
          {step >= 1 && step < 4 && (
            <aside className="qw-rail" aria-label={T.rail.total}>
              <span className="label">{T.rail.total}</span>
              {/* Only the total announces. Putting aria-live on the whole panel
                  made every slider tick re-read each line item and the deposit. */}
              <span className="qw-rail-total" aria-live="polite" aria-atomic="true">
                {money(totals.total)} <small>{region.currency}</small>
              </span>
              <span className="qw-rail-sub">
                {T.rail.summary(selectedCount, hrs(totals.hours + totals.revisionsHours + totals.travelHours))}
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

              {(totals.priorityAmount > 0 || totals.travelLabour + totals.travelExpenses > 0
                || totals.licenceFee > 0 || totals.sourceFilesFee > 0 || totals.revisionsCost > 0) && (
                <ul className="qw-rail-items qw-rail-extras">
                  {totals.revisionsCost > 0 && <li><span>{T.rail.revisions}</span><b>+{money(totals.revisionsCost)}</b></li>}
                  {totals.priorityAmount > 0 && <li><span>{T.rail.priority}</span><b>+{money(totals.priorityAmount)}</b></li>}
                  {totals.travelLabour + totals.travelExpenses > 0 && <li><span>{T.rail.travel}</span><b>+{money(totals.travelLabour + totals.travelExpenses)}</b></li>}
                  {totals.licenceFee > 0 && <li><span>{T.rail.licence}</span><b>+{money(totals.licenceFee)}</b></li>}
                  {totals.sourceFilesFee > 0 && <li><span>{T.rail.sourceFiles}</span><b>+{money(totals.sourceFilesFee)}</b></li>}
                </ul>
              )}

              {totals.schedule.workingDays > 0 && (
                <span className="qw-rail-line">{T.rail.delivery(totals.schedule.workingDays)}</span>
              )}
              {totals.reduced && (
                <span className="qw-rail-line qw-warn">
                  {T.rail.reduced(pct(totals.hoursFactor), hrs(totals.recommendedHours))}
                </span>
              )}
              <span className="qw-rail-deposit">{T.rail.deposit(money(totals.deposit))}</span>
              {totals.hasPoa && <span className="qw-rail-line">{T.rail.poa}</span>}
            </aside>
          )}
          </div>
        </main>

        {/* Print always renders the document, whatever step you're on — and the
            on-screen copy in step 4 is hidden by the print stylesheet so it
            never doubles up. */}
        {meta && (
          <div className="qw-print-only">
            <QuoteDocument bundle={bundle} totals={totals} options={options} client={form} meta={meta} />
          </div>
        )}
      </div>
    </PageTransition>
  );
}
