"use client";

import { useEffect, useMemo, useState } from 'react';
import { useTina, tinaField } from 'tinacms/dist/react';
import PageTransition from '@/components/PageTransition';
import { type TinaQueryResult, buildTinaProps } from '@/lib/tinaHelpers';
import { normalizeQuote, computeQuote, cost, clamp, type Deliverable } from '@/lib/quote';

const fmt = (n: number) => Math.round(n).toLocaleString();

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="5" y="11" width="14" height="9" rx="1.5" />
    <path strokeLinecap="round" d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

export default function QuoteBuilder(props: TinaQueryResult<'quotes'>) {
  // Live Tina data in the editor; normalized JSON fallback otherwise.
  const { data } = useTina(buildTinaProps(props));
  const raw = data.quotes;
  const config = useMemo(() => normalizeQuote(raw, raw?.slug), [raw]);

  const [budget, setBudget] = useState(config.budget.default);
  const [focus, setFocus] = useState<string | null>(null);

  // Live edits can move the slider bounds out from under the current value.
  useEffect(() => {
    setBudget((b) => clamp(b, config.budget.min, config.budget.max));
  }, [config.budget.min, config.budget.max]);

  const plan = useMemo(() => computeQuote(config, budget, focus), [config, budget, focus]);
  const { currency } = config;

  const itemCost = (d: Deliverable) => cost(d, plan.rates);
  const hoursLabel = (d: Deliverable) =>
    d.pricing === 'fixed' ? (d.estHours ? `~${d.estHours}h` : 'Fixed') : `${d.hours}h`;

  const proposal = useMemo(() => {
    const L: string[] = [];
    L.push(`QUOTE — ${currency} ${fmt(plan.budget)}  ·  ${config.client}`);
    L.push(`Core brief: ${plan.coreFunded}/${plan.coreTotal} funded · ${plan.extrasFunded} extra${plan.extrasFunded === 1 ? '' : 's'} · ${plan.hours} hrs`);
    L.push('');
    L.push('CORE SCOPE — required for the brief');
    for (const d of plan.core) {
      const ok = plan.includedIds.has(d.id);
      L.push(`  ${ok ? '+' : '–'} ${d.name} (${hoursLabel(d)})${ok ? '' : `  — needs +${currency} ${fmt(itemCost(d))}`}`);
    }
    if (plan.extras.length) {
      L.push('');
      L.push('EXTRAS — optional, nice to have');
      for (const d of plan.extras) {
        const ok = plan.includedIds.has(d.id);
        L.push(`  ${ok ? '+' : '–'} ${d.name} (${hoursLabel(d)}${ok ? '' : ` · +${currency} ${fmt(itemCost(d))}`})`);
      }
    }
    L.push('');
    L.push(`Investment: ${currency} ${fmt(plan.spent)} — fixed, all-inclusive.`);
    if (!plan.coreComplete) L.push(`Add ${currency} ${fmt(plan.coreShortfall)} to deliver the complete brief.`);
    return L.join('\n');
  }, [plan, config.client, currency]); // eslint-disable-line react-hooks/exhaustive-deps

  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(proposal);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  const renderItem = (d: Deliverable) => {
    const inScope = plan.includedIds.has(d.id);
    const needed = d.tier === 'core' && !inScope;
    const c = itemCost(d);
    return (
      <li key={d.id} className="quote-item" data-scope={inScope ? 'in' : 'out'} data-need={needed}>
        <span className={`quote-item-icon ${inScope ? 'in' : 'out'}`}>
          {inScope ? <CheckIcon /> : <LockIcon />}
        </span>
        <span className="quote-item-name">{d.name}</span>
        {needed && <span className="quote-item-tag">Needed</span>}
        <span className="quote-item-hours">{hoursLabel(d)}</span>
        <span className="quote-item-cost">{inScope ? `$${fmt(c)}` : `+$${fmt(c)}`}</span>
      </li>
    );
  };

  return (
    <PageTransition>
      <div className="quote-page">
        <header className="quote-header">
          <span className="label quote-eyebrow">{config.eyebrow ?? `${config.client} · Quote builder`}</span>
          <h1 className="display-xl quote-title" data-tina-field={tinaField(raw, 'title')}>{config.title}</h1>
          <p className="body-text quote-lead" data-tina-field={tinaField(raw, 'lead')}>{config.lead}</p>
        </header>

        <main className="quote-main">
          {/* Left: controls */}
          <section className="quote-controls">
            <div>
              <div className="quote-budget-head">
                <h2 className="display-md" style={{ color: 'var(--color-accent)' }}>Your budget</h2>
                <span className="quote-budget-value">${fmt(plan.budget)}<span> {currency}</span></span>
              </div>
              <input
                type="range"
                className="quote-slider"
                min={config.budget.min}
                max={config.budget.max}
                step={config.budget.step}
                value={plan.budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                aria-label="Budget"
              />
              <div className="quote-slider-scale">
                <span>${fmt(config.budget.min)}</span>
                <span>${fmt(config.budget.max)}</span>
              </div>
            </div>

            {config.focusOptions.length > 1 && (
              <div>
                <span className="label quote-subhead">Spend any spare budget on</span>
                <div className="quote-focus-grid">
                  {config.focusOptions.map((o) => (
                    <button
                      key={o.id}
                      className="quote-focus-btn"
                      data-active={focus === o.category}
                      onClick={() => setFocus(o.category)}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                <p className="quote-hint">
                  Core scope is always quoted first. This only changes which optional extras get funded when there’s budget to spare.
                </p>
              </div>
            )}

            <div className="quote-rates">
              <span className="label quote-subhead">My rates</span>
              <ul className="quote-rates-list">
                {config.workTypes.map((w) => (
                  <li key={w.id} className="quote-rate-row">
                    <span>{w.label}</span>
                    <b>${w.rate}/h</b>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Right: live scope */}
          <section className="quote-scope">
            <div className="quote-card">
              <div className="quote-summary-top">
                <div>
                  <span className="label" style={{ color: 'var(--color-accent)' }}>Brief coverage</span>
                  <p className="quote-summary-count">
                    {plan.coreFunded} <span>of {plan.coreTotal} core</span>
                  </p>
                  <p className="quote-summary-sub">
                    {plan.coreComplete
                      ? `Full brief covered · ${plan.extrasFunded} extra${plan.extrasFunded === 1 ? '' : 's'} · ${plan.hours} hrs`
                      : `${plan.hours} hrs · brief not yet covered`}
                  </p>
                </div>
                <div className="quote-summary-price">
                  ${fmt(plan.spent)}
                  <small>fixed investment</small>
                </div>
              </div>

              <div className="quote-bar">
                <div className="quote-bar-fill" style={{ width: `${plan.coreCoverage}%` }} />
              </div>

              <p className="quote-tradeoff">
                {!plan.coreComplete ? (
                  <>
                    <span className="accent">${fmt(plan.coreShortfall)}</span> short of delivering the full brief.{' '}
                    {plan.nextCore && <>Next required: <b>{plan.nextCore.name}</b>.</>}
                  </>
                ) : plan.nextExtra ? (
                  <>
                    Full brief covered. Add <span className="accent">${fmt(itemCost(plan.nextExtra) - plan.remaining)}</span>{' '}
                    to add the extra <b>{plan.nextExtra.name}</b>.
                  </>
                ) : (
                  <span className="accent">Everything fits — the full brief plus every optional extra.</span>
                )}
              </p>
            </div>

            {/* Core */}
            <div className="quote-section">
              <h3 className="quote-section-head">Core scope</h3>
              <p className="quote-section-sub">Everything the brief asks for — quoted and funded first.</p>
              {plan.corePhases.map((phase) => (
                <div key={phase} className="quote-phase">
                  <span className="label quote-subhead">{phase}</span>
                  <ul className="quote-list">
                    {plan.core.filter((d) => d.phase === phase).map(renderItem)}
                  </ul>
                </div>
              ))}
            </div>

            {/* Extras */}
            {plan.extras.length > 0 && (
              <div className="quote-section">
                <h3 className="quote-section-head">Extras · nice to have</h3>
                <p className="quote-section-sub">Optional enhancements beyond the brief. Funded only once core scope is fully covered.</p>
                <ul className="quote-list">
                  {plan.extras.map(renderItem)}
                </ul>
              </div>
            )}

            {/* Proposal + CTA */}
            <div className="quote-card">
              <div className="quote-proposal-head">
                <span className="label" style={{ color: 'var(--color-accent)' }}>Proposal summary</span>
                <button className="quote-copy-btn" onClick={copy}>
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <pre className="quote-proposal-text">{proposal}</pre>
              <p className="quote-fineprint">
                No hidden fees. No scope creep. No “buffer” line items. Just clarity.
              </p>
              <a className="quote-cta" href={`mailto:${config.contactEmail}`}>
                Start the conversation
              </a>
            </div>
          </section>
        </main>
      </div>
    </PageTransition>
  );
}
