import { describe, it, expect } from 'vitest';
import {
  priceItem, priceQuote, defaultValues, encodeState, decodeState, num, clamp,
  HOURS_FACTOR_KEY, HOURS_FACTOR_MIN,
  type CatalogItem, type Discipline, type PricingConfig, type ProjectOptions, type QuoteLine,
} from './quotePricing';

const rates = { shoot: 120, post: 100, design: 100, build: 140, motion: 150 };

const cfg: PricingConfig = {
  rates,
  turnaround: [
    { id: 'standard', label: 'Standard', desc: '', mult: 1 },
    { id: 'rush', label: 'Rush', desc: '', mult: 1.5 },
  ],
  travel: [
    { id: 'local', label: 'Local', desc: '', hours: 0, expenses: 0 },
    { id: 'away', label: 'Away', desc: '', hours: 5, expenses: 300 },
    { id: 'intl', label: 'Intl', desc: '', hours: 10, expenses: 0, poa: true },
  ],
  licences: [
    { id: 'organic', label: 'Organic', desc: '', fee: 0 },
    { id: 'national', label: 'National', desc: '', fee: 1800 },
    { id: 'buyout', label: 'Buyout', desc: '', fee: 0, poa: true },
  ],
  revisionsIncluded: 2,
  revisionHours: 4,
  revisionRate: 'design',
  depositPercent: 0.5,
  sourceFiles: { percent: 0.2, min: 250 },
};

const opts = (over: Partial<ProjectOptions> = {}): ProjectOptions => ({
  turnaround: 'standard', travel: 'local', licence: 'organic', extraRevisions: 0, sourceFiles: false, ...over,
});

const disc: Discipline = { id: 'd', label: 'D', blurb: '', items: [] };

const line = (item: CatalogItem, values = defaultValues(item)): QuoteLine =>
  ({ item, discipline: disc, values, breakdown: priceItem(item, values, rates) });

