import type { Metadata } from 'next'
import Link from 'next/link'
import ProofSlider from '../_components/ProofSlider'
import YarnGenerator from '../_components/YarnGenerator'

export const metadata: Metadata = {
  title: 'PlaceWorks — Concept 02: Entropy… solved',
}

export default function PlaceWorksConcept02() {
  return (
    <>
      <header className="pw-concept-head">
        <Link href="/presentations/placeworks" className="pw-credit">
          &larr; All concepts
        </Link>
        <p className="pw-eyebrow" style={{ marginTop: '1.5rem' }}>
          Concept 02
        </p>
        <h1 className="pw-concept-name">Entropy&hellip; solved</h1>
        <p className="pw-concept-tagline">
          A single tangled line that unravels into order &mdash; and resolves
          into the white space where the wordmark lives.
        </p>
      </header>

      <div className="pw-mockup-caption">Application — proofs, 1920 × 1080</div>
      <div className="pw-mockup">
        <ProofSlider
          label="PlaceWorks Concept 02 application proofs"
          slides={[1, 2, 3, 4, 5].map((n) => `/presentations/placeworks/slider/c2-${n}.jpg`)}
        />
      </div>

      <section className="pw-rationale">
        <p className="pw-eyebrow">Rationale</p>
        <div className="pw-rationale-body">
          <p>
            Places are complex systems &mdash; competing voices, contested
            sites, layered histories. This concept makes that visible: a dense
            tangle of line that slowly, organically resolves into clean ordered
            lines. Chaos becoming clarity. Calm. Resolved.
          </p>
          <p>
            The graphic language generates itself from the work. Every project
            produces its own field &mdash; never the same twice, always
            unmistakably PlaceWorks. Choose the direction the order emerges from,
            how messy the tangle is, and where and how sharply it resolves.
          </p>
        </div>
      </section>

      <div className="pw-brandmark">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/presentations/placeworks/slider/logo-c2.png" alt="PlaceWorks logo on black" />
      </div>

      <section className="pw-tool-section">
        <div className="pw-tool-head">
          <h2 className="pw-tool-title">Entropy Generator</h2>
          <p className="pw-tool-hint">
            A tangle resolving into order. Pick a direction, dial the mess and
            detail, and set where and how sharply it resolves. Export clean SVG.
          </p>
          <Link href="/presentations/placeworks/tool" className="pw-btn pw-btn--solid">
            Try the generator yourself &rarr;
          </Link>
        </div>
        <YarnGenerator />
      </section>

      <footer className="pw-foot">
        <Link href="/presentations/placeworks/01" className="pw-credit">
          &larr; Concept 01
        </Link>
        <span className="pw-next-steps" style={{ textAlign: 'center' }}>
          We&rsquo;d welcome your response to these directions before developing
          the preferred concept further.
        </span>
        <Link href="/presentations/placeworks/03" className="pw-credit">
          Next: Concept 03 &rarr;
        </Link>
      </footer>
    </>
  )
}
