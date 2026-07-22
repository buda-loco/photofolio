// Pricing engine for the self-serve quote builder at /quote.
//
// Everything is hours-driven: each catalogue item has base hours, and its
// parameters push those hours (and any hard costs) up or down. Hours are then
// billed at the rate for that item's craft. Project-level modifiers — rush,
// travel, licensing, extra revisions — sit on top.
//
// Pure and total: every function coerces garbage to 0 rather than returning
// NaN, because a live-updating price that reads "$NaN" is worse than a wrong
// one. Tests: src/lib/quotePricing.test.ts

/* ─────────────────────────── Types ─────────────────────────── */

export type RateId = 'shoot' | 'post' | 'design' | 'build' | 'motion';

/** A numeric stepper — "how many shoot hours", "how many edited images". */
export interface QtyParam {
  kind: 'qty';
  id: string;
  label: string;
  unit: string; // singular; pluralised with a naive +s
  min: number;
  max: number;
  step: number;
  default: number;
  hoursPer?: number; // billable hours added per unit
  feePer?: number; // hard cost ($) added per unit
  help?: string;
}

export interface ChoiceOption {
  id: string;
  label: string;
  desc?: string;
  hoursAdd?: number;
  hoursMult?: number;
  feeAdd?: number;
}

/** A one-of selector — crew size, retouch level, edit complexity. */
export interface ChoiceParam {
  kind: 'choice';
  id: string;
  label: string;
  default: string;
  options: ChoiceOption[];
  help?: string;
}

/** An on/off add-on — lighting package, drone, motion titles. */
export interface ToggleParam {
  kind: 'toggle';
  id: string;
  label: string;
  desc?: string;
  hoursAdd?: number;
  hoursMult?: number;
  feeAdd?: number;
  default?: boolean;
}

export type Param = QtyParam | ChoiceParam | ToggleParam;

export interface CatalogItem {
  id: string;
  name: string;
  desc?: string;
  rate: RateId;
  baseHours?: number;
  baseFee?: number;
  params?: Param[];
  /** Usage licensing applies to this item (i.e. it produces shot footage/stills). */
  licensable?: boolean;
  /** Requires being physically on location — the only reason travel is charged. */
  onLocation?: boolean;
}

export interface Discipline {
  id: string;
  label: string;
  blurb: string;
  items: CatalogItem[];
}

/**
 * How much of an item's recommended time the client is actually buying, stored
 * alongside the params under a reserved key so it rides share links for free.
 * 1 = the full recommended time. Below that, the deliverable is proportionally
 * shallower — fewer concepts, fewer passes, less polish — and the quote says so.
 */
export const HOURS_FACTOR_KEY = '__hoursFactor';

/**
 * The floor. Below 60% of recommended the work stops being deliverable, so the
 * builder refuses to quote a number and asks for a conversation instead.
 */
export const HOURS_FACTOR_MIN = 0.6;

/** Buying MORE than recommended isn't a thing — the estimate is the estimate. */
export const HOURS_FACTOR_MAX = 1;

/** User-chosen values for one item, keyed by param id. */
export type ParamValues = Record<string, number | string | boolean>;
/** The whole selection: item id → its param values. Presence = selected. */
export type Selection = Record<string, ParamValues>;

export interface ProjectOptions {
  turnaround: string;
  travel: string;
  licence: string;
  extraRevisions: number;
  /** Client keeps the working files (.ai/.psd/.indd, project + raw footage). */
  sourceFiles: boolean;
}

/* ─────────────────────────── Helpers ─────────────────────────── */

/** Coerce anything to a finite, non-negative number. */
export const num = (v: unknown, fallback = 0): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

export const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;

/** The default value for a param, used when the user hasn't touched it. */
export const paramDefault = (p: Param): number | string | boolean => {
  if (p.kind === 'qty') return clamp(num(p.default, p.min), p.min, p.max);
  if (p.kind === 'choice') return p.options.some((o) => o.id === p.default) ? p.default : p.options[0]?.id ?? '';
  return p.default ?? false;
};

/** Every param at its default — the state an item enters the quote with. */
export const defaultValues = (item: CatalogItem): ParamValues =>
  Object.fromEntries((item.params ?? []).map((p) => [p.id, paramDefault(p)]));

/* ─────────────────────── Per-item pricing ─────────────────────── */

export interface ItemBreakdown {
  /** Hours actually being bought — recommendedHours × hoursFactor. */
  hours: number;
  /** What the configured scope really needs, before any budget reduction. */
  recommendedHours: number;
  hoursFactor: number;
  reduced: boolean;
  /** Hard costs that are not labour (gear, per-unit fees). */
  fees: number;
  labour: number;
  total: number;
  /** Human-readable summary of the chosen params, for the quote document. */
  spec: string[];
}

