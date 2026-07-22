import type { Metadata } from 'next';
import QuoteWizard from '../quote/QuoteWizard';
import { getQuoteBundle } from '@/data/quoteRegions';

const bundle = getQuoteBundle('ar');

export const metadata: Metadata = {
  title: bundle.copy.meta.title,
  description: bundle.copy.meta.description,
  alternates: {
    canonical: 'https://benjaminarnedo.com/cotizacion',
    languages: { 'es-AR': 'https://benjaminarnedo.com/cotizacion', 'en-AU': 'https://benjaminarnedo.com/quote' },
  },
  openGraph: {
    title: bundle.copy.meta.title,
    description: bundle.copy.meta.description,
    url: 'https://benjaminarnedo.com/cotizacion',
    locale: 'es_AR',
  },
};

// Argentine variant: Spanish (voseo), priced in USD at AR_PRICE_FACTOR of the
// Australian rate card, remote work only — see src/data/quoteRegions.ts.
export default function CotizacionPage() {
  return <QuoteWizard regionId="ar" />;
}
