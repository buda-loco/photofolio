import type { Metadata } from 'next';
import QuoteWizard from './QuoteWizard';

export const metadata: Metadata = {
  title: 'Build your quote',
  description: 'Build a transparent, itemised quote for any kind of design work and send it over.',
  alternates: { canonical: 'https://benjaminarnedo.com/quote' },
};

// Self-serve quote builder. Per-client quotes still live at /quote/<slug>.
export default function QuotePage() {
  return <QuoteWizard />;
}
