import React from 'react'

const FIXED_BASE_STYLE = {
  position: 'fixed',
  right: 12,
  top: 12,
  zIndex: 10000,
  pointerEvents: 'none',
}

const ABSOLUTE_BASE_STYLE = {
  position: 'absolute',
  right: 10,
  top: 10,
  zIndex: 10000,
  pointerEvents: 'none',
}

const PILL_STYLE = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '4px 8px',
  borderRadius: 999,
  border: '1px solid rgba(148, 163, 184, 0.22)',
  background: 'rgba(2, 6, 23, 0.72)',
  fontSize: 12,
  lineHeight: 1,
  fontVariantNumeric: 'tabular-nums',
}

const NAME_STYLE = { color: 'rgba(203, 213, 225, 0.85)' }

function colorForCount(count) {
  const hue = (count * 41) % 360
  return `hsl(${hue} 90% 70%)`
}

export function RenderCounter({ name = 'Render', mode = 'absolute', index = 0 }) {
  const count = React.useRef(0)
  count.current += 1

  const color = colorForCount(count.current)
  const rootStyle =
    mode === 'fixed'
      ? { ...FIXED_BASE_STYLE, top: 12 + index * 22 }
      : { ...ABSOLUTE_BASE_STYLE, top: 10 + index * 22 }

  return (
    <div style={rootStyle} aria-hidden="true">
      <span style={PILL_STYLE}>
        <span style={NAME_STYLE}>{name}</span>
        <span style={{ color, fontWeight: 800 }}>{count.current}</span>
      </span>
    </div>
  )
}

