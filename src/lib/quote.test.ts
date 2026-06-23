import { describe, it, expect } from 'vitest';
import {
  cost, hoursOf, normalizeQuote, computeQuote, rateMapOf, clamp,
  type QuoteConfig, type Deliverable,
} from './quote';

const rates = { strategy: 50, design: 100 };

const hourly = (over: Partial<Deliverable> = {}): Deliverable =>
  ({ id: 'h', name: 'H', phase: 'P', tier: 'core', pricing: 'hourly', category: 'design', hours: 10, ...over } as Deliverable);

const fixed = (over: Partial<Deliverable> = {}): Deliverable =>
  ({ id: 'f', name: 'F', phase: 'P', tier: 'core', pricing: 'fixed', amount: 2000, ...over } as Deliverable);

describe('cost', () => {
  it('hourly = hours × rate', () => {
    expect(cost(hourly({ category: 'design', hours: 10 }), rates)).toBe(1000);
  });
  it('fixed = amount, ignores hours/rate', () => {
    expect(cost(fixed({ amount: 2500 }), rates)).toBe(2500);
  });
  it('unknown work-type → $0, never NaN', () => {
    expect(cost(hourly({ category: 'nope', hours: 10 }), rates)).toBe(0);
  });
  it('negative / garbage amounts clamp to 0, never NaN', () => {
    expect(cost(fixed({ amount: -50 }), rates)).toBe(0);
    expect(cost(hourly({ hours: NaN as unknown as number }), rates)).toBe(0);
  });
});

describe('hoursOf', () => {
  it('hourly contributes its hours', () => expect(hoursOf(hourly({ hours: 8 }))).toBe(8));
  it('fixed contributes estHours (0 if none)', () => {
    expect(hoursOf(fixed({ estHours: 12 } as Partial<Deliverable>))).toBe(12);
    expect(hoursOf(fixed())).toBe(0);
  });
});

describe('clamp', () => {
  it('clamps into range', () => {
    expect(clamp(13000, 0, 8000)).toBe(8000);
    expect(clamp(-5, 0, 8000)).toBe(0);
    expect(clamp(5000, 0, 8000)).toBe(5000);
  });
});

describe('normalizeQuote', () => {
  it('drops invalid deliverables and never throws', () => {
    const cfg = normalizeQuote({ deliverables: [null, 42, { name: 'ok' }] }, 'x');
    expect(cfg.deliverables).toHaveLength(1);
    expect(cfg.deliverables[0].pricing).toBe('hourly'); // default
  });
  it('maps _template / __typename to pricing', () => {
    const cfg = normalizeQuote({
      deliverables: [
        { _template: 'fixed', amount: 900 },
        { __typename: 'QuotesDeliverablesHourly', category: 'design', hours: 5 },
      ],
    });
    expect(cfg.deliverables[0].pricing).toBe('fixed');
    expect(cfg.deliverables[1].pricing).toBe('hourly');
  });
  it('repairs a broken budget (max<=min, default OOB)', () => {
    const cfg = normalizeQuote({ budget: { min: 10000, max: 5000, default: 99999 } });
    expect(cfg.budget.max).toBeGreaterThan(cfg.budget.min);
    expect(cfg.budget.default).toBeLessThanOrEqual(cfg.budget.max);
    expect(cfg.budget.default).toBeGreaterThanOrEqual(cfg.budget.min);
  });
  it('builds a usable rate map', () => {
    const cfg = normalizeQuote({ workTypes: [{ id: 'design', label: 'Design', rate: 100 }] });
    expect(rateMapOf(cfg.workTypes)).toEqual({ design: 100 });
  });
});

const baseConfig = (deliverables: Deliverable[], max = 25000): QuoteConfig => ({
  slug: 't', client: 'T', currency: 'AUD', title: 'x', lead: '', contactEmail: 'a@b.c',
  workTypes: [{ id: 'strategy', label: 'S', rate: 50 }, { id: 'design', label: 'D', rate: 100 }],
  deliverables,
  focusOptions: [{ id: 'balanced', label: 'Balanced', category: null }],
  budget: { min: 0, max, step: 500, default: 13000 },
});

describe('computeQuote', () => {
  const core1 = hourly({ id: 'c1', tier: 'core', category: 'design', hours: 10 }); // 1000
  const core2 = fixed({ id: 'c2', tier: 'core', amount: 2000 });                    // 2000
  const extra1 = hourly({ id: 'e1', tier: 'extra', category: 'design', hours: 10 });// 1000

  it('funds core first; extra excluded when budget only covers core', () => {
    const p = computeQuote(baseConfig([core1, core2, extra1]), 3000, null);
    expect(p.coreComplete).toBe(true);
    expect(p.includedIds.has('e1')).toBe(false);
    expect(p.spent).toBe(3000);
  });

  it('mixes hourly + fixed correctly in the total', () => {
    const p = computeQuote(baseConfig([core1, core2]), 5000, null);
    expect(p.coreCost).toBe(3000); // 1000 + 2000
    expect(p.spent).toBe(3000);
  });

  it('reports a shortfall when budget < core cost', () => {
    const p = computeQuote(baseConfig([core1, core2]), 1500, null);
    expect(p.coreComplete).toBe(false);
    expect(p.coreShortfall).toBe(1500); // 3000 - 1500
    expect(p.nextCore?.id).toBe('c2');  // c1 funded, c2 next required
  });

  it('coverage is by $ funded, not item count', () => {
    const p = computeQuote(baseConfig([core1, core2]), 1000, null); // only c1 ($1000 of $3000)
    expect(p.coreFunded).toBe(1);
    expect(p.coreCoverage).toBe(33); // 1000/3000
  });

  it('clamps an out-of-range budget to live bounds', () => {
    const p = computeQuote(baseConfig([core1], 8000), 13000, null); // max 8000
    expect(p.budget).toBe(8000);
  });

  it('handles an empty deliverable list without dividing by zero', () => {
    const p = computeQuote(baseConfig([]), 5000, null);
    expect(p.coreCoverage).toBe(100);
    expect(p.coreComplete).toBe(true);
    expect(p.spent).toBe(0);
  });
});
