// Pure, dependency-free quote logic. Safe for both server and client.
// No fs, no React — just types + math, so it's unit-testable in isolation.

// ── Types ────────────────────────────────────────────────────────

export interface WorkType {
  id: string;     // referenced by hourly deliverables' `category`
  label: string;
  rate: number;   // per-hour
}

interface DeliverableBase {
  id: string;
  name: string;
  phase: string;
  tier: 'core' | 'extra';
}

// Discriminated on `pricing`:
//  hourly → cost = hours × rate(category)
//  fixed  → cost = amount   (estHours is display-only, ignored by the math)
export type Deliverable =
  | (DeliverableBase & { pricing: 'hourly'; category: string; hours: number })
  | (DeliverableBase & { pricing: 'fixed'; amount: number; estHours?: number });

export interface FocusOption {
  id: string;
  label: string;
  category: string | null; // null = balanced; else boosts that work-type among extras
}

export interface QuoteConfig {
  slug: string;
  client: string;
  currency: string;
  eyebrow?: string;
  title: string;
  lead: string;
  contactEmail: string;
  workTypes: WorkType[];
  deliverables: Deliverable[];
  focusOptions: FocusOption[];
  budget: { min: number; max: number; step: number; default: number };
}

// ── Helpers ──────────────────────────────────────────────────────

const num = (v: unknown, fallback = 0): number => {
  const n = typeof v === 'string' ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : fallback;
};

const str = (v: unknown, fallback = ''): string =>
  typeof v === 'string' ? v : fallback;

/** Map of work-type id → hourly rate. */
export const rateMapOf = (workTypes: WorkType[]): Record<string, number> =>
  Object.fromEntries(workTypes.map((w) => [w.id, w.rate]));

/** Cost of a deliverable. ALWAYS finite — never NaN — even on bad data. */
export const cost = (d: Deliverable, rates: Record<string, number>): number => {
  if (d.pricing === 'fixed') return Math.max(0, num(d.amount));
  const rate = num(rates[d.category]); // unknown category → 0
  return Math.max(0, num(d.hours) * rate);
};

/** Hours a deliverable represents (fixed jobs contribute their estHours, if any). */
export const hoursOf = (d: Deliverable): number =>
  d.pricing === 'fixed' ? num(d.estHours) : num(d.hours);

// ── Normalisation ────────────────────────────────────────────────
// CMS authors will eventually save half-finished docs. This coerces any
// raw shape (local JSON or Tina GraphQL, incl. _template/__typename) into a
// valid QuoteConfig so the page degrades gracefully instead of throwing/NaN-ing.

/* eslint-disable @typescript-eslint/no-explicit-any */

const pricingOf = (d: any): 'hourly' | 'fixed' => {
  if (d?.pricing === 'fixed' || d?.pricing === 'hourly') return d.pricing;
  const t = String(d?._template ?? d?.__typename ?? '').toLowerCase();
  return t.includes('fixed') ? 'fixed' : 'hourly';
};

const normalizeDeliverable = (d: any, i: number): Deliverable | null => {
  if (!d || typeof d !== 'object') return null;
  const base = {
    id: str(d.id) || `item-${i}`,
    name: str(d.name) || 'Untitled deliverable',
    phase: str(d.phase) || 'Scope',
    tier: d.tier === 'extra' ? ('extra' as const) : ('core' as const),
  };
  if (pricingOf(d) === 'fixed') {
    return { ...base, pricing: 'fixed', amount: Math.max(0, num(d.amount)), estHours: d.estHours != null ? Math.max(0, num(d.estHours)) : undefined };
  }
  return { ...base, pricing: 'hourly', category: str(d.category), hours: Math.max(0, num(d.hours)) };
};

const normalizeBudget = (b: any) => {
  let min = Math.max(0, num(b?.min, 0));
  let max = Math.max(min, num(b?.max, Math.max(min, 25000)));
  if (max <= min) max = min + 1000;
  const step = Math.max(1, num(b?.step, 500));
  const mid = Math.round((min + max) / 2);
  const def = clamp(num(b?.default, mid), min, max);
  return { min, max, step, default: def };
};

export const clamp = (v: number, lo: number, hi: number): number =>
  Math.min(Math.max(num(v, lo), lo), hi);

