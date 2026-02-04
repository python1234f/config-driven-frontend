import React from 'react'

export function Badge({ tone = 'neutral', children }) {
  const className =
    tone === 'warn'
      ? 'badge warn'
      : tone === 'danger'
        ? 'badge danger'
        : 'badge'
  return <span className={className}>{children}</span>
}

