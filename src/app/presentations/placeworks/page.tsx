import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'PlaceWorks — Visual Identity, First Draft',
}

const CONCEPTS = [
  {
    num: '01',
    href: '/presentations/placeworks/01',
    tagline: 'A window to what’s possible',
    desc: 'The W is a room. The mark becomes a container that holds whatever a project brings to it — light, people, structure.',
  },
  {
    num: '02',
    href: '/presentations/placeworks/02',
    tagline: 'Entropy… solved',
    desc: 'Tangled threads slowly unravel into order. Every project generates its own line — never the same twice, always PlaceWorks.',
  },
  {
    num: '03',
    href: '/presentations/placeworks/03',
    tagline: 'Part of something great',
    desc: 'The shapes that build the monogram build the whole system. A kit of parts drawn from place itself — earth, stone, sand, dusk.',
  },
]

export default function PlaceWorksIndex() {
  return (
    <>
      <section className="pw-hero">
        <h1 className="pw-hero-title">PlaceWorks</h1>
        <p className="pw-hero-sub">Visual Identity &mdash; First Draft</p>
        <p className="pw-hero-intro">
          Three directions. Each one a different answer to the same question:
          what does a place-based brand feel like from the inside?
        </p>
      </section>

      <section className="pw-brief">
        <p>
          PlaceWorks sits at the intersection of thinking and listening. The
          brief asked for a brand that invites rather than declares &mdash; soft
          but structured, open but intentional. These three concepts each answer
          that tension differently. One through space, one through process, one
          through construction. All three are designed to scale.
        </p>
      </section>

      <section className="pw-why">
        <p className="pw-eyebrow">Why this isn’t a PDF</p>
        <div className="pw-why-body">
          <p>
            The brief asked for more than a brand &mdash; it asked for a
            <em> system that generates itself</em>. A logo you can put on a page
            is just an output. A system is the thing that produces the output,
            again and again, never quite the same way twice.
          </p>
          <p>
            You can’t feel that in a static deck. So each concept ships with a
            live generator built in HTML &mdash; the actual machine, not a
            screenshot of it. Drag it, push it, break it. Watch the same rules
            throw out a different result every time you do.
          </p>
          <p>
            Please play. It’s the only way to know whether the system holds up,
            and the fastest way to understand what you’d actually be buying: not
            a mark, but a way of making them.
          </p>
        </div>
      </section>

      <section className="pw-cards" aria-label="Concepts">
        {CONCEPTS.map((c) => (
          <Link key={c.num} href={c.href} className="pw-card">
            <span className="pw-card-num">CONCEPT {c.num}</span>
            <h2 className="pw-card-tagline">{c.tagline}</h2>
            <p className="pw-card-desc">{c.desc}</p>
            <span className="pw-card-link">
              View concept
              <svg
                className="pw-card-arrow"
                width="22"
                height="10"
                viewBox="0 0 22 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                aria-hidden="true"
              >
                <line x1="0" y1="5" x2="20" y2="5" />
                <polyline points="16,1 21,5 16,9" />
              </svg>
            </span>
          </Link>
        ))}
      </section>

      <footer className="pw-foot">
        <span className="pw-credit">benjaminarnedo &mdash; June 2026</span>
        <span className="pw-credit">benjaminarnedo.com</span>
      </footer>
    </>
  )
}
