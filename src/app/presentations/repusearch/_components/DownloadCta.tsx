/* The download call to action, repeated at the foot of every concept and on the
   index. One component so the file name and wording only ever live in one place. */

export const PDF = '/presentations/repusearch/repusearch-proposals.pdf'

export default function DownloadCta({
  note = 'All five directions in one document, ready to print or forward.',
}: {
  note?: string
}) {
  return (
    <section className="rs-cta">
      <div className="rs-cta-body">
        <p className="rs-eyebrow">Take it with you</p>
        <h2 className="rs-cta-title">Download the full proposal</h2>
        <p className="rs-cta-note">{note}</p>
      </div>
      <a className="rs-cta-btn" href={PDF} download>
        Download PDF
        <span className="rs-cta-meta">11 pages &middot; 1.7 MB</span>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor"
          strokeWidth="1.4" aria-hidden="true">
          <line x1="11" y1="3" x2="11" y2="15" />
          <polyline points="6,10 11,15 16,10" />
          <line x1="4" y1="19" x2="18" y2="19" />
        </svg>
      </a>
    </section>
  )
}
