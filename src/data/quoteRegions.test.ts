import { describe, it, expect } from 'vitest';
import { getQuoteBundle, REGIONS, AR_PRICE_FACTOR, AU_PRICE_FACTOR, LICENSING_ENABLED } from './quoteRegions';
import { RATES, LICENCES, PRICING, DISCIPLINES } from './quoteCatalogue';
import { priceItem, priceQuote, defaultValues, type QuoteLine } from '@/lib/quotePricing';

const au = getQuoteBundle('au');
const ar = getQuoteBundle('ar');

const itemIds = (b: typeof au) => Object.keys(b.allItems);

describe('region setup', () => {
  it('Australia is the untouched baseline', () => {
    expect(AU_PRICE_FACTOR).toBe(1);
    expect(au.rates).toEqual(RATES);
    expect(au.region.currency).toBe('AUD');
    expect(au.region.currencySymbol).toBe('$');
  });

  it('Argentina is 25% below, in USD', () => {
    expect(AR_PRICE_FACTOR).toBe(0.75);
    expect(ar.region.currency).toBe('USD');
    // A bare "$" reads as pesos in Argentina.
    expect(ar.region.currencySymbol).toBe('US$');
    expect(ar.region.locale).toBe('es-AR');
  });

  it('serves the two regions at distinct routes', () => {
    expect(REGIONS.au.path).toBe('/quote');
    expect(REGIONS.ar.path).toBe('/cotizacion');
  });
});

describe('price scaling', () => {
  it('scales every hourly rate by the factor', () => {
    for (const [craft, auRate] of Object.entries(au.rates)) {
      const arRate = ar.rates[craft as keyof typeof ar.rates];
      // Rounded to the nearest $5, so allow that much drift from the raw cut.
      expect(Math.abs(arRate - auRate * AR_PRICE_FACTOR)).toBeLessThanOrEqual(2.5);
      expect(arRate).toBeLessThan(auRate);
    }
  });

  it('rounds rates to clean increments rather than exposing the arithmetic', () => {
    for (const rate of Object.values(ar.rates)) {
      expect(rate % 5).toBe(0);
      expect(Number.isInteger(rate)).toBe(true);
    }
  });

  it('scales licence fees, keeping free tiers free', () => {
    const auNational = LICENCES.find((l) => l.id === 'national')!.fee;
    const arNational = ar.licences.find((l) => l.id === 'national')!.fee;
    expect(arNational).toBe(1350);
    expect(arNational).toBeLessThan(auNational);
    // "Organic" is included at no charge in both regions — 0 must stay 0.
    expect(ar.licences.find((l) => l.id === 'organic')!.fee).toBe(0);
  });

  it('scales the working-files minimum', () => {
    expect(ar.pricing.sourceFiles.min).toBeLessThan(PRICING.sourceFiles.min);
    expect(ar.pricing.sourceFiles.min).toBe(190);
  });

  it('leaves non-money values alone', () => {
    // Hours, multipliers and percentages are not prices and must not move.
    expect(ar.pricing.revisionHours).toBe(PRICING.revisionHours);
    expect(ar.pricing.revisionsIncluded).toBe(PRICING.revisionsIncluded);
    expect(ar.pricing.depositPercent).toBe(PRICING.depositPercent);
    expect(ar.pricing.sourceFiles.percent).toBe(PRICING.sourceFiles.percent);
    expect(ar.pricing.schedule).toEqual(PRICING.schedule);

    const auLogo = au.allItems['br-logo'].item;
    const arLogo = ar.allItems['br-logo'].item;
    expect(arLogo.baseHours).toBe(auLogo.baseHours);
  });

  it('a whole quote comes out roughly 25% cheaper', () => {
    const build = (b: typeof au): QuoteLine[] =>
      ['br-logo', 'we-design', 'mo-animation'].map((id) => {
        const { item, discipline } = b.allItems[id];
        const values = defaultValues(item);
        return { item, discipline, values, breakdown: priceItem(item, values, b.rates) };
      });

    const opts = { preset: 'recommended' as const, priority: false, startDate: '', travel: 'local', licence: 'organic', extraRevisions: 0, sourceFiles: false, promoCode: '' };
    const auTotal = priceQuote(build(au), opts, au.pricing).total;
    const arTotal = priceQuote(build(ar), opts, ar.pricing).total;

    const ratio = arTotal / auTotal;
    expect(ratio).toBeGreaterThan(0.73);
    expect(ratio).toBeLessThan(0.77);
  });
});

describe('Argentina is remote-only', () => {
  it('drops every item that requires being on location', () => {
    const onLocation = DISCIPLINES.flatMap((d) => d.items).filter((i) => i.onLocation).map((i) => i.id);
    expect(onLocation.length).toBeGreaterThan(0);
    for (const id of onLocation) {
      expect(au.allItems[id]).toBeDefined();
      expect(ar.allItems[id]).toBeUndefined();
    }
  });

  it('offers no travel zones at all', () => {
    expect(ar.travel).toEqual([]);
    expect(au.travel.length).toBeGreaterThan(0);
  });

  it('never charges travel, even if a stale share link asks for it', () => {
    const { item, discipline } = ar.allItems['br-logo'];
    const values = defaultValues(item);
    const lines = [{ item, discipline, values, breakdown: priceItem(item, values, ar.rates) }];
    const totals = priceQuote(
      lines,
      { preset: 'recommended' as const, priority: false, startDate: '', travel: 'interstate', licence: 'organic', extraRevisions: 0, sourceFiles: false, promoCode: '' },
      ar.pricing,
    );
    expect(totals.travelLabour).toBe(0);
    expect(totals.travelExpenses).toBe(0);
    expect(totals.hasPoa).toBe(false);
  });

  it('keeps every remote discipline', () => {
    expect(ar.disciplines.map((d) => d.id)).toEqual(au.disciplines.map((d) => d.id));
    expect(itemIds(ar).length).toBeLessThan(itemIds(au).length);
  });
});

