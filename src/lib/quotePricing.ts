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

/**
 * Marks a param that describes the client's own situation rather than how
 * thorough the work is — how much footage they already have, whose artwork it
 * is. Presets leave these alone: "complete" shouldn't claim you have five hours
 * of rushes when you don't.
 */
export interface DescriptiveParam {
  descriptive?: boolean;
}

/** A numeric stepper — "how many shoot hours", "how many edited images". */
export interface QtyParam extends DescriptiveParam {
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
export interface ChoiceParam extends DescriptiveParam {
  kind: 'choice';
  id: string;
  label: string;
  default: string;
  options: ChoiceOption[];
  help?: string;
}

/** An on/off add-on — lighting package, drone, motion titles. */
export interface ToggleParam extends DescriptiveParam {
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
  /** Which scope tier newly-added items adopt. */
  preset: PresetId;
  /**
   * Sole focus of the day rather than one of several jobs in progress. Costs
   * more and finishes sooner — the only speed lever there is, deliberately, so
   * a quote can't promise a deadline its own hours contradict.
   */
  priority: boolean;
  /** 'YYYY-MM-DD', or '' before the client has picked one. */
  startDate: string;
  travel: string;
  licence: string;
  extraRevisions: number;
  /** Client keeps the working files (.ai/.psd/.indd, project + raw footage). */
  sourceFiles: boolean;
  /** Whatever the client typed in the discount box. Matched case-insensitively. */
  promoCode: string;
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

/* ─────────────────────────── Presets ─────────────────────────── */

export type PresetId = 'minimum' | 'recommended' | 'complete';

export const PRESETS: PresetId[] = ['minimum', 'recommended', 'complete'];

/**
 * How far a preset moves a quantity from its recommended value. Deliberately a
 * step either side rather than the param's own min/max — "complete" on a
 * 300-page editorial ceiling would be absurd, and a 1-image shoot isn't a job.
 */
const QTY_FACTOR: Record<PresetId, number> = {
  minimum: 0.5,
  recommended: 1,
  complete: 1.5,
};

/**
 * Rough cost of a choice, used to find the leanest and richest option without
 * relying on the order they happen to be authored in.
 */
const optionWeight = (o: ChoiceOption): number =>
  num(o.hoursMult, 1) * 1000 + num(o.hoursAdd) * 10 + num(o.feeAdd) / 100;

/** One param's value under a preset. */
export const presetParamValue = (p: Param, preset: PresetId): number | string | boolean => {
  if (preset === 'recommended' || p.descriptive) return paramDefault(p);

  if (p.kind === 'qty') {
    const scaled = num(p.default, p.min) * QTY_FACTOR[preset];
    const snapped = p.step > 0 ? Math.round(scaled / p.step) * p.step : Math.round(scaled);
    return clamp(snapped, p.min, p.max);
  }

  if (p.kind === 'choice') {
    if (!p.options.length) return paramDefault(p);
    const sorted = [...p.options].sort((a, b) => optionWeight(a) - optionWeight(b));
    return (preset === 'minimum' ? sorted[0] : sorted[sorted.length - 1]).id;
  }

  // Optional extras: stripped out at minimum, all in at complete.
  return preset === 'complete';
};

/** Every param set to the given preset. */
export const presetValues = (item: CatalogItem, preset: PresetId): ParamValues =>
  Object.fromEntries((item.params ?? []).map((p) => [p.id, presetParamValue(p, preset)]));

/** Every param at its default — the state an item enters the quote with. */
export const defaultValues = (item: CatalogItem): ParamValues => presetValues(item, 'recommended');

/**
 * Whether an item currently sits exactly on a preset. The hours dial is a
 * separate budget lever, so it's ignored — dialling time down doesn't stop a
 * scope being "complete".
 */
export const itemMatchesPreset = (item: CatalogItem, values: ParamValues, preset: PresetId): boolean => {
  const target = presetValues(item, preset);
  return Object.entries(target).every(([id, v]) => values?.[id] === v);
};

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

export interface PromoCode {
  /** Compared lower-cased and trimmed. */
  code: string;
  /** Share off, as a fraction. 0.25 = 25%. */
  percent: number;
  label: string;
}

export interface ScheduleConfig {
  /** Hours a day a normal job gets, sharing the week with other work. */
  hoursPerDay: number;
  /** Hours a day when it's the only project on the desk. */
  priorityHoursPerDay: number;
  /** Price uplift for that exclusivity, as a fraction. */
  priorityUplift: number;
  /** Days of notice before work can start. */
  leadDays: number;
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
  /** Uplift charged for sole focus, as a fraction (0 when not priority). */
  priorityUplift: number;
  priorityAmount: number;
  travelHours: number;
  travelLabour: number;
  travelExpenses: number;
  travelPoa: boolean;
  licenceFee: number;
  licencePoa: boolean;
  sourceFilesFee: number;
  /** The matched code, or null when the box is empty or the code is wrong. */
  promo: PromoCode | null;
  /** True only when something was typed and it didn't match. */
  promoInvalid: boolean;
  discountAmount: number;
  /** What the quote would cost without the code — for the struck-through price. */
  subtotalBeforeDiscount: number;
  subtotal: number;
  total: number;
  deposit: number;
  /** True when some part of the price can't be fixed without a conversation. */
  hasPoa: boolean;
  schedule: Schedule;
}

export interface Schedule {
  /** Hours a day this job gets — the standard pace, or the priority pace. */
  hoursPerDay: number;
  /** Every hour that has to be worked, including revisions and travel. */
  totalHours: number;
  /** Working days needed, Mon–Fri. 0 when nothing is selected yet. */
  workingDays: number;
  /** 'YYYY-MM-DD', or null until a start date is chosen. */
  start: string | null;
  end: string | null;
  /** Elapsed calendar days from start to delivery, weekends included. */
  calendarDays: number;
}

export interface PricingConfig {
  rates: Record<RateId, number>;
  schedule: ScheduleConfig;
  promos: PromoCode[];
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

/* ──────────────────────── Delivery calendar ──────────────────────── */

// All date maths runs at midday UTC. Parsing 'YYYY-MM-DD' as local midnight
// shifts the day backwards for anyone west of Greenwich; midday is far enough
// from either boundary that no timezone or DST shift can move the date.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const parseISODate = (value: string | null | undefined): Date | null => {
  if (!value || !ISO_DATE.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  // Rejects impossible dates like 2026-02-31, which Date would roll over.
  if (date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return date;
};

export const toISODate = (d: Date): string => d.toISOString().slice(0, 10);

const isWeekend = (d: Date) => d.getUTCDay() === 0 || d.getUTCDay() === 6;

/** The given day, or the next Monday if it lands on a weekend. */
export const nextWorkingDay = (d: Date): Date => {
  const out = new Date(d.getTime());
  while (isWeekend(out)) out.setUTCDate(out.getUTCDate() + 1);
  return out;
};

/** The last day of a run of `days` working days, counting the start as day 1. */
export const addWorkingDays = (start: Date, days: number): Date => {
  const out = nextWorkingDay(start);
  let remaining = Math.max(1, Math.floor(days)) - 1;
  while (remaining > 0) {
    out.setUTCDate(out.getUTCDate() + 1);
    if (!isWeekend(out)) remaining -= 1;
  }
  return out;
};

/** The earliest date work can begin, given the notice period. */
export const earliestStart = (today: Date, leadDays: number): Date => {
  const out = new Date(today.getTime());
  out.setUTCDate(out.getUTCDate() + Math.max(0, Math.floor(num(leadDays))));
  return nextWorkingDay(out);
};

/**
 * Turn a pile of hours into a delivery estimate.
 *
 * Deliberately coarse: hours ÷ hours-per-day, rounded up, spread over working
 * days. It is an indication of when work finishes, not a commitment — the UI
 * and the quote document both say so.
 */
export function computeSchedule(
  totalHours: number,
  options: ProjectOptions,
  cfg: PricingConfig,
): Schedule {
  const hoursPerDay = Math.max(
    0.5,
    num(options.priority ? cfg.schedule?.priorityHoursPerDay : cfg.schedule?.hoursPerDay, 2),
  );
  const hours = Math.max(0, num(totalHours));
  const workingDays = hours > 0 ? Math.max(1, Math.ceil(hours / hoursPerDay)) : 0;

  const parsed = parseISODate(options.startDate);
  const start = parsed ? nextWorkingDay(parsed) : null;
  const end = start && workingDays > 0 ? addWorkingDays(start, workingDays) : null;

  const calendarDays = start && end
    ? Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
    : 0;

  return {
    hoursPerDay,
    totalHours: hours,
    workingDays,
    start: start ? toISODate(start) : null,
    end: end ? toISODate(end) : null,
    calendarDays,
  };
}

/**
 * Price the whole quote.
 *
 * Priority multiplies production labour only — not travel time (you can't drive
 * to Toowoomba faster because the deadline moved), not hard costs, and not the
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

  const productionLabour = labour + revisionsCost;
  const priorityUplift = options.priority ? Math.max(0, num(cfg.schedule?.priorityUplift)) : 0;
  const priorityAmount = productionLabour * priorityUplift;

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

  const beforeDiscount =
    productionLabour + priorityAmount + travelLabour + travelExpenses + itemFees + licenceFee + sourceFilesFee;

  // A discount comes off my time and margin — never off money I've already paid
  // out. Knocking 45% off a studio hire or a flight isn't a discount, it's a
  // loss, so hard costs (itemFees, travelExpenses) are excluded from the base.
  const typed = String(options.promoCode ?? '').trim().toLowerCase();
  const promo = typed
    ? (cfg.promos ?? []).find((p) => p.code.trim().toLowerCase() === typed) ?? null
    : null;
  const discountable = productionLabour + priorityAmount + travelLabour + licenceFee + sourceFilesFee;
  const discountAmount = promo
    ? Math.max(0, discountable * clamp(num(promo.percent), 0, 1))
    : 0;

  const subtotal = beforeDiscount - discountAmount;
  const total = Math.max(0, subtotal);

  const travelPoa = !!zone?.poa;
  const licencePoa = !!lic?.poa;

  const schedule = computeSchedule(hours + revisionsHours + travelHours, options, cfg);

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
    priorityUplift,
    priorityAmount,
    travelHours,
    travelLabour,
    travelExpenses,
    travelPoa,
    licenceFee,
    licencePoa,
    sourceFilesFee,
    promo,
    promoInvalid: typed !== '' && promo === null,
    discountAmount,
    subtotalBeforeDiscount: beforeDiscount,
    subtotal,
    total,
    deposit: total * clamp(num(cfg.depositPercent), 0, 1),
    hasPoa: travelPoa || licencePoa,
    schedule,
  };
}

/* ─────────────────────── Quote reference ─────────────────────── */

/**
 * Turn a client's name into the identifying part of a quote reference.
 *
 * Accents are folded rather than stripped so "García Posse" reads GARCIAPOSSE
 * instead of GARCAPOSSE, and anything non-alphanumeric goes — a reference ends
 * up in filenames, subject lines and spoken over the phone.
 */
export const quoteSlug = (value: string, maxLength = 14): string =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, maxLength);

/**
 * The reference a quote is known by. Named after the client, because
 * "NORTHLIGHT-260723" is something both of us can find again — a random suffix
 * is only ever a lookup key for one of us.
 */
export const quoteReference = (prefix: string, client: string, stamp: string): string => {
  const slug = quoteSlug(client);
  return slug ? `${prefix}-${slug}-${stamp}` : `${prefix}-${stamp}`;
};

/* ──────────────── Share-link state encoding ──────────────── */

interface ShareState {
  s: Selection;
  o: ProjectOptions;
  /** Which step to open on. Absent in links written before this existed. */
  p?: number;
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

export function encodeState(selection: Selection, options: ProjectOptions, step?: number): string {
  try {
    const state: ShareState = { s: selection, o: options };
    if (typeof step === 'number') state.p = step;
    return toB64(JSON.stringify(state));
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
