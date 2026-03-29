const siteUrl = 'https://benjaminarnedo.com'

const staticPages = ['/', '/about', '/how-i-work', '/contact']

export async function GET() {
  const files = import.meta.glob('../content/projects/*.json', { eager: true })
  const projects = Object.values(files)
    .map((m) => m.default)
    .filter((p) => !p.hidden)

  const projectUrls = projects.map((p) => `/work/${p.slug}`)
  const allUrls = [...staticPages, ...projectUrls]

  const entries = allUrls
    .map(
      (path) =>
        `  <url>\n    <loc>${siteUrl}${path}</loc>\n  </url>`
    )
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
