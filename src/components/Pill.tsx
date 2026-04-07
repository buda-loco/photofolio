import type { CSSProperties } from 'react'

interface PillProps {
  label: string
  variant?: 'outline' | 'filled'
  className?: string
  style?: CSSProperties
}

export default function Pill({ label, variant = 'outline', className, style }: PillProps) {
  const classes = ['pill', variant === 'filled' ? 'pill--filled' : '', className].filter(Boolean).join(' ')
  return <span className={classes} style={style}>{label}</span>
}
