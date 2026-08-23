'use client'

import { useState, type CSSProperties } from 'react'
import Image from 'next/image'
import { TinaMarkdown } from 'tinacms/dist/rich-text'
import type { ContentBlock } from '@/lib/content'
import type { RichNode as RichNodeType } from '@/lib/richText'
import RichText from '@/components/RichText'
import { absoluteUrl, dropboxUrl, onelinerSrc } from '@/lib/videoEmbed'

function splitWords(text: string): string[] {
  return text.split(' ')
}

interface BlockProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  block: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tinaFieldAttr?: any
  useTinaMarkdown?: boolean
}

export default function Block({ block, tinaFieldAttr, useTinaMarkdown = false }: BlockProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  // When data comes from the Tina GraphQL client, blocks have __typename
  // (e.g. "ProjectsBlocksWidescreen_video") instead of _template ("widescreen_video").
  // Normalise both to the _template string.
  const blockType: string =
    block._template ??
    (block.__typename as string | undefined)?.replace(/^ProjectsBlocks/, '').toLowerCase()

  if (blockType === 'hero') {
    const heroAspect = block.aspectRatio ?? '16/9'
    return (
      <div
        className="block-hero img-reveal"
        style={{ '--aspect': heroAspect } as CSSProperties}
        {...(tinaFieldAttr ? { 'data-tina-field': tinaFieldAttr } : {})}
      >
        <div className="img-container">
          {block.src && (
            <Image
              src={block.src}
              alt={block.alt ?? ''}
              fill
              sizes="100vw"
              style={{ objectFit: 'cover' }}
              loading="lazy"
              data-parallax={block.parallax ?? undefined}
            />
          )}
        </div>
        {block.caption && <p className="block-caption label">{block.caption}</p>}
      </div>
    )
  }

  if (blockType === 'gallery') {
    return (
      <div
        className="block-gallery"
        data-cols={String(block.columns ?? 2)}
        {...(tinaFieldAttr ? { 'data-tina-field': tinaFieldAttr } : {})}
      >
        {(block.images ?? []).map((img: Record<string, string>, i: number) => (
          <div
            key={i}
            className="gallery-item img-reveal"
            style={img.aspectRatio ? ({ '--aspect': img.aspectRatio } as CSSProperties) : undefined}
          >
            <div className="img-container">
              {img.src && (
                <Image
                  src={img.src}
                  alt={img.alt ?? ''}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  style={{ objectFit: 'cover' }}
                  loading="lazy"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (blockType === 'video') {
    const videoSrc = block.src
    return (
      <div
        className="block-video"
        {...(tinaFieldAttr ? { 'data-tina-field': tinaFieldAttr } : {})}
      >
        <div className="video-container">
          {block.provider === 'youtube' ? (
            <iframe
              src={`https://www.youtube.com/embed/${block.id}?rel=0`}
              title={block.caption ?? 'Project video'}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"

              loading="lazy"
            />
          ) : block.provider === 'vimeo' ? (
            <iframe
              src={`https://player.vimeo.com/video/${block.id}?badge=0&autopause=0`}
              title={block.caption ?? 'Project video'}
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"

              loading="lazy"
            />
          ) : block.provider === 'onelineplayer' ? (
            <iframe
              src={onelinerSrc(videoSrc ?? '', { poster: block.poster ?? '' })}
              title={block.caption ?? 'Project video'}
              frameBorder="0"
              scrolling="no"
              allow="autoplay; fullscreen"

              loading="lazy"
            />
          ) : videoSrc ? (
            <video
              src={dropboxUrl(videoSrc)}
              poster={block.poster ?? undefined}
              controls
              playsInline
              preload="metadata"
              autoPlay={!!block.autoplay}
              muted={!!block.muted}
              loop={!!block.loop}
            />
          ) : null}
        </div>
        {block.caption && <p className="block-caption label">{block.caption}</p>}
      </div>
    )
  }

  if (blockType === 'widescreen_video') {
    const wsAspect = block.aspectRatio ?? '16/9'
    const iframeSrc = onelinerSrc(dropboxUrl(block.url ?? ''), {
      autoplay: block.autoplay ? 'true' : 'false',
      muted: block.muted ? 'true' : 'false',
      loop: block.loop ? 'true' : 'false',
    })

    const showPoster = block.poster && !isPlaying && !block.autoplay

    return (
      <div
        className="block-widescreen-video"
        data-animate="fade-up"
        style={{ '--aspect': wsAspect } as CSSProperties}
        {...(tinaFieldAttr ? { 'data-tina-field': tinaFieldAttr } : {})}
      >
        <div className="widescreen-container">
          {showPoster ? (
            <button
              className="widescreen-poster"
              aria-label="Play video"
              data-src={iframeSrc}
              onClick={() => setIsPlaying(true)}
            >
              <Image
                src={block.poster}
                alt="Play video"
                fill
                sizes="100vw"
                style={{ objectFit: 'cover' }}
                loading="lazy"
              />
              <span className="widescreen-play" aria-hidden="true">
                <span className="widescreen-play-btn">
                  <svg viewBox="0 0 24 24" className="widescreen-play-icon" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </span>
            </button>
          ) : (
            <iframe
              src={iframeSrc}
              title={block.caption ?? 'Project video'}
              frameBorder="0"
              scrolling="no"
              allow="autoplay; fullscreen"

              loading="lazy"
            />
          )}
        </div>
        {block.caption && <p className="block-caption label">{block.caption}</p>}
      </div>
    )
  }

  if (blockType === 'vertical_reel') {
    const video = block.video
    const reelSrc = video?.url
      ? onelinerSrc(dropboxUrl(video.url), {
          poster: absoluteUrl(video.poster ?? ''),
          loop: video.loop ? 'true' : 'false',
          muted: video.muted ? 'true' : 'false',
          autoplay: video.autoplay ? 'true' : 'false',
        })
      : ''

    return (
      <div
        className="block-vertical-reel"
        {...(tinaFieldAttr ? { 'data-tina-field': tinaFieldAttr } : {})}
      >
        <div className="reel-video">
          <div className="video-container">
            {reelSrc && (
              <iframe
                src={reelSrc}
                title={block.caption ?? 'Project video'}
                frameBorder="0"
                scrolling="no"
                allow="autoplay; fullscreen"
  
                loading="lazy"
              />
            )}
          </div>
        </div>
        <div className="reel-images">
          {(block.images ?? []).slice(0, 2).map((img: Record<string, string>, i: number) => (
            <div key={i} className="img-container img-reveal">
              {img.src && (
                <Image
                  src={img.src}
                  alt={img.alt ?? ''}
                  fill
                  sizes="50vw"
                  style={{ objectFit: 'cover' }}
                  loading="lazy"
                />
              )}
            </div>
          ))}
        </div>
        {block.caption && (
          <p className="block-caption label" style={{ gridColumn: '1 / -1' }}>
            {block.caption}
          </p>
        )}
      </div>
    )
  }

  if (blockType === 'vertical_grid') {
    const items = (block.items ?? []).slice(0, 4) as Array<Record<string, string>>
    return (
      <div
        className="block-vertical-grid"
        data-animate="fade-up"
        {...(tinaFieldAttr ? { 'data-tina-field': tinaFieldAttr } : {})}
      >
        {items.map((item, i) => (
          <div key={i} className="vertical-grid-item">
            {item.type === 'video' && item.videoUrl ? (
              <div className="vertical-grid-video">
                <iframe
                  src={onelinerSrc(dropboxUrl(item.videoUrl), {
                    poster: item.poster ? absoluteUrl(item.poster) : '',
                    autoplay: item.autoplay ? 'true' : 'false',
                    muted: item.muted ? 'true' : 'false',
                    loop: item.loop ? 'true' : 'false',
                  })}
                  title={item.alt || block.caption || 'Vertical video'}
                  frameBorder="0"
                  scrolling="no"
                  allow="autoplay; fullscreen"
    
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="img-container img-reveal">
                {item.src && (
                  <Image
                    src={item.src}
                    alt={item.alt ?? ''}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    style={{ objectFit: 'contain' }}
                    loading="lazy"
                  />
                )}
              </div>
            )}
          </div>
        ))}
        {block.caption && (
          <p className="block-caption label" style={{ gridColumn: '1 / -1' }}>
            {block.caption}
          </p>
        )}
      </div>
    )
  }

  if (blockType === 'text') {
    const words = block.heading ? splitWords(block.heading) : []
    return (
      <div
        className="block-text"
        {...(tinaFieldAttr ? { 'data-tina-field': tinaFieldAttr } : {})}
      >
        {block.heading && (
          <h2 className="block-heading" data-animate="word-reveal">
            {words.map((word, i) => (
              <span key={i} className="word-clip">
                <span className="word-inner">
                  {word}{i < words.length - 1 ? '\u00A0' : ''}
                </span>
              </span>
            ))}
          </h2>
        )}

        {block.body && (
          useTinaMarkdown ? (
            <div className="block-body" data-animate="line-reveal">
              <TinaMarkdown content={block.body as Parameters<typeof TinaMarkdown>[0]['content']} />
            </div>
          ) : (
            <div className="block-body" data-animate="line-reveal">
              <RichText content={block.body as RichNodeType} />
            </div>
          )
        )}
      </div>
    )
  }

  return null
}
