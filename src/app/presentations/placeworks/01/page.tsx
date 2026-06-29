import type { Metadata } from 'next'
import Link from 'next/link'
import ProofSlider from '../_components/ProofSlider'
import Concept1Room from '../_components/Concept1Room'
import Concept1Forest from '../_components/Concept1Forest'

export const metadata: Metadata = {
  title: 'PlaceWorks — Concept 01: A window to what’s possible',
}

export default function PlaceWorksConcept01() {
  return (
    <>
      <header className="pw-concept-head">
        <Link href="/presentations/placeworks" className="pw-credit">
          &larr; All concepts
        </Link>
        <p className="pw-eyebrow" style={{ marginTop: '1.5rem' }}>
          Concept 01
        </p>
        <h1 className="pw-concept-name">A window to what’s possible</h1>
        <p className="pw-concept-tagline">
          The W is a room. The mark becomes a container that holds whatever a
          project brings to it — light, people, structure.
        </p>
      </header>

      <div className="pw-mockup-caption">Application — proofs, 1920 × 1080</div>
      <div className="pw-mockup">
        <ProofSlider
          label="PlaceWorks Concept 01 application proofs"
          slides={[1, 2, 3, 4, 5].map((n) => `/presentations/placeworks/slider/pw-slide-${n}.jpg`)}
        />
      </div>

      <section className="pw-rationale">
        <p className="pw-eyebrow">Rationale</p>
        <div className="pw-rationale-body">
          <p>
            Read the <strong>W</strong> as a floor plan. Its two valleys are
            rooms; the centre peak is the threshold between them. PlaceWorks
            doesn’t arrive with a fixed message — it builds a space and invites
            the project in. The identity is the room; the work is whatever fills
            it.
          </p>
          <p>
            That makes the mark generous instead of loud. The same container
            reads differently under different light, with different things
            placed inside it — but it is always, unmistakably, the same room.
            Recognition without rigidity. The tool below lets you stand inside
            the letter and watch it hold a scene together.
          </p>
        </div>
      </section>

      <div className="pw-brandmark">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/presentations/placeworks/slider/logo-c1.png" alt="PlaceWorks logo on black" />
      </div>

      <section className="pw-tool-section">
        <div className="pw-tool-head">
          <h2 className="pw-tool-title">Inside the W</h2>
          <p className="pw-tool-hint">
            Drag to orbit. Pop kernels into the W, change their size, and save a
            frame &mdash; the mark as a container that fills itself.
          </p>
        </div>
        <Concept1Room />
      </section>

      <section className="pw-tool-section">
        <div className="pw-tool-head">
          <h2 className="pw-tool-title">A forest in the W</h2>
          <p className="pw-tool-hint">
            The same container, holding place itself. Replant the W, vary the
            density, and move the sun across the canopy.
          </p>
        </div>
        <Concept1Forest />
      </section>

      <footer className="pw-foot">
        <span className="pw-credit">benjaminarnedo &mdash; June 2026</span>
        <Link href="/presentations/placeworks/02" className="pw-credit">
          Next: Concept 02 &rarr;
        </Link>
      </footer>
    </>
  )
}
