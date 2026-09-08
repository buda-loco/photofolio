/**
 * Frame — an image slot with a fixed aspect ratio.
 * With `src` it renders the image; without, a hatched placeholder carrying
 * the label and the ratio so the stage reads correctly before content lands.
 */

type Ratio = '1:1' | '16:9' | '4:3' | '21:9'

const RATIO: Record<Ratio, string> = { '1:1': '1 / 1', '16:9': '16 / 9', '4:3': '4 / 3', '21:9': '21 / 9' }

export default function Frame({
  src,
  alt,
  label,
  ratio = '16:9',
  surface = 'black',
  fit = 'cover',
  bleed = false,
  className = '',
}: {
  src?: string
  alt?: string
  label?: string
  ratio?: Ratio
  /** background the artwork sits on */
  surface?: 'black' | 'white' | 'raised'
  fit?: 'cover' | 'contain'
  /** no border, no radius — for the hero logo and the big mockup */
  bleed?: boolean
  className?: string
}) {
  const cls = [
    'rs-frame',
    `rs-frame--${surface}`,
    bleed ? 'rs-frame--bleed' : '',
    src ? '' : 'rs-frame--empty',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <figure className={cls} style={{ aspectRatio: RATIO[ratio] }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt ?? label ?? ''} style={{ objectFit: fit }} draggable={false} />
      ) : (
        <span className="rs-frame-ph" aria-hidden="true">
          <span className="rs-frame-ph-label">{label ?? 'Placeholder'}</span>
          <span className="rs-frame-ph-ratio">{ratio}</span>
        </span>
      )}
    </figure>
  )
}
