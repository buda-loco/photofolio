import type { Metadata } from 'next'
import { getDesign, getAllProjects } from '@/lib/content'
import { buildDesignCss } from '@/lib/colors'
import Nav from '@/components/Nav'
import PageTransition from '@/components/PageTransition'
import SmoothScroll from '@/components/SmoothScroll'
import { computeBasePill } from '@/lib/colors'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://benjaminarnedo.com'),
  title: {
    default: 'Benjamin Arnedo',
    template: '%s — Benjamin Arnedo',
  },
  description: 'Photographer & Cinematographer based in Canberra',
  authors: [{ name: 'Benjamin Arnedo' }],
  openGraph: {
    siteName: 'Benjamin Arnedo',
    type: 'website',
    locale: 'en_AU',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@buda_loco',
    site: '@buda_loco',
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
    jobTitle: 'Photographer & Cinematographer',
    url: 'https://benjaminarnedo.com',
    email: 'hello@benjaminarnedo.com',
    sameAs: [
      'https://instagram.com/benjaminarnedo',
      'https://vimeo.com/benjaminarnedo',
    ],
  }

  return (
    <html lang="en" data-theme="dark">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1" />
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content={design.colors.background} />

        {/* Font preloads */}
        <link rel="preload" href="/fonts/Adrianna Light.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
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
              <img src="/logo-mini.svg" alt="Benjamin Arnedo" width={28} height={28} />
            </a>
            <p className="footer-copy">
              &copy; {new Date().getFullYear()} Benjamin Arnedo
            </p>
          </footer>
        </PageTransition>

        <SmoothScroll />
      </body>
    </html>
  )
}
