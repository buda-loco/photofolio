// Pure, dependency-free quote logic. Safe for both server and client.
// No fs, no React — just types + math, so it's unit-testable in isolation.
//
// Data model:
//   QuoteConfig
//     ├─ workTypes[]            (hourly rates, referenced by deliverable.category)
//     ├─ phases[]               (ordered; each is core or extra)
//     │    └─ deliverables[]    (hourly = hours×rate | fixed = flat amount)
//     └─ discounts[]            (volume bundles: minHours → percent off hourly work)
//
// Funding: core phases first (config order), then extra phases (focus-ordered),
// greedily up to budget at FULL rates. The volume discount is then applied to
// the funded hourly work as a saving — the client pays less than the budget.

// ── Types ────────────────────────────────────────────────────────

export interface WorkType {
  id: string;     // referenced by hourly deliverables' `category`
  label: string;
  rate: number;   // per-hour
}

interface DeliverableBase {
  id: string;
  name: string;
}

// Discriminated on `pricing`:
//  hourly → cost = hours × rate(category)
//  fixed  → cost = amount   (estHours is display-only, ignored by the cost math)
export type Deliverable =
  | (DeliverableBase & { pricing: 'hourly'; category: string; hours: number })
  | (DeliverableBase & { pricing: 'fixed'; amount: number; estHours?: number });

export interface Phase {
  id: string;
  label: string;
  tier: 'core' | 'extra';
  deliverables: Deliverable[];
}

export interface FocusOption {
  id: string;
  label: string;
  category: string | null; // null = balanced; else boosts that work-type among extras
}

// Volume bundle: once total in-scope hours ≥ minHours, take `percent` off hourly work.
export interface Discount {
  minHours: number;
  percent: number;
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
  phases: Phase[];
  discounts: Discount[];
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

export const clamp = (v: number, lo: number, hi: number): number =>
  Math.min(Math.max(num(v, lo), lo), hi);

// ── Normalisation ────────────────────────────────────────────────
// CMS authors will eventually save half-finished docs. This coerces any raw
// shape (local JSON or Tina GraphQL, incl. _template/__typename, and the older
// flat-deliverables shape) into a valid QuoteConfig so the page degrades
// gracefully instead of throwing/NaN-ing.

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
  };
  if (pricingOf(d) === 'fixed') {
    return { ...base, pricing: 'fixed', amount: Math.max(0, num(d.amount)), estHours: d.estHours != null ? Math.max(0, num(d.estHours)) : undefined };
  }
  return { ...base, pricing: 'hourly', category: str(d.category), hours: Math.max(0, num(d.hours)) };
};

const normalizePhase = (p: any, i: number): Phase => ({
  id: str(p?.id) || `phase-${i}`,
  label: str(p?.label) || str(p?.id) || `Phase ${i + 1}`,
  tier: p?.tier === 'extra' ? 'extra' : 'core',
  deliverables: Array.isArray(p?.deliverables)
    ? (p.deliverables.map(normalizeDeliverable).filter(Boolean) as Deliverable[])
    : [],
});

// Back-compat: build phases from the older flat `deliverables` (each had its own
// `phase` string + `tier`) so legacy/in-transition docs still render.
const phasesFromFlat = (deliverables: any[]): Phase[] => {
  const order: string[] = [];
  const byPhase = new Map<string, { tier: 'core' | 'extra'; items: any[] }>();
  for (const d of deliverables) {
    const label = str(d?.phase) || 'Scope';
    if (!byPhase.has(label)) { byPhase.set(label, { tier: d?.tier === 'extra' ? 'extra' : 'core', items: [] }); order.push(label); }
    byPhase.get(label)!.items.push(d);
  }
  return order.map((label, i) => ({
    id: label.toLowerCase().replace(/\s+/g, '-') || `phase-${i}`,
    label,
    tier: byPhase.get(label)!.tier,
    deliverables: byPhase.get(label)!.items.map(normalizeDeliverable).filter(Boolean) as Deliverable[],
  }));
};

const normalizeBudget = (b: any) => {
  const min = Math.max(0, num(b?.min, 0));
  let max = Math.max(min, num(b?.max, Math.max(min, 25000)));
  if (max <= min) max = min + 1000;
  const step = Math.max(1, num(b?.step, 500));
  const mid = Math.round((min + max) / 2);
  const def = clamp(num(b?.default, mid), min, max);
  return { min, max, step, default: def };
};