/** The stored hours factor for an item, coerced into the allowed range. */
export const hoursFactorOf = (values: ParamValues | undefined): number => {
  const raw = values?.[HOURS_FACTOR_KEY];
  return clamp(num(raw, HOURS_FACTOR_MAX), HOURS_FACTOR_MIN, HOURS_FACTOR_MAX);
};

/**
 * Price one item under a set of param values.
 *
 * Additive hour/fee effects are summed first, then multipliers are applied to
 * the hour total — so "×1.8 for a full crew" scales the whole line, including
 * the hours the quantity stepper added, which is the behaviour people expect.
 */
export function priceItem(item: CatalogItem, values: ParamValues, rates: Record<string, number>): ItemBreakdown {
  let hours = Math.max(0, num(item.baseHours));
  let fees = Math.max(0, num(item.baseFee));
  let mult = 1;
  const spec: string[] = [];

  for (const p of item.params ?? []) {
    const raw = values?.[p.id];

    if (p.kind === 'qty') {
      const v = clamp(num(raw, num(p.default)), p.min, p.max);
      hours += num(p.hoursPer) * v;
      fees += num(p.feePer) * v;
      spec.push(plural(v, p.unit));
      continue;
    }

    if (p.kind === 'choice') {
      const id = typeof raw === 'string' ? raw : paramDefault(p);
      const opt = p.options.find((o) => o.id === id) ?? p.options.find((o) => o.id === p.default) ?? p.options[0];
      if (!opt) continue;
      hours += num(opt.hoursAdd);
      fees += num(opt.feeAdd);
      if (opt.hoursMult !== undefined) mult *= Math.max(0, num(opt.hoursMult, 1));
      spec.push(opt.label);
      continue;
    }

    // toggle
    if (raw === true) {
      hours += num(p.hoursAdd);
      fees += num(p.feeAdd);
      if (p.hoursMult !== undefined) mult *= Math.max(0, num(p.hoursMult, 1));
      spec.push(p.label);
    }
  }

  const recommendedHours = Math.max(0, hours * mult);

  // Buying less time scales the labour only. Gear hire and studio time are hard
  // costs — they don't get cheaper because the client bought fewer hours.
  const hoursFactor = hoursFactorOf(values);
  const finalHours = recommendedHours * hoursFactor;

  fees = Math.max(0, fees);
  const rate = Math.max(0, num(rates[item.rate]));
  const labour = finalHours * rate;

  return {
    hours: finalHours,
    recommendedHours,
    hoursFactor,
    reduced: hoursFactor < HOURS_FACTOR_MAX,
    fees,
    labour,
    total: labour + fees,
    spec,
  };
}

/* ─────────────────── Project-level modifiers ─────────────────── */

export interface TurnaroundTier {
  id: string;
  label: string;
  desc: string;
  mult: number;
}

export interface TravelZone {
  id: string;
  label: string;
  desc: string;
  /** Billable travel hours, charged at the shoot rate. */
  hours: number;
  /** Estimated hard costs — flights, accommodation, vehicle. */
  expenses: number;
  /** True when the real cost can't be known until the brief is scoped. */
  poa?: boolean;
}

export interface LicenceTier {
  id: string;
  label: string;
  desc: string;
  fee: number;
  poa?: boolean;
}

/* ─────────────────────── Whole-quote pricing ─────────────────── */

export interface QuoteLine {
  item: CatalogItem;
  discipline: Discipline;
  values: ParamValues;
  breakdown: ItemBreakdown;
}

export interface QuoteTotals {
  lines: QuoteLine[];
  /** Production labour before the rush multiplier. */
  labour: number;
  hours: number;
  /** Hours the configured scope needs at full depth. */
  recommendedHours: number;
  /** Labour those hours would cost — the yardstick for "you're buying X of Y". */
  recommendedLabour: number;
  /** Share of the recommended time being bought, across the whole quote. */
  hoursFactor: number;
  /** True when any line has been dialled below its recommendation. */
  reduced: boolean;
  reducedCount: number;
  /** Hard costs attached to individual line items. */
  itemFees: number;
  revisionsHours: number;
  revisionsCost: number;
  rushMult: number;
  rushAmount: number;
  travelHours: number;
  travelLabour: number;
  travelExpenses: number;
  travelPoa: boolean;
  licenceFee: number;
  licencePoa: boolean;
  sourceFilesFee: number;
  subtotal: number;
  total: number;
  deposit: number;
  /** True when some part of the price can't be fixed without a conversation. */
  hasPoa: boolean;
}

export interface PricingConfig {
  rates: Record<RateId, number>;
  turnaround: TurnaroundTier[];
  travel: TravelZone[];
  licences: LicenceTier[];
  revisionsIncluded: number;
  revisionHours: number;
  revisionRate: RateId;
  depositPercent: number;
  /** Releasing working files is priced off production labour, with a floor. */
  sourceFiles: { percent: number; min: number };
}

