import { describe, it, expect } from 'vitest';
import {
  cost, hoursOf, normalizeQuote, computeQuote, rateMapOf, clamp,
  type QuoteConfig, type Deliverable, type Phase,
} from './quote';

const rates = { strategy: 50, design: 100 };

const hourly = (over: Partial<Deliverable> = {}): Deliverable =>
  ({ id: 'h', name: 'H', pricing: 'hourly', category: 'design', hours: 10, ...over } as Deliverable);

const fixed = (over: Partial<Deliverable> = {}): Deliverable =>
  ({ id: 'f', name: 'F', pricing: 'fixed', amount: 2000, ...over } as Deliverable);

const phase = (id: string, tier: 'core' | 'extra', deliverables: Deliverable[]): Phase =>
  ({ id, label: id, tier, deliverables });

const baseConfig = (phases: Phase[], max = 25000, discounts: { minHours: number; percent: number }[] = [], promoCode = ''): QuoteConfig => ({
  slug: 't', client: 'T', currency: 'AUD', title: 'x', lead: '', contactEmail: 'a@b.c',
  workTypes: [{ id: 'strategy', label: 'S', rate: 50 }, { id: 'design', label: 'D', rate: 100 }],
  phases,
  discounts,
  promoCode,
  focusOptions: [{ id: 'balanced', label: 'Balanced', category: null }],
  budget: { min: 0, max, step: 500, default: 13000 },
});

