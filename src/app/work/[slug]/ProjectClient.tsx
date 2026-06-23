'use client'

import { type CSSProperties, useEffect } from 'react'
import Image from 'next/image'
import { useTina, tinaField } from 'tinacms/dist/react'
import { TinaMarkdown } from 'tinacms/dist/rich-text'
import Block from '@/components/Block'
import ExternalLinkButton from '@/components/ExternalLinkButton'
import TransitionLink from '@/components/TransitionLink'
import AnimationsInit from '@/components/AnimationsInit'
import { type TinaQueryResult, buildTinaProps } from '@/lib/tinaHelpers'

interface ProjectClientProps extends TinaQueryResult<'projects'> {
  nextProject: { slug: string; title: string; backgroundColor?: string } | null
}

export default function ProjectClient(props: ProjectClientProps) {
  const { data } = useTina(buildTinaProps(props))
  // Tina's visual editor can briefly deliver `data.projects` as undefined
  // during live updates — default to {} so field reads don't crash the page.
  const project = data.projects ?? {}

  // Build page background
  const bgColor = project.backgroundColor
  const bgSecondary = project.backgroundColorSecondary
  const pageBg = bgColor
    ? bgSecondary
      ? `linear-gradient(135deg, ${bgColor}, ${bgSecondary})`
      : bgColor
    : undefined

  const textColor = project.textColor
  const rawPrimary = project.primaryColor
  const rawSecondary = project.secondaryColor
  const invert = project.invertColors
  const primaryColor = invert ? rawSecondary : rawPrimary
  const secondaryColor = invert ? rawPrimary : rawSecondary
  const pageStyle: CSSProperties = {
    ...(pageBg ? { '--color-bg': bgColor, background: pageBg } : {}),
    ...(textColor ? { '--color-text': textColor, color: textColor } : {}),
    ...(primaryColor ? { '--project-primary': primaryColor } : {}),
    ...(secondaryColor ? { '--project-secondary': secondaryColor } : {}),
  } as CSSProperties

  // Set project colors on :root so nav/footer outside .project-page can use them
  useEffect(() => {
    const root = document.documentElement
    if (primaryColor) root.style.setProperty('--project-primary', primaryColor)
    if (secondaryColor) root.style.setProperty('--project-secondary', secondaryColor)
    if (primaryColor || secondaryColor) root.classList.add('project-colors')
    return () => {
      root.style.removeProperty('--project-primary')
      root.style.removeProperty('--project-secondary')
      root.classList.remove('project-colors')
    }
  }, [primaryColor, secondaryColor])

  const coverAspect = project.coverAspect ?? '16/9'
  const info = (project.info ?? {}) as {
    about?: unknown
    date?: string
    place?: string
    client?: string
  }

  return (
    <div className="page project-page" style={pageStyle}>
      <AnimationsInit />

      {/* Cover image */}
      <div
        className="cover-transition"
        style={{ '--aspect': coverAspect } as CSSProperties}
      >
        <div className="img-container">
          {project.cover && (
            <Image
              src={project.cover as string}
              alt={project.title}
              fill
              sizes="100vw"
              style={{ objectFit: 'cover' }}
              priority
              data-tina-field={tinaField(project, 'cover')}
            />
          )}
        </div>
        <div className="project-back" data-animate="fade-up">
          <TransitionLink
            href="/"
            className="nav-link project-back-link"
          >
            ← All projects
          </TransitionLink>
        </div>
      </div>

      {/* Title + category */}
      <header className="project-header" data-animate="fade-up">
        <h1
          className="project-title"
          data-tina-field={tinaField(project, 'title')}
        >
          {project.title}
        </h1>
        <div className="project-meta">
          <p
            className="label"
            data-tina-field={tinaField(project, 'category')}
          >
            {project.category}
          </p>
          <p
            className="label"
            data-tina-field={tinaField(project, 'year')}
          >
            {project.year}
          </p>
        </div>
      </header>

      {/* Services */}
      {Array.isArray(project.services) && project.services.length > 0 && (
        <div
          className="project-services"
          data-animate="fade-up"
          data-tina-field={tinaField(project, 'services')}
        >
          <span className="project-services-label label">Services</span>
          <ul className="project-services-list" role="list">
            {(project.services as string[]).filter(Boolean).map((service: string) => (
              <li key={service}>
                <TransitionLink
                  href={`/work?service=${encodeURIComponent(service)}`}
                  className="pill pill--filled"
                >
                  {service}
                </TransitionLink>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Project info strip */}
      {(info.about || info.date || info.place || info.client) && (
        <div className="project-info" data-animate="fade-up">
          {info.about != null && (
            <div
              className="project-info-item project-info-item--about"
              data-tina-field={tinaField(project, 'info')}
            >
              <span className="project-info-label">
                <svg className="info-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                {' '}About
              </span>
              <div className="project-info-value body-text">
                <TinaMarkdown content={info.about as Parameters<typeof TinaMarkdown>[0]['content']} />
              </div>
            </div>
          )}
          {info.date && (
            <div className="project-info-item">
              <span className="project-info-label">
                <svg className="info-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {' '}Date
              </span>
              <span
                className="project-info-value"
                data-tina-field={tinaField(project, 'info')}
              >
                {info.date}
              </span>
            </div>
          )}
          {info.place && (
            <div className="project-info-item">
              <span className="project-info-label">
                <svg className="info-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {' '}Place
              </span>
              <span
                className="project-info-value"
                data-tina-field={tinaField(project, 'info')}
              >
                {info.place}
              </span>
            </div>
          )}
          {info.client && (
            <div className="project-info-item">
              <span className="project-info-label">
                <svg className="info-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                {' '}Client
              </span>
              <span
                className="project-info-value"
                data-tina-field={tinaField(project, 'info')}
              >
                {info.client}
              </span>
            </div>
          )}
        </div>
      )}

      {/* CTA button */}
      {project.ctaUrl && project.ctaLabel && (
        <div className="project-cta" data-animate="fade-up">
          <ExternalLinkButton href={project.ctaUrl} label={project.ctaLabel} />
        </div>
      )}

      {/* Content blocks */}
      <div className="project-content">
        {((project.blocks ?? []) as import('@/lib/content').ContentBlock[]).map((block: import('@/lib/content').ContentBlock, i: number) => (
          <Block
            key={i}
            block={block}
            tinaFieldAttr={tinaField(project, `blocks.${i}`)}
            useTinaMarkdown
          />
        ))}
      </div>

      {/* Next project */}
      {props.nextProject && (
        <div className="project-next-wrap">
          <TransitionLink
            href={`/work/${props.nextProject.slug}`}
            className="project-next"
            bgColor={props.nextProject.backgroundColor}
          >
            <span className="project-next-label">Next</span>
            <span className="project-next-sep">/</span>
            <span className="project-next-title">{props.nextProject.title}</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </TransitionLink>
        </div>
      )}
    </div>
  )
}
