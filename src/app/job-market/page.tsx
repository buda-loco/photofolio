import type { Metadata } from 'next'
import JobMarketClient from './JobMarketClient'
import { SCRAPED, RELEVANT } from '@/data/jobMarket'
import './job-market.css'

const TITLE = '225 Creative Director Jobs'
const DESC =
  `I scraped ${SCRAPED.toLocaleString('en-AU')} Australian creative-lead job ads and read ` +
  `${RELEVANT} of them properly: salary, location, tools, tasks, and who is actually hiring.`

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: 'https://benjaminarnedo.com/job-market' },
  openGraph: {
    title: `${TITLE} — Benjamin Arnedo`,
    description: DESC,
    url: 'https://benjaminarnedo.com/job-market',
    images: [{ url: '/social-media.jpg', width: 1280, height: 720 }],
  },
  twitter: {
    title: `${TITLE} — Benjamin Arnedo`,
    description: DESC,
    images: ['/social-media.jpg'],
  },
}

// Article schema rather than CreativeWork: this is a written analysis with a
// publication date, not a portfolio piece.
const schema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: TITLE,
  description: DESC,
  datePublished: '2026-09-01',
  author: { '@type': 'Person', name: 'Benjamin Arnedo', url: 'https://benjaminarnedo.com' },
  publisher: { '@type': 'Person', name: 'Benjamin Arnedo' },
  mainEntityOfPage: 'https://benjaminarnedo.com/job-market',
  image: 'https://benjaminarnedo.com/social-media.jpg',
  about: 'Australian creative director and design lead job market, August–September 2026',
}

export default function JobMarketPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <JobMarketClient />
    </>
  )
}
