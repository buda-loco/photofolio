export default function WorkLoading() {
  return (
    <div className="page">
      {/* Header skeleton */}
      <div className="work-page-header">
        <span className="skeleton" style={{ width: '160px', height: '3rem', borderRadius: '4px' }} />
        <span className="skeleton" style={{ width: '320px', height: '0.85em', borderRadius: '3px', marginTop: '0.5rem', display: 'block' }} />
      </div>

      {/* Grid skeleton */}
      <div style={{ padding: '0 var(--page-margin) var(--sp-16)' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '160px 1fr',
          gap: 'var(--sp-8)',
        }}>
          {/* Sidebar skeleton */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[85, 60, 95, 70, 50, 80, 65, 90].map((w, i) => (
              <span key={i} className="skeleton" style={{ width: `${w}%`, height: '0.75em', borderRadius: '3px' }} />
            ))}
          </div>

          {/* Bento grid skeleton */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gridAutoRows: 'clamp(160px, 22vw, 340px)',
            gap: 'var(--grid-gap)',
          }}>
            <div className="skeleton" style={{ gridColumn: 'span 8', gridRow: 'span 2', borderRadius: '0' }} />
            <div className="skeleton" style={{ gridColumn: 'span 4', borderRadius: '0' }} />
            <div className="skeleton" style={{ gridColumn: 'span 4', borderRadius: '0' }} />
            <div className="skeleton" style={{ gridColumn: 'span 4', borderRadius: '0' }} />
            <div className="skeleton" style={{ gridColumn: 'span 4', borderRadius: '0' }} />
            <div className="skeleton" style={{ gridColumn: 'span 4', borderRadius: '0' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
