import type { Metadata } from 'next'
import { getShowreelItems, getShowreelCategories } from '@/lib/showreel'
import ShowreelGrid from '@/components/ShowreelGrid'
import AnimationsInit from '@/components/AnimationsInit'

const DESCRIPTION =
  'Video archive — commercial, event and short-form work by Benjamin Arnedo.'

export const metadata: Metadata = {
  title: 'Showreel',
  description: DESCRIPTION,
  alternates: { canonical: 'https://benjaminarnedo.com/showreel' },
  openGraph: {
    title: 'Showreel — Benjamin Arnedo',
    description: DESCRIPTION,
    url: 'https://benjaminarnedo.com/showreel',
    images: [{ url: '/social-media.jpg', width: 1280, height: 720 }],
  },
  twitter: {
    title: 'Showreel — Benjamin Arnedo',
    description: DESCRIPTION,
    images: ['/social-media.jpg'],
  },
}

export default function ShowreelPage() {
  const items = getShowreelItems()
  const categories = getShowreelCategories(items)

  return (
    <div className="page">
      <AnimationsInit />
      <div className="work-page-header">
        <h1 data-animate="fade-up">Showreel</h1>
        <p className="work-page-sub" data-animate="fade-up">
          {items.length} videos · {categories.length} categories
        </p>
      </div>
      <ShowreelGrid items={items} categories={categories} />
    </div>
  )
}