describe('priceItem', () => {
  it('base hours × craft rate', () => {
    const b = priceItem({ id: 'a', name: 'A', rate: 'design', baseHours: 10 }, {}, rates);
    expect(b.hours).toBe(10);
    expect(b.total).toBe(1000);
  });

  it('qty params add hours per unit', () => {
    const item: CatalogItem = {
      id: 'a', name: 'A', rate: 'post',
      params: [{ kind: 'qty', id: 'images', label: 'Images', unit: 'image', min: 1, max: 100, step: 1, default: 10, hoursPer: 0.5 }],
    };
    expect(priceItem(item, { images: 20 }, rates).total).toBe(20 * 0.5 * 100);
  });

  it('qty params clamp to their bounds', () => {
    const item: CatalogItem = {
      id: 'a', name: 'A', rate: 'post',
      params: [{ kind: 'qty', id: 'n', label: 'N', unit: 'n', min: 2, max: 8, step: 1, default: 4, hoursPer: 1 }],
    };
    expect(priceItem(item, { n: 9999 }, rates).hours).toBe(8);
    expect(priceItem(item, { n: -5 }, rates).hours).toBe(2);
  });

  it('multipliers apply to the whole line, including quantity hours', () => {
    const item: CatalogItem = {
      id: 'a', name: 'A', rate: 'shoot', baseHours: 2,
      params: [
        { kind: 'qty', id: 'h', label: 'H', unit: 'hour', min: 1, max: 12, step: 1, default: 4, hoursPer: 1 },
        { kind: 'choice', id: 'crew', label: 'Crew', default: 'solo', options: [
          { id: 'solo', label: 'Solo', hoursMult: 1 },
          { id: 'full', label: 'Full', hoursMult: 2 },
        ] },
      ],
    };
    // (2 base + 4 qty) × 2 = 12h
    expect(priceItem(item, { h: 4, crew: 'full' }, rates).hours).toBe(12);
  });

  it('fees are hard costs — never multiplied by hour multipliers', () => {
    const item: CatalogItem = {
      id: 'a', name: 'A', rate: 'shoot', baseHours: 1,
      params: [
        { kind: 'toggle', id: 'kit', label: 'Kit', feeAdd: 250 },
        { kind: 'choice', id: 'c', label: 'C', default: 'x', options: [{ id: 'x', label: 'X', hoursMult: 3 }] },
      ],
    };
    const b = priceItem(item, { kit: true, c: 'x' }, rates);
    expect(b.hours).toBe(3);
    expect(b.fees).toBe(250);
    expect(b.total).toBe(3 * 120 + 250);
  });

  it('an off toggle contributes nothing', () => {
    const item: CatalogItem = {
      id: 'a', name: 'A', rate: 'design', baseHours: 1,
      params: [{ kind: 'toggle', id: 't', label: 'T', hoursAdd: 10, feeAdd: 500 }],
    };
    expect(priceItem(item, { t: false }, rates).total).toBe(100);
  });

  it('unknown rate → $0 rather than NaN', () => {
    const b = priceItem({ id: 'a', name: 'A', rate: 'nope' as never, baseHours: 10 }, {}, rates);
    expect(b.total).toBe(0);
    expect(Number.isNaN(b.total)).toBe(false);
  });

  it('garbage values fall back to defaults instead of producing NaN', () => {
    const item: CatalogItem = {
      id: 'a', name: 'A', rate: 'design',
      params: [
        { kind: 'qty', id: 'n', label: 'N', unit: 'n', min: 1, max: 10, step: 1, default: 5, hoursPer: 1 },
        { kind: 'choice', id: 'c', label: 'C', default: 'x', options: [{ id: 'x', label: 'X', hoursAdd: 1 }] },
      ],
    };
    const b = priceItem(item, { n: 'banana' as never, c: 'missing' }, rates);
    expect(Number.isNaN(b.total)).toBe(false);
    expect(b.hours).toBe(6); // default qty 5 + fallback option's 1h
  });

  it('records a readable spec for the quote document', () => {
    const item: CatalogItem = {
      id: 'a', name: 'A', rate: 'shoot',
      params: [
        { kind: 'qty', id: 'h', label: 'H', unit: 'hour', min: 1, max: 12, step: 1, default: 4, hoursPer: 1 },
        { kind: 'choice', id: 'crew', label: 'Crew', default: 'solo', options: [{ id: 'solo', label: 'Just me' }] },
        { kind: 'toggle', id: 'kit', label: 'Lighting kit', feeAdd: 100 },
      ],
    };
    expect(priceItem(item, { h: 1, crew: 'solo', kit: true }, rates).spec)
      .toEqual(['1 hour', 'Just me', 'Lighting kit']);
  });
});

