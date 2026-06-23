import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getQuote, getQuoteSlugs } from '@/lib/content';
import { queryQuote, buildTinaResult } from '@/lib/tinaClient';
import QuoteBuilder from './QuoteBuilder';

interface PageProps {
  params: Promise<{ client: string }>;
}

export function generateStaticParams() {
  return getQuoteSlugs().map((client) => ({ client }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { client } = await params;
  const config = getQuote(decodeURIComponent(client));
  if (!config) return {};

  const url = `https://benjaminarnedo.com/quote/${config.slug}`;
  const title = `${config.client} — Quote`;
  return {
    title,
    description: `${config.title} — interactive scope & pricing for ${config.client}.`,
    alternates: { canonical: url },
    robots: { index: false, follow: false }, // client quotes shouldn't be indexed
    openGraph: { title, url },
  };
}

export default async function ClientQuotePage({ params }: PageProps) {
  const { client } = await params;
  const slug = decodeURIComponent(client);

  const [config, tinaQuery] = await Promise.all([
    Promise.resolve(getQuote(slug)),
    queryQuote(slug),
  ]);
  if (!config) notFound();

  // Tina data when the client is live; otherwise the normalized JSON fallback.
  const tinaResult = buildTinaResult(tinaQuery, 'quotes', config, `${slug}.json`);

  return (
    <QuoteBuilder
      query={tinaResult.query}
      variables={tinaResult.variables}
      data={tinaResult.data}
    />
  );
}
