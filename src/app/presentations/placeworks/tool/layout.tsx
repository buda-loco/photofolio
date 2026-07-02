import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PlaceWorks — Brand Asset Tool',
  robots: { index: false, follow: false },
}

export default function ToolLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