const pick = <T extends { id: string }>(list: T[], id: string): T | undefined =>
  list.find((o) => o.id === id) ?? list[0];

/**
 * Price the whole quote.
 *
 * Rush multiplies production labour only — not travel time (you can't drive to
 * Toowoomba faster because the deadline moved), not hard costs, and not the
 * licence fee, which is about usage rather than effort.
 */
export function priceQuote(
  lines: QuoteLine[],
  options: ProjectOptions,
  cfg: PricingConfig,
): QuoteTotals {
  const labour = lines.reduce((s, l) => s + l.breakdown.labour, 0);
  const hours = lines.reduce((s, l) => s + l.breakdown.hours, 0);
  const itemFees = lines.reduce((s, l) => s + l.breakdown.fees, 0);

  const recommendedHours = lines.reduce((s, l) => s + l.breakdown.recommendedHours, 0);
  const recommendedLabour = lines.reduce(
    (s, l) => s + l.breakdown.recommendedHours * Math.max(0, num(cfg.rates[l.item.rate])),
    0,
  );
  const reducedCount = lines.filter((l) => l.breakdown.reduced).length;

  const extra = Math.max(0, Math.round(num(options.extraRevisions)));
  const revisionsHours = extra * Math.max(0, num(cfg.revisionHours));
  const revisionsCost = revisionsHours * Math.max(0, num(cfg.rates[cfg.revisionRate]));

  const tier = pick(cfg.turnaround, options.turnaround);
  const rushMult = Math.max(0, num(tier?.mult, 1));
  const rushable = labour + revisionsCost;
  const rushAmount = rushable * (rushMult - 1);

  // Travel is only chargeable when something actually puts me on location —
  // an edit or a logo doesn't care where the client is.
  const anyOnLocation = lines.some((l) => l.item.onLocation);
  const zone = anyOnLocation ? pick(cfg.travel, options.travel) : undefined;
  const travelHours = Math.max(0, num(zone?.hours));
  const travelLabour = travelHours * Math.max(0, num(cfg.rates.shoot));
  const travelExpenses = Math.max(0, num(zone?.expenses));

  // Licensing only applies if something licensable was actually selected.
  const anyLicensable = lines.some((l) => l.item.licensable);
  const lic = anyLicensable ? pick(cfg.licences, options.licence) : undefined;
  const licenceFee = Math.max(0, num(lic?.fee));

  // Handing over working files is a value transfer, not extra effort — so it's
  // priced off the production labour it took to create them, never off rush or
  // expenses, and only when there's actually labour to release.
  const sourceFilesFee = options.sourceFiles && labour > 0
    ? Math.max(Math.max(0, num(cfg.sourceFiles?.min)), labour * Math.max(0, num(cfg.sourceFiles?.percent)))
    : 0;

  const subtotal =
    rushable + rushAmount + travelLabour + travelExpenses + itemFees + licenceFee + sourceFilesFee;
  const total = Math.max(0, subtotal);

  const travelPoa = !!zone?.poa;
  const licencePoa = !!lic?.poa;

  return {
    lines,
    labour,
    hours,
    recommendedHours,
    recommendedLabour,
    // No lines means nothing has been reduced — report a full quote, not 0%.
    hoursFactor: recommendedHours > 0 ? hours / recommendedHours : HOURS_FACTOR_MAX,
    reduced: reducedCount > 0,
    reducedCount,
    itemFees,
    revisionsHours,
    revisionsCost,
    rushMult,
    rushAmount,
    travelHours,
    travelLabour,
    travelExpenses,
    travelPoa,
    licenceFee,
    licencePoa,
    sourceFilesFee,
    subtotal,
    total,
    deposit: total * clamp(num(cfg.depositPercent), 0, 1),
    hasPoa: travelPoa || licencePoa,
  };
}

/* ──────────────── Share-link state encoding ──────────────── */

interface ShareState {
  s: Selection;
  o: ProjectOptions;
}

/** Base64url so the string survives a URL without escaping. */
const toB64 = (s: string) => {
  const b64 = typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(s))) : Buffer.from(s, 'utf8').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromB64 = (s: string) => {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  return typeof atob === 'function'
    ? decodeURIComponent(escape(atob(b64)))
    : Buffer.from(b64, 'base64').toString('utf8');
};

export function encodeState(selection: Selection, options: ProjectOptions): string {
  try {
    return toB64(JSON.stringify({ s: selection, o: options } satisfies ShareState));
  } catch {
    return '';
  }
}

/** Returns null on anything malformed — a bad link must not break the page. */
export function decodeState(encoded: string): ShareState | null {
  try {
    const parsed = JSON.parse(fromB64(encoded)) as ShareState;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.s || typeof parsed.s !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}
