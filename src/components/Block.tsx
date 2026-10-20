'use client'

import { useState, type CSSProperties } from 'react'
import Image from 'next/image'
import { TinaMarkdown } from 'tinacms/dist/rich-text'
import type { ContentBlock } from '@/lib/content'
import type { RichNode as RichNodeType } from '@/lib/richText'
import RichText from '@/components/RichText'
import dynamic from 'next/dynamic'
import { absoluteUrl, dropboxUrl, onelinerSrc } from '@/lib/videoEmbed'

// WebGL only exists in the browser; this also keeps three out of every other page's bundle
const Map3D = dynamic(() => import('./Map3D'), { ssr: false })

function splitWords(text: string): string[] {
  return text.split(' ')
}

// A desktop screenshot set in a browser window on a tinted canvas. The window
// takes the screenshot's own ratio, so nothing is cropped.
function BrowserFrame({ src, alt, aspect, sizes, parallax }: {
  src?: string; alt?: string; aspect: string; sizes: string; parallax?: number
}) {
  return (
    <div className="browser-canvas">
      <div className="browser">
        <div className="browser-bar" aria-hidden="true"><i /><i /><i /></div>
        <div className="browser-screen" style={{ '--screen-aspect': aspect } as CSSProperties}>
          {src && (
            <Image
              src={src}
              alt={alt ?? ''}
              fill
              sizes={sizes}
              style={{ objectFit: 'cover', objectPosition: 'top' }}
              loading="lazy"
              data-parallax={parallax ?? undefined}
            />
          )}
        </div>
      </div>
    </div>
  )
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
    if (block.frame === 'browser') {
      return (
        <div
          className="block-hero block-hero--browser img-reveal"
          {...(tinaFieldAttr ? { 'data-tina-field': tinaFieldAttr } : {})}
        >
          <BrowserFrame src={block.src} alt={block.alt} aspect={heroAspect} sizes="100vw" />
          {block.caption && <p className="block-caption label">{block.caption}</p>}
        </div>
      )
    }
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
    // frame: 'phone' sets each screenshot inside a phone outline on a larger
    // canvas, so a full-length mobile capture is shown whole instead of cropped
    const phone = block.frame === 'phone'
    if (block.frame === 'browser') {
      return (
        <div
          className="block-gallery block-gallery--browser"
          data-cols={String(block.columns ?? 2)}
          {...(tinaFieldAttr ? { 'data-tina-field': tinaFieldAttr } : {})}
        >
          {(block.images ?? []).map((img: Record<string, string>, i: number) => (
            <div key={i} className="gallery-item img-reveal">
              <BrowserFrame
                src={img.src}
                alt={img.alt}
                aspect={img.aspectRatio ?? '3/2'}
                sizes="(max-width: 640px) 100vw, 50vw"
              />
            </div>
          ))}
        </div>
      )
    }
    if (phone) {
      return (
        <div
          className="block-gallery block-gallery--phone"
          data-cols={String(block.columns ?? 3)}
          {...(tinaFieldAttr ? { 'data-tina-field': tinaFieldAttr } : {})}
        >
          {(block.images ?? []).map((img: Record<string, string>, i: number) => (
            <div key={i} className="gallery-item phone-canvas img-reveal">
              <div
                className="phone"
                style={img.aspectRatio ? ({ '--screen-aspect': img.aspectRatio } as CSSProperties) : undefined}
              >
                <div className="phone-screen">
                  {img.src && (
                    <Image
                      src={img.src}
                      alt={img.alt ?? ''}
                      fill
                      sizes="(max-width: 640px) 80vw, 25vw"
                      style={{ objectFit: 'cover', objectPosition: 'top' }}
                      loading="lazy"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }
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
              {img.video ? (
                // a video in a gallery cell: the image becomes its poster, and it
                // behaves like the stills around it rather than a player
                <video
                  src={dropboxUrl(img.video)}
                  poster={img.src || undefined}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label={img.alt ?? ''}
                />
              ) : img.src && (
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
    // Square and portrait videos were being cropped by the fixed 16:9 frame.
    // Portrait ones also get their width capped in CSS, or a 4:5 fills the column.
    const vAspect: string = block.aspectRatio ?? '16/9'
    const [vw, vh] = vAspect.split('/').map(Number)
    const vPortrait = vw > 0 && vh > 0 && vh > vw
    return (
      <div
        className={`block-video${vPortrait ? ' block-video--portrait' : ''}`}
        style={{ '--aspect': vAspect } as CSSProperties}
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
              // an autoplaying loop is ambient footage; a scrubber on it reads as UI
              controls={!(block.autoplay && block.loop)}
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

  if (blockType === 'map3d') {
    const paired = !!block.pairImage
    const map = (
      <Map3D
        model={block.model}
        parcels={block.parcels}
        caption={paired ? undefined : block.caption}
        mode={block.mode ?? 'site'}
        aerial={block.aerial}
        aspect={paired ? 1.5 : 1}
      />
    )
    return (
      <div
        className={`block-map3d ${paired ? 'block-map3d--pair' : `block-map3d--${block.width ?? 'half'}`}`}
        data-animate="fade-up"
        {...(tinaFieldAttr ? { 'data-tina-field': tinaFieldAttr } : {})}
      >
        {paired ? (
          <>
            <div className="img-container img-reveal map3d-pair-image">
              <Image
                src={block.pairImage}
                alt={block.pairAlt ?? ''}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                style={{ objectFit: 'cover', objectPosition: block.pairFocus ?? 'center' }}
                loading="lazy"
              />
            </div>
            {map}
            {block.caption && (
              <p className="block-caption label" style={{ gridColumn: '1 / -1' }}>{block.caption}</p>
            )}
          </>
        ) : map}
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