export function normalizeQuote(raw: any, slug = 'quote'): QuoteConfig {
  const workTypes: WorkType[] = Array.isArray(raw?.workTypes)
    ? raw.workTypes
        .filter((w: any) => w && str(w.id))
        .map((w: any) => ({ id: str(w.id), label: str(w.label) || str(w.id), rate: Math.max(0, num(w.rate)) }))
    : [];

  const deliverables = Array.isArray(raw?.deliverables)
    ? (raw.deliverables.map(normalizeDeliverable).filter(Boolean) as Deliverable[])
    : [];

  // Warn (build/dev log) when an hourly job points at a missing work-type.
  const ids = new Set(workTypes.map((w) => w.id));
  for (const d of deliverables) {
    if (d.pricing === 'hourly' && d.category && !ids.has(d.category)) {
      // eslint-disable-next-line no-console
      console.warn(`[quote:${slug}] deliverable "${d.id}" references unknown work-type "${d.category}" — priced at $0`);
    }
  }

  const focusOptions: FocusOption[] = Array.isArray(raw?.focusOptions)
    ? raw.focusOptions.map((o: any, i: number) => ({
        id: str(o?.id) || `focus-${i}`,
        label: str(o?.label) || 'Balanced',
        category: o?.category ? str(o.category) : null,
      }))
    : [{ id: 'balanced', label: 'Balanced', category: null }];

  return {
    slug: str(raw?.slug) || slug,
    client: str(raw?.client) || 'Client',
    currency: str(raw?.currency) || 'AUD',
    eyebrow: raw?.eyebrow ? str(raw.eyebrow) : undefined,
    title: str(raw?.title) || 'Scope & pricing',
    lead: str(raw?.lead),
    contactEmail: str(raw?.contactEmail) || 'hello@example.com',
    workTypes,
    deliverables,
    focusOptions,
    budget: normalizeBudget(raw?.budget),
  };
}

// ── The calculation ──────────────────────────────────────────────

export interface QuotePlan {
  rates: Record<string, number>;
  core: Deliverable[];
  extras: Deliverable[];
  corePhases: string[];
  included: Deliverable[];
  includedIds: Set<string>;
  budget: number;          // clamped to config bounds
  spent: number;
  remaining: number;
  coreCost: number;
  coreSpent: number;
  coreCoverage: number;    // 0..100, by $ funded (hours stop being universal once fixed jobs exist)
  coreTotal: number;
  coreFunded: number;
  coreComplete: boolean;
  extrasFunded: number;
  coreShortfall: number;
  hours: number;
  nextCore?: Deliverable;
  nextExtra?: Deliverable;
}

/** Fund CORE first (config order), then EXTRAS (ordered by focus). Greedy. */
export function computeQuote(config: QuoteConfig, rawBudget: number, focus: string | null): QuotePlan {
  const rates = rateMapOf(config.workTypes);
  const budget = clamp(rawBudget, config.budget.min, config.budget.max);
  const c = (d: Deliverable) => cost(d, rates);

  const core = config.deliverables.filter((d) => d.tier === 'core');
  const extras = config.deliverables.filter((d) => d.tier === 'extra');

  const rankedExtras = extras
    .map((d, i) => ({ d, i }))
    .sort((a, b) => {
      if (focus) {
        const aMatch = a.d.pricing === 'hourly' && a.d.category === focus;
        const bMatch = b.d.pricing === 'hourly' && b.d.category === focus;
        const f = Number(bMatch) - Number(aMatch);
        if (f) return f;
      }
      return a.i - b.i;
    })
    .map(({ d }) => d);

  const included: Deliverable[] = [];
  const excluded: Deliverable[] = [];
  let spent = 0;
  for (const d of [...core, ...rankedExtras]) {
    if (spent + c(d) <= budget) {
      included.push(d);
      spent += c(d);
    } else {
      excluded.push(d);
    }
  }

  const includedIds = new Set(included.map((d) => d.id));
  const coreCost = core.reduce((s, d) => s + c(d), 0);
  const coreSpent = included.filter((d) => d.tier === 'core').reduce((s, d) => s + c(d), 0);
  const coreFunded = included.filter((d) => d.tier === 'core').length;

  return {
    rates,
    core,
    extras,
    corePhases: [...new Set(core.map((d) => d.phase))],
    included,
    includedIds,
    budget,
    spent,
    remaining: budget - spent,
    coreCost,
    coreSpent,
    coreCoverage: coreCost > 0 ? Math.round((coreSpent / coreCost) * 100) : 100,
    coreTotal: core.length,
    coreFunded,
    coreComplete: coreFunded === core.length,
    extrasFunded: included.filter((d) => d.tier === 'extra').length,
    coreShortfall: Math.max(0, coreCost - budget),
    hours: included.reduce((s, d) => s + hoursOf(d), 0),
    nextCore: excluded.find((d) => d.tier === 'core'),
    nextExtra: excluded
      .filter((d) => d.tier === 'extra')
      .sort((a, b) => c(a) - c(b))
      .find((d) => c(d) > budget - spent),
  };
}
