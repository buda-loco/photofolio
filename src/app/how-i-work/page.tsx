import type { Metadata } from 'next'
import { getHowIWork } from '@/lib/content'
import RichText from '@/components/RichText'
import TransitionLink from '@/components/TransitionLink'
import AnimationsInit from '@/components/AnimationsInit'

export const metadata: Metadata = {
  title: 'Process',
  description: 'A transparent look at my creative process — how Benjamin Arnedo approaches every project.',
  alternates: { canonical: 'https://benjaminarnedo.com/how-i-work' },
  openGraph: {
    title: 'Process — Benjamin Arnedo',
    description: 'A transparent look at my creative process — how Benjamin Arnedo approaches every project.',
    url: 'https://benjaminarnedo.com/how-i-work',
    images: [{ url: '/images/about/portrait.jpg' }],
  },
  twitter: {
    title: 'Process — Benjamin Arnedo',
    description: 'A transparent look at my creative process — how Benjamin Arnedo approaches every project.',
    images: ['/images/about/portrait.jpg'],
  },
}

export default function HowIWorkPage() {
  const data = getHowIWork()

  return (
    <div className="page">
      <AnimationsInit />

      <div className="how-layout">
        <h1 data-animate="fade-up">{data.title}</h1>

        {data.intro && (
          <div className="how-intro body-text" data-animate="fade-up">
            <RichText content={data.intro} />
          </div>
        )}

        <div className="how-steps">
          {data.steps.map((step) => (
            <div key={step.number} className="how-step" data-animate="fade-up">
              <span className="step-number serif">{step.number}</span>
              <div className="step-content">
                <h2>{step.title}</h2>
                {step.body && (
                  <div><RichText content={step.body} /></div>
                )}
              </div>
            </div>
          ))}
        </div>

        {data.cta && (
          <div className="how-cta" data-animate="fade-up">
            <span className="how-cta-text serif">{data.cta.text}</span>
            <TransitionLink href={data.cta.link} className="nav-link">
              {data.cta.label}
              {' '}
              <svg
                style={{ display: 'inline', verticalAlign: 'middle' }}
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </TransitionLink>
          </div>
        )}
      </div>
    </div>
  )
}
