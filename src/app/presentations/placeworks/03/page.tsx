import type { Metadata } from 'next'
import Link from 'next/link'
import ProofSlider from '../_components/ProofSlider'
import ShapePlayground from '../_components/ShapePlayground'

export const metadata: Metadata = {
  title: 'PlaceWorks — Concept 03: Part of something great',
}

export default function PlaceWorksConcept03() {
  return (
    <>
      <header className="pw-concept-head">
        <Link href="/presentations/placeworks" className="pw-credit">
          &larr; All concepts
        </Link>
        <p className="pw-eyebrow" style={{ marginTop: '1.5rem' }}>
          Concept 03
        </p>
        <h1 className="pw-concept-name">Part of something great</h1>
        <p className="pw-concept-tagline">
          The shapes that build the monogram build the whole system &mdash; a
          kit of parts that adapts to any container.
        </p>
      </header>

      <div className="pw-mockup-caption">Application — proofs, 1920 × 1080</div>
      <div className="pw-mockup">
        <ProofSlider
          label="PlaceWorks Concept 03 application proofs"
          slides={[1, 2, 3, 4, 5].map((n) => `/presentations/placeworks/slider/c3-${n}.jpg`)}
        />
      </div>

      <section className="pw-rationale">
        <p className="pw-eyebrow">Rationale</p>
        <div className="pw-rationale-body">
          <p>
            The same basic shapes that form the PW monogram become the entire
            design system. Rectangles, circles, tilted planes &mdash; the
            building blocks of any built environment. Nothing is fixed, nothing
            is decorative.
          </p>
          <p>
            The palette draws from place itself: earth, stone, sand, dusk.
            PlaceWorks doesn&rsquo;t position itself as the whole story &mdash;
            it&rsquo;s part of something greater. The system flexes to its
            container, scaling and re-arranging, with one rule: the parts never
            overlap.
          </p>
        </div>
      </section>

      <div className="pw-brandmark">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/presentations/placeworks/slider/logo-c3.png" alt="PlaceWorks logo on black" />
      </div>

      <section className="pw-tool-section">
        <div className="pw-tool-head">
          <h2 className="pw-tool-title">Shape System</h2>
          <p className="pw-tool-hint">
            Resize the container and the kit of parts re-solves &mdash; scaling,
            moving and rotating to fit, never overlapping. Export clean SVG.
          </p>
        </div>
        <ShapePlayground />
      </section>

      <footer className="pw-foot">
        <Link href="/presentations/placeworks/02" className="pw-credit">
          &larr; Concept 02
        </Link>
        <span className="pw-next-steps" style={{ textAlign: 'center' }}>
          We&rsquo;d welcome your response to these directions before developing
          the preferred concept further.
        </span>
        <Link href="/presentations/placeworks" className="pw-credit">
          All concepts &rarr;
        </Link>
      </footer>
    </>
  )
}
