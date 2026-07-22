// Regional variants of the quote builder.
//
// There is ONE catalogue (quoteCatalogue.ts, authored in AUD) and one set of
// prices. A region applies a single `priceFactor` to every money value in it,
// plus a currency, a locale and a translation layer.
//
// To change Argentine pricing, change AR_PRICE_FACTOR below. Nothing else.

import {
  DISCIPLINES, RATES, RATE_LABELS, TRAVEL, LICENCES, PRICING,
  BUSINESS, CONTACT_EMAIL, CONTACT_PHONE, CURRENCY, QUOTE_VALID_DAYS,
} from './quoteCatalogue';
import { ES_CATALOGUE, ES_COPY } from './quoteCopy.es';
import { EN_COPY, type QuoteCopy, type CatalogueCopy } from './quoteCopy';
import type {
  CatalogItem, Discipline, LicenceTier, Param, PricingConfig, RateId, TravelZone,
} from '@/lib/quotePricing';

/* ═══════════════════ The adjustable variables ═══════════════════ */

/** Australia is the baseline — its prices are the catalogue's own. */
export const AU_PRICE_FACTOR = 1;

/**
 * Argentina sits 25% below the Australian rate card, quoted in USD.
 * ⚠️ This is the single lever for Argentine pricing: change it and every rate,
 * fee, licence and minimum on /cotizacion moves with it. Nothing is hardcoded
 * downstream.
 */
export const AR_PRICE_FACTOR = 0.75;

/**
 * Usage licensing — the extra fee for where and how long shot work runs.
 * Currently switched off: no licence question, no licence line on the quote,
 * and the generic "licensed for the agreed purpose" term instead.
 *
 * Flip to `true` to bring it back. The tiers themselves are still defined in
 * quoteCatalogue.ts (LICENCES) and are scaled per region, so nothing needs
 * rebuilding — turning this on restores it everywhere at once.
 */
export const LICENSING_ENABLED = false;

/* ═══════════════════════ Price scaling ═══════════════════════ */

/**
 * Scale a money value and round it to a clean increment, so a 25% cut yields
 * "$75/h" rather than "$75.375/h". Rounding shifts the effective discount by a
 * fraction of a percent — deliberate, because published prices should look
 * chosen rather than computed.
 */
const scale = (value: number | undefined, factor: number, step: number): number | undefined => {
  if (value === undefined) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return value;
  if (factor === 1) return n;
  return Math.max(step, Math.round((n * factor) / step) * step);
};

const scaleParam = (p: Param, f: number): Param => {
  if (p.kind === 'qty') return { ...p, feePer: scale(p.feePer, f, 5) };
  if (p.kind === 'choice') {
    return { ...p, options: p.options.map((o) => ({ ...o, feeAdd: scale(o.feeAdd, f, 10) })) };
  }
  return { ...p, feeAdd: scale(p.feeAdd, f, 10) };
};

const scaleItem = (item: CatalogItem, f: number): CatalogItem => ({
  ...item,
  baseFee: scale(item.baseFee, f, 10),
  params: item.params?.map((p) => scaleParam(p, f)),
});

/* ══════════════════════ Translation ══════════════════════ */

/** Apply a translation to one item, falling back to the English source. */
const translateItem = (item: CatalogItem, copy: CatalogueCopy | null): CatalogItem => {
  const t = copy?.items?.[item.id];
  if (!t) return item;
  return {
    ...item,
    name: t.name ?? item.name,
    desc: t.desc ?? item.desc,
    params: item.params?.map((p) => {
      const tp = t.params?.[p.id];
      if (!tp) return p;
      if (p.kind === 'qty') {
        return { ...p, label: tp.label ?? p.label, unit: tp.unit ?? p.unit, help: tp.help ?? p.help };
      }
      if (p.kind === 'choice') {
        return {
          ...p,
          label: tp.label ?? p.label,
          help: tp.help ?? p.help,
          options: p.options.map((o) => {
            const to = tp.options?.[o.id];
            return to ? { ...o, label: to.label ?? o.label, desc: to.desc ?? o.desc } : o;
          }),
        };
      }
      return { ...p, label: tp.label ?? p.label, desc: tp.desc ?? p.desc };
    }),
  };
};

const translateTier = <T extends { id: string; label: string; desc: string }>(
  list: T[],
  copy: Record<string, { label?: string; desc?: string }> | undefined,
): T[] =>
  list.map((t) => {
    const tt = copy?.[t.id];
    return tt ? { ...t, label: tt.label ?? t.label, desc: tt.desc ?? t.desc } : t;
  });

/* ═════════════════════ Region definitions ═════════════════════ */

