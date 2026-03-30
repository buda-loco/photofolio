'use client'

import Image from 'next/image'
import { useTina, tinaField } from 'tinacms/dist/react'
import { TinaMarkdown } from 'tinacms/dist/rich-text'
import AnimationsInit from '@/components/AnimationsInit'
import { type TinaQueryResult, buildTinaProps } from '@/lib/tinaHelpers'

type AboutClientProps = TinaQueryResult<'about'>

export default function AboutClient(props: AboutClientProps) {
  const { data } = useTina(buildTinaProps(props))
  const about = data.about

  return (
    <div className="page">
      <AnimationsInit />

      <div className="about-layout">
        <div className="about-text" data-animate="fade-up">
          <h1 data-tina-field={tinaField(about, 'name')}>{about.name}</h1>
          {about.bio && (
            <div
              className="body-text"
              data-tina-field={tinaField(about, 'bio')}
            >
              <TinaMarkdown content={about.bio} />
            </div>
          )}
        </div>
        <div className="about-image img-reveal" data-animate="fade-up">
          <div className="img-container">
            {about.portrait && (
              <Image
                src={about.portrait}
                alt={about.name ?? ''}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: 'cover' }}
                priority
                data-tina-field={tinaField(about, 'portrait')}
              />
            )}
          </div>
        </div>
      </div>

      <div className="clients-section" data-animate="fade-up">
        <span className="label">Selected Clients</span>
        <ul
          className="clients-list"
          data-animate="stagger"
          data-tina-field={tinaField(about, 'clients')}
        >
          {(about.clients ?? []).filter(Boolean).map((client: string) => (
            <li key={client}>{client}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
