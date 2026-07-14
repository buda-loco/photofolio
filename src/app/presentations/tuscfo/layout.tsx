import type { Metadata } from 'next'
import './presentations.css'

/* Private client pitch — never indexed. */
export const metadata: Metadata = {
  title: 'Tus CFO — Identidad Visual',
  robots: { index: false, follow: false },
}

export default function TusCFOLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // .tc-pitch triggers the :has() rules in presentations.css that hide the
  // global site nav/footer and switch the surface to the deep petróleo palette.
  return <div className="tc-pitch">{children}</div>
}
