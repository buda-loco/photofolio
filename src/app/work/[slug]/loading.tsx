export default function ProjectLoading() {
  return (
    <div className="project-page">
      {/* Cover skeleton */}
      <div className="cover-transition" style={{ aspectRatio: '16/9' }}>
        <div className="img-container" style={{ height: '100%' }} />
      </div>

      {/* Header skeleton */}
      <div style={{ padding: 'var(--sp-8) var(--page-margin) var(--sp-4)' }}>
        <span className="skeleton" style={{ width: '40%', height: '2.5rem', borderRadius: '4px' }} />
      </div>

      {/* Info skeleton */}
      <div style={{ padding: '0 var(--page-margin)', display: 'flex', gap: 'var(--sp-8)' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6em' }}>
          <span className="skeleton" style={{ width: '100%', height: '0.85em', borderRadius: '3px' }} />
          <span className="skeleton" style={{ width: '100%', height: '0.85em', borderRadius: '3px' }} />
          <span className="skeleton" style={{ width: '60%', height: '0.85em', borderRadius: '3px' }} />
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-8)' }}>
          <span className="skeleton" style={{ width: '80px', height: '0.85em', borderRadius: '3px' }} />
          <span className="skeleton" style={{ width: '80px', height: '0.85em', borderRadius: '3px' }} />
          <span className="skeleton" style={{ width: '80px', height: '0.85em', borderRadius: '3px' }} />
        </div>
      </div>
    </div>
  )
}