describe('priceQuote', () => {
  const tenHourDesign: CatalogItem = { id: 'a', name: 'A', rate: 'design', baseHours: 10 }; // $1000

  it('sums line items', () => {
    const t = priceQuote([line(tenHourDesign)], opts(), cfg);
    expect(t.total).toBe(1000);
    expect(t.hours).toBe(10);
  });

  it('rush multiplies production labour', () => {
    const t = priceQuote([line(tenHourDesign)], opts({ turnaround: 'rush' }), cfg);
    expect(t.rushAmount).toBe(500);
    expect(t.total).toBe(1500);
  });

  it('rush does not multiply travel, expenses or licence fees', () => {
    const shoot: CatalogItem = { id: 's', name: 'S', rate: 'shoot', baseHours: 10, licensable: true, onLocation: true };
    const std = priceQuote([line(shoot)], opts({ travel: 'away', licence: 'national' }), cfg);
    const rush = priceQuote([line(shoot)], opts({ turnaround: 'rush', travel: 'away', licence: 'national' }), cfg);
    // Only the 1200 labour is inflated; travel labour, expenses and licence are not.
    expect(rush.total - std.total).toBe(600);
    expect(rush.travelLabour).toBe(std.travelLabour);
    expect(rush.licenceFee).toBe(1800);
  });

  const onLocation: CatalogItem = { id: 'loc', name: 'Loc', rate: 'shoot', baseHours: 10, onLocation: true };

  it('travel bills time at the shoot rate plus expenses', () => {
    const t = priceQuote([line(onLocation)], opts({ travel: 'away' }), cfg);
    expect(t.travelLabour).toBe(5 * 120);
    expect(t.travelExpenses).toBe(300);
    expect(t.total).toBe(1200 + 600 + 300);
  });

  it('travel is not charged when nothing puts me on location', () => {
    // A logo or an edit costs the same wherever the client happens to be.
    const t = priceQuote([line(tenHourDesign)], opts({ travel: 'away' }), cfg);
    expect(t.travelLabour).toBe(0);
    expect(t.travelExpenses).toBe(0);
    expect(t.travelHours).toBe(0);
    expect(t.total).toBe(1000);
  });

  it('an international zone only flags POA when there is on-location work', () => {
    expect(priceQuote([line(tenHourDesign)], opts({ travel: 'intl' }), cfg).travelPoa).toBe(false);
    expect(priceQuote([line(onLocation)], opts({ travel: 'intl' }), cfg).travelPoa).toBe(true);
  });

  it('licensing only applies when something licensable is selected', () => {
    const t = priceQuote([line(tenHourDesign)], opts({ licence: 'national' }), cfg);
    expect(t.licenceFee).toBe(0);

    const shoot: CatalogItem = { id: 's', name: 'S', rate: 'shoot', baseHours: 1, licensable: true };
    expect(priceQuote([line(shoot)], opts({ licence: 'national' }), cfg).licenceFee).toBe(1800);
  });

  it('extra revisions are labour, and are affected by rush', () => {
    const t = priceQuote([line(tenHourDesign)], opts({ extraRevisions: 2 }), cfg);
    expect(t.revisionsHours).toBe(8);
    expect(t.revisionsCost).toBe(800);
    expect(t.total).toBe(1800);

    const r = priceQuote([line(tenHourDesign)], opts({ extraRevisions: 2, turnaround: 'rush' }), cfg);
    expect(r.total).toBe(1800 * 1.5);
  });

  it('source files are priced off labour, with a floor', () => {
    // 20% of $1000 = $200, below the $250 floor.
    expect(priceQuote([line(tenHourDesign)], opts({ sourceFiles: true }), cfg).sourceFilesFee).toBe(250);

    const big: CatalogItem = { id: 'b', name: 'B', rate: 'design', baseHours: 100 }; // $10,000
    expect(priceQuote([line(big)], opts({ sourceFiles: true }), cfg).sourceFilesFee).toBe(2000);
  });

  it('source files are free when there is no labour to release', () => {
    expect(priceQuote([], opts({ sourceFiles: true }), cfg).sourceFilesFee).toBe(0);
  });

  it('source files are not inflated by rush', () => {
    const t = priceQuote([line(tenHourDesign)], opts({ sourceFiles: true, turnaround: 'rush' }), cfg);
    expect(t.sourceFilesFee).toBe(250);
    expect(t.total).toBe(1500 + 250);
  });

  it('deposit is the configured share of the total', () => {
    expect(priceQuote([line(tenHourDesign)], opts(), cfg).deposit).toBe(500);
  });

  it('flags POA when travel or licensing cannot be fixed', () => {
    expect(priceQuote([line(onLocation)], opts({ travel: 'intl' }), cfg).hasPoa).toBe(true);

    const shoot: CatalogItem = { id: 's', name: 'S', rate: 'shoot', baseHours: 1, licensable: true };
    expect(priceQuote([line(shoot)], opts({ licence: 'buyout' }), cfg).hasPoa).toBe(true);
    expect(priceQuote([line(tenHourDesign)], opts(), cfg).hasPoa).toBe(false);
  });

  it('an empty quote totals zero, not NaN', () => {
    const t = priceQuote([], opts(), cfg);
    expect(t.total).toBe(0);
    expect(Number.isNaN(t.total)).toBe(false);
  });

  it('unknown option ids fall back to the first tier rather than breaking', () => {
    const t = priceQuote([line(tenHourDesign)], opts({ turnaround: 'nope', travel: 'nope', licence: 'nope' }), cfg);
    expect(Number.isNaN(t.total)).toBe(false);
    expect(t.rushMult).toBe(1);
  });
});