export function normalizeQuote(raw: any, slug = 'quote'): QuoteConfig {
  const workTypes: WorkType[] = Array.isArray(raw?.workTypes)
    ? raw.workTypes
        .filter((w: any) => w && str(w.id))
        .map((w: any) => ({ id: str(w.id), label: str(w.label) || str(w.id), rate: Math.max(0, num(w.rate)) }))
    : [];

  const phases: Phase[] = Array.isArray(raw?.phases)
    ? raw.phases.map(normalizePhase)
    : Array.isArray(raw?.deliverables)
      ? phasesFromFlat(raw.deliverables)
      : [];

  // Warn (build/dev log) when an hourly job points at a missing work-type.
  const ids = new Set(workTypes.map((w) => w.id));
  for (const p of phases) {
    for (const d of p.deliverables) {
      if (d.pricing === 'hourly' && d.category && !ids.has(d.category)) {
        // eslint-disable-next-line no-console
        console.warn(`[quote:${slug}] deliverable "${d.id}" references unknown work-type "${d.category}" — priced at $0`);
      }
    }
  }

  const discounts: Discount[] = Array.isArray(raw?.discounts)
    ? raw.discounts
        .map((x: any) => ({ minHours: Math.max(0, num(x?.minHours)), percent: clamp(num(x?.percent), 0, 100) }))
        .filter((x: Discount) => x.minHours > 0 && x.percent > 0)
        .sort((a: Discount, b: Discount) => a.minHours - b.minHours)
    : [];

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
    phases,
    discounts,
    focusOptions,
    budget: normalizeBudget(raw?.budget),
  };
}

// ── The calculation ──────────────────────────────────────────────

export interface QuotePlan {
  rates: Record<string, number>;
  budget: number;             // clamped to config bounds
  includedIds: Set<string>;
  corePhases: Phase[];        // for grouped rendering
  extraPhases: Phase[];
  coreCost: number;
  coreSpent: number;
  coreCoverage: number;       // 0..100, by $ funded
  coreTotal: number;
  coreFunded: number;
  coreComplete: boolean;
  extrasFunded: number;
  coreShortfall: number;
  spent: number;              // undiscounted included total
  remaining: number;          // budget - spent
  hours: number;              // total in-scope hours (hourly + fixed estHours)
  hourlySpent: number;        // included hourly cost (the discountable base)
  discountPercent: number;    // 0 if no bundle reached
  discountMinHours: number;   // the reached tier's threshold (0 if none)
  discountAmount: number;     // money saved
  finalSpent: number;         // spent - discountAmount (what the client pays)
  nextCore?: Deliverable;
  nextExtra?: Deliverable;
}

/** Fund core phases first (config order), then extra phases (focus-ordered). Greedy. */
export function computeQuote(config: QuoteConfig, rawBudget: number, focus: string | null): QuotePlan {
  const rates = rateMapOf(config.workTypes);
  const budget = clamp(rawBudget, config.budget.min, config.budget.max);
  const c = (d: Deliverable) => cost(d, rates);

  const corePhases = config.phases.filter((p) => p.tier === 'core');
  const extraPhases = config.phases.filter((p) => p.tier === 'extra');

  const coreDeliverables = corePhases.flatMap((p) => p.deliverables);
  const extraDeliverables = extraPhases.flatMap((p) => p.deliverables);
  const coreIds = new Set(coreDeliverables.map((d) => d.id));

  const rankedExtras = extraDeliverables
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
  for (const d of [...coreDeliverables, ...rankedExtras]) {
    if (spent + c(d) <= budget) {
      included.push(d);
      spent += c(d);
    } else {
      excluded.push(d);
    }
  }

  const includedIds = new Set(included.map((d) => d.id));
  const coreCost = coreDeliverables.reduce((s, d) => s + c(d), 0);
  const coreSpent = included.filter((d) => coreIds.has(d.id)).reduce((s, d) => s + c(d), 0);
  const coreFunded = included.filter((d) => coreIds.has(d.id)).length;
  const hours = included.reduce((s, d) => s + hoursOf(d), 0);

  // Volume bundle: highest-threshold tier whose minHours is reached.
  const reached = config.discounts.filter((x) => hours >= x.minHours);
  const tier = reached.length ? reached[reached.length - 1] : undefined;
  const discountPercent = tier?.percent ?? 0;
  const hourlySpent = included.filter((d) => d.pricing === 'hourly').reduce((s, d) => s + c(d), 0);
  const discountAmount = hourlySpent * (discountPercent / 100);

  return {
    rates,
    budget,
    includedIds,
    corePhases,
    extraPhases,
    coreCost,
    coreSpent,
    coreCoverage: coreCost > 0 ? Math.round((coreSpent / coreCost) * 100) : 100,
    coreTotal: coreDeliverables.length,
    coreFunded,
    coreComplete: coreFunded === coreDeliverables.length,
    extrasFunded: included.filter((d) => !coreIds.has(d.id)).length,
    coreShortfall: Math.max(0, coreCost - budget),
    spent,
    remaining: budget - spent,
    hours,
    hourlySpent,
    discountPercent,
    discountMinHours: tier?.minHours ?? 0,
    discountAmount,
    finalSpent: spent - discountAmount,
    nextCore: excluded.find((d) => coreIds.has(d.id)),
    nextExtra: excluded
      .filter((d) => !coreIds.has(d.id))
      .sort((a, b) => c(a) - c(b))
      .find((d) => c(d) > budget - spent),
  };
}
