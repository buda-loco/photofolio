import Image from 'next/image'
import type { RichNode } from '@/lib/richText'

interface RichTextProps {
  content: RichNode | null | undefined
}

function renderNode(node: RichNode, key: number | string): React.ReactNode {
  if (node.type === 'text') {
    let el: React.ReactNode = node.text ?? ''
    if (node.code) el = <code key={key}>{el}</code>
    if (node.bold) el = <strong>{el}</strong>
    if (node.italic) el = <em>{el}</em>
    if (node.strikethrough) el = <s>{el}</s>
    return el
  }

  if (node.type === 'break') return <br key={key} />

  const children = (node.children ?? []).map((child, i) => renderNode(child, i))

  switch (node.type) {
    case 'root':       return <>{children}</>
    case 'p':          return <p key={key}>{children}</p>
    case 'h1':         return <h1 key={key}>{children}</h1>
    case 'h2':         return <h2 key={key}>{children}</h2>
    case 'h3':         return <h3 key={key}>{children}</h3>
    case 'h4':         return <h4 key={key}>{children}</h4>
    case 'h5':         return <h5 key={key}>{children}</h5>
    case 'h6':         return <h6 key={key}>{children}</h6>
    case 'ul':         return <ul key={key}>{children}</ul>
    case 'ol':         return <ol key={key}>{children}</ol>
    case 'li':         return <li key={key}>{children}</li>
    case 'lic':        return <>{children}</>
    case 'a': {
      const ext = node.url?.startsWith('http')
        ? { target: '_blank' as const, rel: 'noopener noreferrer' }
        : {}
      return <a key={key} href={node.url ?? ''} title={node.title} {...ext}>{children}</a>
    }
    case 'img':
      return (
        <span key={key} className="img-container richtext-img">
          <Image
            src={node.url ?? ''}
            alt={node.alt ?? ''}
            fill
            sizes="(max-width: 768px) 100vw, 56ch"
            style={{ objectFit: 'cover' }}
          />
        </span>
      )
    case 'blockquote':  return <blockquote key={key}>{children}</blockquote>
    case 'code_block':  return <pre key={key}><code className={node.lang ? `language-${node.lang}` : undefined}>{children}</code></pre>
    default:            return <>{children}</>
  }
}

export default function RichText({ content }: RichTextProps) {
  if (!content) return null
  return <>{renderNode(content, 0)}</>
}
