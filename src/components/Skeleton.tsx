import { type CSSProperties } from 'react'

interface SkeletonProps {
  width?: string
  height?: string
  borderRadius?: string
  className?: string
}

export default function Skeleton({
  width = '100%',
  height = '1em',
  borderRadius = '4px',
  className = '',
}: SkeletonProps) {
  const style: CSSProperties = { width, height, borderRadius }
  return <span className={`skeleton ${className}`} style={style} aria-hidden="true" />
}

export function SkeletonText({ lines = 3, width = '100%' }: { lines?: number; width?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6em', width }} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <span
          key={i}
          className="skeleton"
          style={{
            height: '0.85em',
            borderRadius: '3px',
            width: i === lines - 1 ? '60%' : '100%',
          }}
        />
      ))}
    </div>
  )
}
