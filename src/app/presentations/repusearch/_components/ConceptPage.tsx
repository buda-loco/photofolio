import Link from 'next/link'
import Frame from './Frame'
import Keywords from './Keywords'
import ShadowSundial from './ShadowSundial'
import ThreadsBed from './ThreadsBed'
import FingerprintDraw from './FingerprintDraw'
import DownloadCta from './DownloadCta'
import { nextConcept, type Concept, type LogoTile } from './concepts'

/**
 * ConceptPage — the fixed running order for every concept.
 * Sections, top to bottom:
 *   head → keywords → rationale + 3 panels → hero logo (white on black)
 *   → logo squares → lockups → 4 mockups → competitors → siblings → big mockup
 */

const CREDIT = 'benjaminarnedo — September 2026'

/* Autoplaying loop. Muted + playsInline are what let iOS start it at all. */
function PanelVideo({ src, poster, wide }: { src: string; poster?: string; wide?: boolean }) {
  return (
    <div className="rs-frame rs-frame--raised" style={{ aspectRatio: wide ? '21 / 9' : '1 / 1' }}>
      <video
        src={src}
        poster={poster}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  )
}

function LogoRow({ tiles, ours, eyebrow, title, hint }: {
  tiles: LogoTile[]
  ours: LogoTile
  eyebrow: string
  title: string
  hint: string
}) {
  const all = [...tiles, ours]
  return (
    <section className="rs-section">
      <div className="rs-section-head">
        <p className="rs-eyebrow">{eyebrow}</p>
        <h2 className="rs-section-title">{title}</h2>
        <p className="rs-hint">{hint}</p>
      </div>
      <div className="rs-logo-row">
        {all.map((t, i) => (
          <div key={`${t.name}-${i}`} className={`rs-logo-cell${t.ours ? ' is-ours' : ''}`}>
            <Frame src={t.src} ratio="1:1" surface="white" fit="contain" label={t.name} />
            <span className="rs-caption">{t.name}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function ConceptPage({ c }: { c: Concept }) {
  const next = nextConcept(c)
  // the brand world board is drawn as a logo tile, so it is what sits beside
  // the competitors and the C8 brands; the plain mark is the fallback
  const ours: LogoTile = { name: 'Repusearch', src: c.brandWorld ?? c.logoOnWhite, ours: true }

  return (
    <>
      {/* 1 — head */}
      <header className="rs-concept-head">
        <Link href="/presentations/repusearch" className="rs-credit">
          &larr; All concepts
        </Link>
        <p className="rs-eyebrow" style={{ marginTop: '1.5rem' }}>
          Concept {c.num}
        </p>
        <h1 className="rs-concept-name">{c.name}</h1>
        <p className="rs-concept-tagline">{c.tagline}</p>
      </header>

      {/* 2 — keywords */}
      <section className="rs-section rs-section--keywords">
        <p className="rs-eyebrow">Keywords</p>
        <Keywords words={c.keywords} />
      </section>

      {/* 3 — rationale + three panels */}
      <section className="rs-rationale">
        <p className="rs-eyebrow">The idea</p>
        <div className="rs-rationale-body">
          {c.rationale.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>

      <section className="rs-section rs-section--panels">
        <div className={`rs-panels rs-panels--${c.panels.length}`}>
          {c.panels.map((p, i) => (
            <figure key={i} className={`rs-panel${p.wide ? ' rs-panel--wide' : ''}`}>
              {p.live === 'shadow-sundial' ? (
                <ShadowSundial />
              ) : p.live === 'threads-bed' ? (
                <ThreadsBed />
              ) : p.live === 'fingerprint-draw' ? (
                <FingerprintDraw />
              ) : p.video ? (
                <PanelVideo src={p.video} poster={p.poster} wide={p.wide} />
              ) : (
                <Frame
                  src={p.src}
                  ratio={p.wide ? '21:9' : '1:1'}
                  surface="raised"
                  fit="cover"
                  label={`Panel ${i + 1}`}
                />
              )}
              <figcaption>
                <span className="rs-panel-num">0{i + 1}</span>
                <strong>{p.title}</strong>
                <span>{p.caption}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* 4 — hero logo, white on black, no borders */}
      <section className="rs-hero-logo">
        <Frame src={c.heroLogo} ratio="16:9" surface="black" fit="contain" bleed label="Logo — white on black" />
      </section>

      {/* 5 — 1:1 squares */}
      <section className="rs-section">
        <div className="rs-section-head">
          <p className="rs-eyebrow">The mark</p>
          <h2 className="rs-section-title">On black, on white, and small</h2>
        </div>
        <div className="rs-squares">
          <div className="rs-square">
            <Frame src={c.logoOnBlack} ratio="1:1" surface="black" fit="contain" label="Logo on black" />
            <span className="rs-caption">On black</span>
          </div>
          <div className="rs-square">
            <Frame src={c.logoOnWhite} ratio="1:1" surface="white" fit="contain" label="Logo on white" />
            <span className="rs-caption">On white</span>
          </div>
          <div className="rs-square rs-square--small">
            <Frame src={c.smallOnBlack} ratio="1:1" surface="black" fit="contain" label="Small — 32 px" />
            <span className="rs-caption">Favicon, avatar</span>
          </div>
          <div className="rs-square rs-square--small">
            <Frame src={c.smallOnWhite} ratio="1:1" surface="white" fit="contain" label="Small — 32 px" />
            <span className="rs-caption">Favicon, avatar</span>
          </div>
        </div>
      </section>

      {/* 6 — lockups 16:9 */}
      <section className="rs-section">
        <div className="rs-section-head">
          <p className="rs-eyebrow">Lockup</p>
          <h2 className="rs-section-title">Two arrangements</h2>
        </div>
        <div className="rs-pair">
          <div>
            {/* both lockups are black artwork on transparent, so both sit on white */}
            <Frame src={c.lockupA} ratio="16:9" surface="white" fit="contain" label="Lockup A — horizontal" />
            <span className="rs-caption">Horizontal</span>
          </div>
          <div>
            <Frame src={c.lockupB} ratio="16:9" surface="white" fit="contain" label="Lockup B — stacked" />
            <span className="rs-caption">Stacked</span>
          </div>
        </div>
      </section>

      {/* 7 — four mockups */}
      <section className="rs-section">
        <div className="rs-section-head">
          <p className="rs-eyebrow">In use</p>
          <h2 className="rs-section-title">Four applications</h2>
        </div>
        <div className="rs-pair">
          {c.mockups.map((m, i) => (
            <div key={i}>
              <Frame src={m.src} ratio="16:9" surface="raised" fit="cover" label={m.label} />
              <span className="rs-caption">{m.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 8 — competitors */}
      <LogoRow
        tiles={c.competitors}
        ours={ours}
        eyebrow="Context"
        title="Next to the competition"
        hint="The four names a prospect will already have on the shortlist, and ours."
      />

      {/* 9 — C8 siblings */}
      <LogoRow
        tiles={c.siblings}
        ours={ours}
        eyebrow="Context"
        title="Next to the family"
        hint="The C8 Group brands it will sit beside on the group site and in proposals."
      />

      {/* 9b — anything beyond the core four */}
      {c.extras && c.extras.length > 0 && (
        <section className="rs-section">
          <div className="rs-section-head">
            <p className="rs-eyebrow">Extra</p>
            <h2 className="rs-section-title">Also drawn</h2>
          </div>
          <div className="rs-pair">
            {c.extras.map((m, i) => (
              <div key={i}>
                <Frame src={m.src} ratio="16:9" surface="raised" fit="cover" label={m.label} />
                <span className="rs-caption">{m.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 10 — one big mockup */}
      <section className="rs-big">
        <Frame src={c.bigMockup?.src} ratio="16:9" surface="raised" fit="cover" bleed label={c.bigMockup?.label ?? 'Big mockup'} />
      </section>

      <DownloadCta note={`Concept ${c.num} and the other four, in one document you can print or forward.`} />

      <footer className="rs-foot">
        <span className="rs-credit">{CREDIT}</span>
        <Link href={`/presentations/repusearch/${next.slug}`} className="rs-credit">
          Next: Concept {next.num} &rarr;
        </Link>
      </footer>
    </>
  )
}
