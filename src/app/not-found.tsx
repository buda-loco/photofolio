import TransitionLink from '@/components/TransitionLink'

export default function NotFound() {
  return (
    <div className="page">
      <div className="error-layout">
        <h1>404</h1>
        <p>This page doesn&rsquo;t exist.</p>
        <TransitionLink href="/" className="nav-link">
          Back to home &rarr;
        </TransitionLink>
      </div>
    </div>
  )
}
