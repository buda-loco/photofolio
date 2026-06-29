import type { Metadata } from 'next'
import './presentations.css'

/* Private client pitch — never indexed. */
export const metadata: Metadata = {
  title: 'PlaceWorks — Visual Identity',
  robots: { index: false, follow: false },
}

export default function PlaceWorksLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // .pw-pitch triggers the :has() rules in presentations.css that hide the
  // global site nav/footer and switch the surface to the warm paper palette.
  return <div className="pw-pitch">{children}</div>
}
