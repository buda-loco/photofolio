import type { Metadata } from 'next'
import { getDesign, getAllProjects } from '@/lib/content'
import { buildDesignCss } from '@/lib/colors'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { GoogleAnalytics } from '@next/third-parties/google'
import Nav from '@/components/Nav'
import PageTransition from '@/components/PageTransition'
import { computeBasePill } from '@/lib/colors'

import SmoothScroll from '@/components/SmoothScroll'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://benjaminarnedo.com'),
  title: {
    default: 'Benjamin Arnedo',
    template: '%s — Benjamin Arnedo',
  },
  description: 'Creative Director · Brisbane, working remote',
  authors: [{ name: 'Benjamin Arnedo' }],
  alternates: { canonical: 'https://benjaminarnedo.com' },
  openGraph: {
    siteName: 'Benjamin Arnedo',
    type: 'website',
    locale: 'en_AU',
    url: 'https://benjaminarnedo.com',
    title: 'Benjamin Arnedo',
    description: 'Creative Director · Brisbane, working remote',
    images: [{ url: '/social-media.jpg', width: 1280, height: 720 }],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@buda_loco',
    site: '@buda_loco',
    title: 'Benjamin Arnedo',
    description: 'Creative Director · Brisbane, working remote',
    images: ['/social-media.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const design = getDesign()
  const projects = getAllProjects()

  const designCss = buildDesignCss(design)
  const basePill = computeBasePill(design)

  // NEXT_PUBLIC_* is inlined at build time, so changing this in Vercel needs a
  // redeploy to take effect. The measurement ID is not a secret — it ships in
  // the page source of every GA site by design.
  const gaId = process.env.NEXT_PUBLIC_GA_ID

  const menuProjects = projects.map(p => ({
    slug: p.slug,
    title: p.title,
    category: p.category,
    cover: p.cover,
  }))

  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Benjamin Arnedo',
    jobTitle: 'Creative Director',
    url: 'https://benjaminarnedo.com',
    email: 'hello@benjaminarnedo.com',
    address: { '@type': 'PostalAddress', addressLocality: 'Brisbane', addressCountry: 'AU' },
    sameAs: [
      'https://instagram.com/benarnedo',
      'https://www.linkedin.com/in/benjaminarnedo/',
      'https://au.seek.com/profiles/benjamin-arnedo-BLjv3KQBSG',
    ],
  }

  return (
    <html lang="en" data-theme="dark">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1, viewport-fit=cover" />
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content={design.colors.background} />

        {/* Font preloads — critical weights for first paint */}
        <link rel="preload" href="/fonts/Adrianna Light.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Adrianna Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Adrianna Extended Light.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Adrianna Extended Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />

        {/* Favicon */}
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />

        {/* Reduce motion preference — apply before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var h=document.documentElement;var m=localStorage.getItem('reduce-motion');if(m==='1'||(m===null&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)){h.classList.add('reduce-motion');}})();`,
          }}
        />

        {/* Design tokens from design.json */}
        <style dangerouslySetInnerHTML={{ __html: designCss }} />
      </head>
      <body suppressHydrationWarning>
        <a href="#main-content" className="skip-nav">
          Skip to content
        </a>

        <PageTransition>
          <Nav
            pillBg={basePill.bg}
            pillText={basePill.text}
            menuProjects={menuProjects}
          />
          <main id="main-content">
            {children}
          </main>
          <footer className="site-footer">
            <a href="/" className="footer-logo">
              <img src="/logo-mini.svg" alt="Benjamin Arnedo" width={35} height={35} />
            </a>
            <p className="footer-copy">
              &copy; {new Date().getFullYear()} Benjamin Arnedo
            </p>
          </footer>
        </PageTransition>

        <SmoothScroll />
        <Analytics />
        <SpeedInsights />
      </body>
      {/* Google Analytics 4, alongside Vercel's own analytics above.
          Rendered only when NEXT_PUBLIC_GA_ID is set, so local dev and any
          preview without the var stay out of the property's data.

          Deliberately NO manual page_view code. GA4 already counts a pageview
          on every browser history change, which is exactly what this site's
          client-side router.push() navigations are — sending our own would
          double every figure. This does depend on Enhanced Measurement →
          "Page changes based on browser history events" being on in the GA
          property (it is by default); without it, SPA navigations go
          uncounted and only the first page of a visit registers. */}
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
    </html>
  )
}