describe('buying fewer hours', () => {
  const tenHours: CatalogItem = { id: 'a', name: 'A', rate: 'design', baseHours: 10 }; // $1000

  it('defaults to the full recommended time', () => {
    const b = priceItem(tenHours, {}, rates);
    expect(b.hoursFactor).toBe(1);
    expect(b.hours).toBe(10);
    expect(b.recommendedHours).toBe(10);
    expect(b.reduced).toBe(false);
  });

  it('scales labour proportionally', () => {
    const b = priceItem(tenHours, { [HOURS_FACTOR_KEY]: 0.7 }, rates);
    expect(b.hours).toBeCloseTo(7);
    expect(b.recommendedHours).toBe(10);
    expect(b.total).toBeCloseTo(700);
    expect(b.reduced).toBe(true);
  });

  it('never discounts hard costs — gear hire costs what it costs', () => {
    const withKit: CatalogItem = {
      id: 'k', name: 'K', rate: 'shoot', baseHours: 10,
      params: [{ kind: 'toggle', id: 'kit', label: 'Kit', feeAdd: 250 }],
    };
    const full = priceItem(withKit, { kit: true }, rates);
    const cut = priceItem(withKit, { kit: true, [HOURS_FACTOR_KEY]: 0.6 }, rates);
    expect(cut.fees).toBe(250);
    expect(full.fees).toBe(250);
    expect(cut.total).toBeCloseTo(10 * 0.6 * 120 + 250);
  });

  it('clamps to the 60% floor', () => {
    expect(priceItem(tenHours, { [HOURS_FACTOR_KEY]: 0.1 }, rates).hoursFactor).toBe(HOURS_FACTOR_MIN);
    expect(priceItem(tenHours, { [HOURS_FACTOR_KEY]: 0 }, rates).hoursFactor).toBe(HOURS_FACTOR_MIN);
    expect(priceItem(tenHours, { [HOURS_FACTOR_KEY]: -5 }, rates).hoursFactor).toBe(HOURS_FACTOR_MIN);
  });

  it('refuses to sell more than the estimate', () => {
    expect(priceItem(tenHours, { [HOURS_FACTOR_KEY]: 3 }, rates).hoursFactor).toBe(1);
  });

  it('treats garbage as the full recommendation, never NaN', () => {
    const b = priceItem(tenHours, { [HOURS_FACTOR_KEY]: 'banana' as never }, rates);
    expect(b.hoursFactor).toBe(1);
    expect(Number.isNaN(b.total)).toBe(false);
  });

  it('applies after the param multipliers, not before', () => {
    const item: CatalogItem = {
      id: 'm', name: 'M', rate: 'design', baseHours: 10,
      params: [{ kind: 'choice', id: 'c', label: 'C', default: 'x', options: [{ id: 'x', label: 'X', hoursMult: 2 }] }],
    };
    const b = priceItem(item, { c: 'x', [HOURS_FACTOR_KEY]: 0.75 }, rates);
    expect(b.recommendedHours).toBe(20);
    expect(b.hours).toBe(15);
  });

  it('reports the shortfall across the whole quote', () => {
    const half = (over: Partial<CatalogItem>): QuoteLine => {
      const item = { id: 'x', name: 'X', rate: 'design' as const, baseHours: 10, ...over };
      const values = { [HOURS_FACTOR_KEY]: 0.8 };
      return { item, discipline: disc, values, breakdown: priceItem(item, values, rates) };
    };
    const t = priceQuote([half({ id: 'a' }), half({ id: 'b' })], opts(), cfg);
    expect(t.recommendedHours).toBe(20);
    expect(t.hours).toBeCloseTo(16);
    expect(t.recommendedLabour).toBe(2000);
    expect(t.total).toBeCloseTo(1600);
    expect(t.hoursFactor).toBeCloseTo(0.8);
    expect(t.reduced).toBe(true);
    expect(t.reducedCount).toBe(2);
  });

  it('counts only the lines actually reduced when they differ', () => {
    const mk = (id: string, factor: number): QuoteLine => {
      const item = { id, name: id, rate: 'design' as const, baseHours: 10 };
      const values = { [HOURS_FACTOR_KEY]: factor };
      return { item, discipline: disc, values, breakdown: priceItem(item, values, rates) };
    };
    const t = priceQuote([mk('a', 1), mk('b', 0.6)], opts(), cfg);
    expect(t.reducedCount).toBe(1);
    expect(t.hoursFactor).toBeCloseTo(0.8); // 16h bought of 20h recommended
  });

  it('an empty quote reads as a full quote, not a 0% one', () => {
    const t = priceQuote([], opts(), cfg);
    expect(t.hoursFactor).toBe(1);
    expect(t.reduced).toBe(false);
    expect(Number.isNaN(t.hoursFactor)).toBe(false);
  });

  it('a reduced quote still gets rushed on what was bought, not what was recommended', () => {
    const item: CatalogItem = { id: 'a', name: 'A', rate: 'design', baseHours: 10 };
    const values = { [HOURS_FACTOR_KEY]: 0.6 };
    const lines = [{ item, discipline: disc, values, breakdown: priceItem(item, values, rates) }];
    const t = priceQuote(lines, opts({ turnaround: 'rush' }), cfg);
    expect(t.labour).toBeCloseTo(600);
    expect(t.rushAmount).toBeCloseTo(300);
    expect(t.total).toBeCloseTo(900);
  });

  it('rides share links without extra plumbing', () => {
    const sel = { 'ph-shoot': { hours: 6, [HOURS_FACTOR_KEY]: 0.7 } };
    expect(decodeState(encodeState(sel, opts()))?.s).toEqual(sel);
  });
});

