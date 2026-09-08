import type { Metadata } from 'next'
import Link from 'next/link'
import { CONCEPTS } from './_components/concepts'
import DownloadCta from './_components/DownloadCta'

export const metadata: Metadata = {
  title: 'Repusearch — Visual Identity, First Proposal',
}

export default function RepusearchIndex() {
  return (
    <>
      <section className="rs-hero">
        <h1 className="rs-hero-title">
          Repu<em>search</em>
        </h1>
        <p className="rs-hero-sub">Visual Identity &mdash; First Proposal</p>
        <p className="rs-hero-intro">
          Five directions. Each one a different answer to the same question:
          what does a reputation intelligence firm look like when its audience
          reads board papers, not marketing?
        </p>
      </section>

      <section className="rs-brief">
        <p>
          Repusearch is a reputation intelligence, monitoring and advisory
          firm, established by CRE8IVE and operating inside the C8 Group. The
          people who buy it are the ones who sign off risk: general counsel,
          company secretaries, heads of corporate affairs, and the chief
          executives they answer to. They read board papers, not marketing.
          Every direction here is drawn for that room, and every one has to
          survive being printed in black and white and left on a table. The
          single instruction behind all five: <strong>an intelligence briefing
          prepared for a board, not the software that generated the numbers in
          it.</strong>
        </p>
      </section>

      <section className="rs-note">
        <p className="rs-eyebrow">How to read this</p>
        <div className="rs-note-body">
          <p>
            None of this is finished artwork. The typefaces are suggestions.
            They show the kind of type that would sit well beside each mark,
            not a licensing decision, and the family gets chosen once a
            direction is. Colour works the same way: what is here sets a
            temperature rather than proposing a palette. Both are worth
            reacting to and neither is worth arguing about yet.
          </p>
          <p>
            One colour note is already live, though. Forest green belongs to
            the most credible direct competitor and standard corporate blue to
            the rest of the field, so whatever we land on has to sit somewhere
            neither of them owns.
          </p>
          <p>
            <em>This round is for narrowing, not approving.</em> Five
            directions is more than any brand needs. The useful outcome is one
            that survives, or two that can be folded together. What helps most
            is knowing which readings land, which feel like a stretch, and what
            you would want pushed further.
          </p>
        </div>
      </section>

      <section className="rs-cards" aria-label="Concepts">
        {CONCEPTS.map((c) => (
          <Link key={c.num} href={`/presentations/repusearch/${c.slug}`} className="rs-card">
            {/* No mark on the index on purpose: the client should read the
                thinking before they see the logo. The big outlined numeral is
                decoration only, hence aria-hidden. */}
            <span className="rs-card-ghost" aria-hidden="true">{c.num}</span>
            <span className="rs-card-num">CONCEPT {c.num}</span>
            <h2 className="rs-card-tagline">{c.name}</h2>
            <p className="rs-card-desc">{c.desc}</p>
            <span className="rs-card-link">
              View concept
              <svg
                className="rs-card-arrow"
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

      <DownloadCta note="All five directions in one document, ready to print, forward, or read on a plane." />

      <footer className="rs-foot">
        <span className="rs-credit">benjaminarnedo &mdash; September 2026</span>
        <span className="rs-credit">benjaminarnedo.com</span>
      </footer>
    </>
  )
}
