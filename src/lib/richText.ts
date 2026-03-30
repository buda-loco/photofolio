export type RichNode = {
  type: string
  text?: string
  bold?: boolean
  italic?: boolean
  code?: boolean
  strikethrough?: boolean
  url?: string
  title?: string
  alt?: string
  lang?: string
  children?: RichNode[]
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function richToHtml(node: RichNode | null | undefined): string {
  if (!node) return ''

  if (node.type === 'text') {
    let t = esc(node.text ?? '')
    if (node.code) t = `<code>${t}</code>`
    if (node.bold) t = `<strong>${t}</strong>`
    if (node.italic) t = `<em>${t}</em>`
    if (node.strikethrough) t = `<s>${t}</s>`
    return t
  }

  if (node.type === 'break') return '<br>'

  const inner = (node.children ?? []).map(richToHtml).join('')

  switch (node.type) {
    case 'root':       return inner
    case 'p':          return `<p>${inner}</p>`
    case 'h1':         return `<h1>${inner}</h1>`
    case 'h2':         return `<h2>${inner}</h2>`
    case 'h3':         return `<h3>${inner}</h3>`
    case 'h4':         return `<h4>${inner}</h4>`
    case 'h5':         return `<h5>${inner}</h5>`
    case 'h6':         return `<h6>${inner}</h6>`
    case 'ul':         return `<ul>${inner}</ul>`
    case 'ol':         return `<ol>${inner}</ol>`
    case 'li':         return `<li>${inner}</li>`
    case 'lic':        return inner
    case 'a': {
      const href = esc(node.url ?? '')
      const title = node.title ? ` title="${esc(node.title)}"` : ''
      const ext = node.url?.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : ''
      return `<a href="${href}"${title}${ext}>${inner}</a>`
    }
    case 'img': {
      return `<img src="${esc(node.url ?? '')}" alt="${esc(node.alt ?? '')}">`
    }
    case 'blockquote': return `<blockquote>${inner}</blockquote>`
    case 'code_block': {
      const lang = node.lang ? ` class="language-${esc(node.lang)}"` : ''
      return `<pre><code${lang}>${inner}</code></pre>`
    }
    default: return inner
  }
}

export function richToPlain(node: RichNode | null | undefined): string {
  if (!node) return ''
  if (node.type === 'text') return node.text ?? ''
  return (node.children ?? []).map(richToPlain).join('')
}
