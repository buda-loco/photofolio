import type { Metadata } from 'next';
import QuoteWizard from './QuoteWizard';
import { getQuoteBundle } from '@/data/quoteRegions';

const bundle = getQuoteBundle('au');

export const metadata: Metadata = {
  title: bundle.copy.meta.title,
  description: bundle.copy.meta.description,
  alternates: {
    canonical: 'https://benjaminarnedo.com/quote',
    languages: { 'en-AU': 'https://benjaminarnedo.com/quote', 'es-AR': 'https://benjaminarnedo.com/cotizacion' },
  },
};

// Self-serve quote builder, Australian rate card in AUD.
// The Spanish/USD variant lives at /cotizacion. Per-client quotes are at /quote/<slug>.
export default function QuotePage() {
  return <QuoteWizard regionId="au" />;
}