describe('cost', () => {
  it('hourly = hours × rate', () => expect(cost(hourly({ category: 'design', hours: 10 }), rates)).toBe(1000));
  it('fixed = amount, ignores hours/rate', () => expect(cost(fixed({ amount: 2500 }), rates)).toBe(2500));
  it('unknown work-type → $0, never NaN', () => expect(cost(hourly({ category: 'nope', hours: 10 }), rates)).toBe(0));
  it('negative / garbage → 0, never NaN', () => {
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
  it('builds phases with nested deliverables', () => {
    const cfg = normalizeQuote({
      phases: [{ id: 'p1', label: 'Phase 1', tier: 'core', deliverables: [{ _template: 'hourly', id: 'a', category: 'design', hours: 5 }] }],
    });
    expect(cfg.phases).toHaveLength(1);
    expect(cfg.phases[0].tier).toBe('core');
    expect(cfg.phases[0].deliverables[0].pricing).toBe('hourly');
  });
  it('maps _template / __typename to pricing in nested deliverables', () => {
    const cfg = normalizeQuote({
      phases: [{ id: 'p', label: 'P', tier: 'extra', deliverables: [
        { _template: 'fixed', amount: 900 },
        { __typename: 'QuotesPhasesDeliverablesHourly', category: 'design', hours: 5 },
      ] }],
    });
    expect(cfg.phases[0].deliverables[0].pricing).toBe('fixed');
    expect(cfg.phases[0].deliverables[1].pricing).toBe('hourly');
  });
  it('back-compat: builds phases from old flat deliverables', () => {
    const cfg = normalizeQuote({
      deliverables: [
        { id: 'a', name: 'A', phase: 'Strategy', tier: 'core', pricing: 'hourly', category: 'design', hours: 5 },
        { id: 'b', name: 'B', phase: 'Extras', tier: 'extra', pricing: 'fixed', amount: 500 },
      ],
    });
    expect(cfg.phases.map((p) => p.label)).toEqual(['Strategy', 'Extras']);
    expect(cfg.phases[1].tier).toBe('extra');
  });
  it('drops invalid deliverables and never throws', () => {
    const cfg = normalizeQuote({ phases: [{ id: 'p', label: 'P', tier: 'core', deliverables: [null, 42, { name: 'ok' }] }] });
    expect(cfg.phases[0].deliverables).toHaveLength(1);
  });
  it('parses + sorts + filters discounts', () => {
    const cfg = normalizeQuote({ discounts: [{ minHours: 120, percent: 10 }, { minHours: 0, percent: 5 }, { minHours: 80, percent: 5 }, { minHours: 50, percent: 0 }] });
    expect(cfg.discounts).toEqual([{ minHours: 80, percent: 5 }, { minHours: 120, percent: 10 }]);
  });
  it('repairs a broken budget', () => {
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

describe('computeQuote', () => {
  const core1 = hourly({ id: 'c1', category: 'design', hours: 10 }); // 1000, 10h
  const core2 = fixed({ id: 'c2', amount: 2000 });                    // 2000, 0h
  const extra1 = hourly({ id: 'e1', category: 'design', hours: 10 }); // 1000, 10h
  const cfg = baseConfig([phase('core', 'core', [core1, core2]), phase('extras', 'extra', [extra1])]);

  it('funds core first; extra excluded when budget only covers core', () => {
    const p = computeQuote(cfg, 3000, null);
    expect(p.coreComplete).toBe(true);
    expect(p.includedIds.has('e1')).toBe(false);
    expect(p.spent).toBe(3000);
  });

  it('mixes hourly + fixed in core cost', () => {
    expect(computeQuote(cfg, 5000, null).coreCost).toBe(3000);
  });

  it('reports a shortfall when budget < core cost', () => {
    const p = computeQuote(cfg, 1500, null);
    expect(p.coreComplete).toBe(false);
    expect(p.coreShortfall).toBe(1500);
    expect(p.nextCore?.id).toBe('c2');
  });

  it('coverage is by $ funded', () => {
    const p = computeQuote(cfg, 1000, null);
    expect(p.coreFunded).toBe(1);
    expect(p.coreCoverage).toBe(33);
  });

  it('clamps an out-of-range budget', () => {
    expect(computeQuote(baseConfig([phase('core', 'core', [core1])], 8000), 13000, null).budget).toBe(8000);
  });

  it('handles empty phases without dividing by zero', () => {
    const p = computeQuote(baseConfig([]), 5000, null);
    expect(p.coreCoverage).toBe(100);
    expect(p.coreComplete).toBe(true);
    expect(p.spent).toBe(0);
  });
});

describe('computeQuote — volume discount', () => {
  it('applies the reached tier to hourly work only', () => {
    // 30h hourly ($3000) + 1 fixed ($1000, 5 estHours) = 35 in-scope hours
    const big = hourly({ id: 'b', category: 'design', hours: 30 });   // 3000, 30h
    const fx = fixed({ id: 'fx', amount: 1000, estHours: 5 } as Partial<Deliverable>); // 1000, 5h
    const cfg = baseConfig([phase('core', 'core', [big, fx])], 25000, [{ minHours: 20, percent: 10 }]);
    const p = computeQuote(cfg, 4000, null);
    expect(p.hours).toBe(35);
    expect(p.discountPercent).toBe(10);
    expect(p.hourlySpent).toBe(3000);
    expect(p.discountAmount).toBe(300);          // 10% of hourly only
    expect(p.finalSpent).toBe(3700);             // 4000 spent − 300
  });

  it('no discount below threshold', () => {
    const small = hourly({ id: 's', category: 'design', hours: 10 }); // 10h
    const cfg = baseConfig([phase('core', 'core', [small])], 25000, [{ minHours: 20, percent: 10 }]);
    const p = computeQuote(cfg, 2000, null);
    expect(p.discountPercent).toBe(0);
    expect(p.finalSpent).toBe(p.spent);
  });

  it('picks the highest reached tier', () => {
    const big = hourly({ id: 'b', category: 'design', hours: 40 }); // 40h, $4000
    const cfg = baseConfig([phase('core', 'core', [big])], 25000, [{ minHours: 20, percent: 5 }, { minHours: 35, percent: 12 }]);
    const p = computeQuote(cfg, 4000, null);
    expect(p.discountPercent).toBe(12);
    expect(p.discountMinHours).toBe(35);
  });
});

describe('computeQuote — promo gate', () => {
  const big = hourly({ id: 'b', category: 'design', hours: 30 }); // 30h, $3000
  const gated = baseConfig([phase('core', 'core', [big])], 25000, [{ minHours: 20, percent: 10 }], 'SAVE10');

  it('is locked (no discount) without a code', () => {
    const p = computeQuote(gated, 3000, null, '');
    expect(p.promoRequired).toBe(true);
    expect(p.promoUnlocked).toBe(false);
    expect(p.discountPercent).toBe(0);
    expect(p.finalSpent).toBe(p.spent);
  });

  it('unlocks with the correct code (case/space-insensitive)', () => {
    const p = computeQuote(gated, 3000, null, '  save10 ');
    expect(p.promoUnlocked).toBe(true);
    expect(p.discountPercent).toBe(10);
    expect(p.finalSpent).toBe(2700);
  });

  it('stays locked with a wrong code', () => {
    expect(computeQuote(gated, 3000, null, 'nope').discountPercent).toBe(0);
  });

  it('applies openly when no promo code is configured', () => {
    const open = baseConfig([phase('core', 'core', [big])], 25000, [{ minHours: 20, percent: 10 }]);
    const p = computeQuote(open, 3000, null, '');
    expect(p.promoRequired).toBe(false);
    expect(p.discountPercent).toBe(10);
  });
});
