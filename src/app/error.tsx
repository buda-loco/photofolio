'use client'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="page">
      <div className="error-layout">
        <h1>Something went wrong</h1>
        <p>An unexpected error occurred.</p>
        <button className="nav-link" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </div>
  )
}