export interface QuoteRegion {
  id: 'au' | 'ar';
  /** The route this region is served at. */
  path: string;
  locale: string;
  currency: string;
  /** A bare "$" reads as pesos in Argentina, so USD needs an explicit prefix. */
  currencySymbol: string;
  priceFactor: number;
  /**
   * Drop items that require being physically on location. Argentina is too far
   * to travel to, so that page sells remote work only — and because the pricing
   * engine gates travel on `onLocation` items, removing them also removes the
   * travel question and any travel charge, automatically.
   */
  remoteOnly: boolean;
  location: string;
}

export const REGIONS: Record<'au' | 'ar', QuoteRegion> = {
  au: {
    id: 'au',
    path: '/quote',
    locale: 'en-AU',
    currency: CURRENCY,
    currencySymbol: '$',
    priceFactor: AU_PRICE_FACTOR,
    remoteOnly: false,
    location: BUSINESS.location,
  },
  ar: {
    id: 'ar',
    path: '/cotizacion',
    locale: 'es-AR',
    currency: 'USD',
    currencySymbol: 'US$',
    priceFactor: AR_PRICE_FACTOR,
    remoteOnly: true,
    location: 'Brisbane, Australia · trabajo remoto',
  },
};

/* ═══════════════════════ The bundle ═══════════════════════ */

export interface QuoteBundle {
  region: QuoteRegion;
  disciplines: Discipline[];
  allItems: Record<string, { item: CatalogItem; discipline: Discipline }>;
  rates: Record<RateId, number>;
  rateLabels: Record<RateId, string>;
  travel: TravelZone[];
  licences: LicenceTier[];
  pricing: PricingConfig;
  business: typeof BUSINESS & { phone: string };
  validDays: number;
  copy: QuoteCopy;
}

function build(regionId: 'au' | 'ar'): QuoteBundle {
  const region = REGIONS[regionId];
  const f = region.priceFactor;
  const isEs = region.locale.startsWith('es');
  const cat: CatalogueCopy | null = isEs ? ES_CATALOGUE : null;
  const copy = isEs ? ES_COPY : EN_COPY;

  const disciplines: Discipline[] = DISCIPLINES.map((d) => ({
    ...d,
    label: cat?.disciplines?.[d.id]?.label ?? d.label,
    blurb: cat?.disciplines?.[d.id]?.blurb ?? d.blurb,
    items: d.items
      .filter((i) => !(region.remoteOnly && i.onLocation))
      // Clearing `licensable` is all it takes to switch licensing off: the
      // engine charges the fee only when a licensable item is selected, and the
      // UI asks the question on the same condition.
      .map((i) => translateItem(scaleItem(LICENSING_ENABLED ? i : { ...i, licensable: false }, f), cat)),
  })).filter((d) => d.items.length > 0);

  const rates = Object.fromEntries(
    Object.entries(RATES).map(([k, v]) => [k, scale(v, f, 5) ?? v]),
  ) as Record<RateId, number>;

  const rateLabels = { ...RATE_LABELS, ...(cat?.rateLabels ?? {}) } as Record<RateId, string>;

  const travel: TravelZone[] = region.remoteOnly
    ? []
    : translateTier(TRAVEL, cat?.travel).map((t) => ({ ...t, expenses: scale(t.expenses, f, 10) ?? 0 }));

  const licences: LicenceTier[] = translateTier(LICENCES, cat?.licences)
    .map((l) => ({ ...l, fee: scale(l.fee, f, 50) ?? 0 }));

  const pricing: PricingConfig = {
    ...PRICING,
    rates,
    travel,
    licences,
    sourceFiles: {
      ...PRICING.sourceFiles,
      min: scale(PRICING.sourceFiles.min, f, 10) ?? PRICING.sourceFiles.min,
    },
  };

  const allItems = Object.fromEntries(
    disciplines.flatMap((d) => d.items.map((item) => [item.id, { item, discipline: d }])),
  );

  return {
    region,
    disciplines,
    allItems,
    rates,
    rateLabels,
    travel,
    licences,
    pricing,
    business: { ...BUSINESS, location: region.location, email: CONTACT_EMAIL, phone: CONTACT_PHONE },
    validDays: QUOTE_VALID_DAYS,
    copy,
  };
}

// Built once per region — the inputs are static module data.
const cache = new Map<string, QuoteBundle>();

export function getQuoteBundle(regionId: 'au' | 'ar'): QuoteBundle {
  const hit = cache.get(regionId);
  if (hit) return hit;
  const bundle = build(regionId);
  cache.set(regionId, bundle);
  return bundle;
}
