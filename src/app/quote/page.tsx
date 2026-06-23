import { redirect } from 'next/navigation';
import { getQuoteSlugs } from '@/lib/content';

// /quote has no client of its own — send it to the first available quote.
export default function QuoteIndex() {
  const slug = getQuoteSlugs()[0] ?? 'placeworks';
  redirect(`/quote/${slug}`);
}