describe('licensing switch', () => {
  it('is currently off', () => {
    expect(LICENSING_ENABLED).toBe(false);
  });

  it('leaves no licensable item in either region, so no fee can be charged', () => {
    for (const bundle of [au, ar]) {
      const licensable = Object.values(bundle.allItems).filter((e) => e.item.licensable);
      expect(licensable).toEqual([]);
    }
  });

  it('charges nothing even if a share link asks for the priciest tier', () => {
    const { item, discipline } = au.allItems['ph-edit'];
    const values = defaultValues(item);
    const lines = [{ item, discipline, values, breakdown: priceItem(item, values, au.rates) }];
    const totals = priceQuote(
      lines,
      { preset: 'recommended' as const, priority: false, startDate: '', travel: 'local', licence: 'national', extraRevisions: 0, sourceFiles: false, promoCode: '' },
      au.pricing,
    );
    expect(totals.licenceFee).toBe(0);
    expect(totals.total).toBe(lines[0].breakdown.total);
  });

  it('keeps the tiers defined so flipping the switch restores them', () => {
    expect(au.licences.length).toBeGreaterThan(0);
    expect(ar.licences.length).toBeGreaterThan(0);
  });
});

describe('translation', () => {
  it('translates disciplines, items, params and options', () => {
    expect(ar.allItems['br-logo'].discipline.label).toBe('Branding');
    expect(ar.allItems['gd-editorial'].item.name).toBe('Diseño editorial y de publicaciones');

    const source = ar.allItems['mo-animation'].item.params!.find((p) => p.id === 'source');
    expect(source?.label).toBe('¿De quién es el diseño?');
    if (source?.kind === 'choice') {
      expect(source.options.find((o) => o.id === 'mine')?.label).toBe('Lo diseño yo también');
    }
  });

  it('translates rate labels and licences', () => {
    expect(ar.rateLabels.design).toBe('Diseño');
    expect(ar.licences.find((l) => l.id === 'buyout')?.label).toBe('Cesión total');
  });

  it('leaves the English region in English', () => {
    expect(au.allItems['gd-editorial'].item.name).toBe('Editorial & publication design');
    expect(au.rateLabels.design).toBe('Design');
  });

  it('translates the interface copy', () => {
    expect(ar.copy.header.title).toBe('Armá tu presupuesto');
    expect(ar.copy.steps).toHaveLength(5);
    expect(au.copy.header.title).toBe('Build your quote');
  });

  it('has no untranslated item names left on the Spanish page', () => {
    // Every item surviving into the AR bundle must have a Spanish name — an
    // English string here means a missing translation key.
    for (const id of itemIds(ar)) {
      const arName = ar.allItems[id].item.name;
      const auName = au.allItems[id].item.name;
      expect(arName, `item "${id}" is untranslated`).not.toBe(auName);
    }
  });

  // Words that are genuinely identical in both languages — a product name, or
  // a term Spanish borrows outright. Anything NOT on this list matching its
  // English source means a translation key was missed.
  const IDENTICAL_BY_DESIGN = new Set(['Simple', 'Wireframes', 'WooCommerce']);

  it('has no untranslated param labels or options on the Spanish page', () => {
    for (const id of itemIds(ar)) {
      const arParams = ar.allItems[id].item.params ?? [];
      const auParams = au.allItems[id].item.params ?? [];
      arParams.forEach((p, i) => {
        const auP = auParams[i];
        if (!IDENTICAL_BY_DESIGN.has(p.label)) {
          expect(p.label, `${id}.${p.id} label untranslated`).not.toBe(auP.label);
        }
        if (p.kind === 'choice' && auP.kind === 'choice') {
          p.options.forEach((o, j) => {
            if (IDENTICAL_BY_DESIGN.has(o.label)) return;
            expect(o.label, `${id}.${p.id}.${o.id} untranslated`).not.toBe(auP.options[j].label);
          });
        }
      });
    }
  });
});

describe('bundle integrity', () => {
  it('indexes every item of every discipline', () => {
    for (const bundle of [au, ar]) {
      const fromDisciplines = bundle.disciplines.flatMap((d) => d.items.map((i) => i.id));
      expect(Object.keys(bundle.allItems).sort()).toEqual([...fromDisciplines].sort());
    }
  });

  it('returns the same cached instance per region', () => {
    expect(getQuoteBundle('ar')).toBe(ar);
    expect(getQuoteBundle('au')).toBe(au);
    expect(ar).not.toBe(au);
  });

  it('does not mutate the source catalogue', () => {
    // The AR bundle is built by copying; the AUD source must be untouched.
    expect(RATES.design).toBe(100);
    expect(LICENCES.find((l) => l.id === 'national')!.fee).toBe(1800);
    expect(DISCIPLINES.find((d) => d.id === 'photography')!.items.some((i) => i.id === 'ph-shoot')).toBe(true);
  });
});
