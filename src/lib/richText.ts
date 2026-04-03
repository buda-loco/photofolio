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

export function richToPlain(node: RichNode | null | undefined): string {
  if (!node) return ''
  if (node.type === 'text') return node.text ?? ''
  return (node.children ?? []).map(richToPlain).join('')
}