describe('share links', () => {
  it('round-trips selection and options', () => {
    const sel = { 'ph-shoot': { hours: 6, crew: 'full', lighting: true } };
    const o = opts({ travel: 'away', sourceFiles: true, extraRevisions: 1 });
    const decoded = decodeState(encodeState(sel, o));
    expect(decoded?.s).toEqual(sel);
    expect(decoded?.o).toEqual(o);
  });

  it('produces a URL-safe string', () => {
    const encoded = encodeState({ a: { b: 1 } }, opts());
    expect(encoded).toBe(encodeURIComponent(encoded));
  });

  it('survives non-ASCII values', () => {
    const sel = { a: { note: 'café — ñ' } };
    expect(decodeState(encodeState(sel, opts()))?.s).toEqual(sel);
  });

  it('returns null on garbage rather than throwing', () => {
    expect(decodeState('not-valid-base64!!!')).toBeNull();
    expect(decodeState('')).toBeNull();
    expect(decodeState(encodeState(null as never, opts()))).toBeNull();
  });
});

describe('coercion helpers', () => {
  it('num falls back instead of returning NaN', () => {
    expect(num('12')).toBe(12);
    expect(num('banana')).toBe(0);
    expect(num(undefined, 5)).toBe(5);
    expect(num(NaN, 3)).toBe(3);
  });

  it('clamp bounds both ends', () => {
    expect(clamp(5, 1, 3)).toBe(3);
    expect(clamp(0, 1, 3)).toBe(1);
  });
});
