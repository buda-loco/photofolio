import type { Metadata } from 'next'
import './presentations.css'

/* Private client pitch — never indexed. */
export const metadata: Metadata = {
  title: 'Repusearch — Visual Identity',
  robots: { index: false, follow: false },
}

export default function RepusearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // .rs-pitch triggers the :has() rules in presentations.css that hide the
  // global site nav/footer and switch the surface to black.
  return <div className="rs-pitch">{children}</div>
}
