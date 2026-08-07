import type { Metadata } from 'next'
import { getAbout } from '@/lib/content'
import TransitionLink from '@/components/TransitionLink'
import AnimationsInit from '@/components/AnimationsInit'

// Kept out of the Tina schema deliberately. Adding fields to tina/config.ts
// requires the schema to be re-indexed in Tina Cloud, and until that happens
// the production build fails on the unknown field. These two rarely change.
const PROFILE_LINKS = {
  linkedin: 'https://www.linkedin.com/in/benjaminarnedo/',
  seek: 'https://au.seek.com/profiles/benjamin-arnedo-BLjv3KQBSG',
}

export const metadata: Metadata = {
  title: 'Contact',
  description: "Let's work together — get in touch with Benjamin Arnedo.",
  alternates: { canonical: 'https://benjaminarnedo.com/contact' },
  openGraph: {
    title: 'Contact — Benjamin Arnedo',
    description: "Let's work together — get in touch with Benjamin Arnedo.",
    url: 'https://benjaminarnedo.com/contact',
    images: [{ url: '/social-media.jpg', width: 1280, height: 720 }],
  },
  twitter: {
    title: 'Contact — Benjamin Arnedo',
    description: "Let's work together — get in touch with Benjamin Arnedo.",
    images: ['/social-media.jpg'],
  },
}

export default function ContactPage() {
  const about = getAbout()

  return (
    <div className="page">
      <AnimationsInit />

      <div className="contact-layout">
        <h1 data-animate="fade-up">
          Let&rsquo;s work<br />together.
        </h1>

        <a
          href={`mailto:${about.email}`}
          className="contact-email"
          data-animate="fade-up"
        >
          <svg
            className="contact-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          {about.email}
        </a>

        <div className="contact-social" data-animate="fade-up">
          {about.instagram && (
            <TransitionLink
              href={about.instagram}
              className="nav-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.35em' }}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
              Instagram
              {' '}
              <svg
                style={{ display: 'inline', verticalAlign: 'middle', opacity: 0.5 }}
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <line x1="7" y1="17" x2="17" y2="7"/>
                <polyline points="7 7 17 7 17 17"/>
              </svg>
            </TransitionLink>
          )}

          {PROFILE_LINKS.linkedin && (
            <TransitionLink
              href={PROFILE_LINKS.linkedin}
              className="nav-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.35em' }}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/>
                <rect x="2" y="9" width="4" height="12"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
              LinkedIn
              {' '}
              <svg
                style={{ display: 'inline', verticalAlign: 'middle', opacity: 0.5 }}
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <line x1="7" y1="17" x2="17" y2="7"/>
                <polyline points="7 7 17 7 17 17"/>
              </svg>
            </TransitionLink>
          )}

          {PROFILE_LINKS.seek && (
            <TransitionLink
              href={PROFILE_LINKS.seek}
              className="nav-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.35em' }}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
              SEEK
              {' '}
              <svg
                style={{ display: 'inline', verticalAlign: 'middle', opacity: 0.5 }}
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <line x1="7" y1="17" x2="17" y2="7"/>
                <polyline points="7 7 17 7 17 17"/>
              </svg>
            </TransitionLink>
          )}
        </div>
      </div>
    </div>
  )
}
