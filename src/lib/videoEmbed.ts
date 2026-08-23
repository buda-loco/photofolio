/**
 * Shared video-embed helpers.
 *
 * Extracted from Block.tsx so the project-page blocks and the /showreel
 * lightbox build OneLinePlayer URLs the same way. Behaviour is unchanged from
 * the original implementations — this is a move, not a rewrite.
 */

export const SITE_ORIGIN = 'https://benjaminarnedo.com'

export function absoluteUrl(path: string): string {
  if (!path) return ''
  return path.startsWith('/') ? `${SITE_ORIGIN}${path}` : path
}

/**
 * Dropbox share links land on a preview page, not the file. Swapping the
 * `dl` param for `raw=1` returns the bytes, which is what a player needs.
 */
export function dropboxUrl(src: string): string {
  if (!src?.includes('dropbox.com')) return src
  const base = src.replace(/[?&]dl=\d/, '').replace(/\?$/, '')
  return base + (src.includes('?') ? '&raw=1' : '?raw=1')
}

export function onelinerSrc(url: string, opts: Record<string, string> = {}): string {
  const params = new URLSearchParams({
    url,
    autoplay: opts['autoplay'] ?? 'false',
    autopause: 'true',
    muted: opts['muted'] ?? 'false',
    loop: opts['loop'] ?? 'false',
    progressBar: 'true',
    overlay: 'true',
    muteButton: 'true',
    fullscreenButton: 'true',
    style: 'dark',
    quality: 'auto',
    playButton: 'true',
    // Always pass a poster: with none, OneLinePlayer requests `onelineplayer.com/null`
    // (harmless but a console 404). Fall back to a 1×1 black image on our origin.
    poster: opts['poster'] || `${SITE_ORIGIN}/video-poster-fallback.png`,
  })
  return `https://onelineplayer.com/player.html?${params}`
}
