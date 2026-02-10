function clamp01(t) {
  if (typeof t !== 'number' || Number.isNaN(t)) return 0
  return Math.max(0, Math.min(1, t))
}

function clampByte(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return 0
  return Math.max(0, Math.min(255, Math.round(n)))
}

export function hexToRgb(hex) {
  if (typeof hex !== 'string') return null
  const normalized = hex.trim().replace(/^#/, '')
  if (normalized.length === 3) {
    const r = parseInt(normalized[0] + normalized[0], 16)
    const g = parseInt(normalized[1] + normalized[1], 16)
    const b = parseInt(normalized[2] + normalized[2], 16)
    if ([r, g, b].some((x) => Number.isNaN(x))) return null
    return { r, g, b }
  }
  if (normalized.length === 6) {
    const r = parseInt(normalized.slice(0, 2), 16)
    const g = parseInt(normalized.slice(2, 4), 16)
    const b = parseInt(normalized.slice(4, 6), 16)
    if ([r, g, b].some((x) => Number.isNaN(x))) return null
    return { r, g, b }
  }
  return null
}

export function rgbToHex({ r, g, b }) {
  const rr = clampByte(r).toString(16).padStart(2, '0')
  const gg = clampByte(g).toString(16).padStart(2, '0')
  const bb = clampByte(b).toString(16).padStart(2, '0')
  return `#${rr}${gg}${bb}`
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

export function interpolateHexColorByT({ t, colors }) {
  if (!Array.isArray(colors) || colors.length < 2) return '#000000'
  const tt = clamp01(t)
  const segments = colors.length - 1
  const scaled = tt * segments
  const idx = Math.min(segments - 1, Math.floor(scaled))
  const localT = clamp01(scaled - idx)

  const c0 = hexToRgb(colors[idx]) ?? { r: 0, g: 0, b: 0 }
  const c1 = hexToRgb(colors[idx + 1]) ?? { r: 0, g: 0, b: 0 }

  return rgbToHex({
    r: lerp(c0.r, c1.r, localT),
    g: lerp(c0.g, c1.g, localT),
    b: lerp(c0.b, c1.b, localT),
  })
}

export function interpolateHexColorStopsByT({ t, stops }) {
  if (!Array.isArray(stops) || stops.length < 2) return '#000000'
  const tt = clamp01(t)
  const sorted = [...stops].sort((a, b) => a.pos - b.pos)

  let left = sorted[0]
  let right = sorted[sorted.length - 1]
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const a = sorted[i]
    const b = sorted[i + 1]
    if (tt >= a.pos && tt <= b.pos) {
      left = a
      right = b
      break
    }
  }

  const span = right.pos - left.pos
  const localT = span === 0 ? 0 : clamp01((tt - left.pos) / span)
  const c0 = hexToRgb(left.color) ?? { r: 0, g: 0, b: 0 }
  const c1 = hexToRgb(right.color) ?? { r: 0, g: 0, b: 0 }

  return rgbToHex({
    r: lerp(c0.r, c1.r, localT),
    g: lerp(c0.g, c1.g, localT),
    b: lerp(c0.b, c1.b, localT),
  })
}

/**
 * Deterministic, domain-agnostic color interpolation.
 * @param {{ value:number, min:number, max:number, colors:string[] }} input
 * @returns {string} hex color "#RRGGBB"
 */
export function interpolateHexColor({ value, min, max, colors }) {
  if (!Array.isArray(colors) || colors.length < 2) return '#000000'
  if (typeof min !== 'number' || typeof max !== 'number' || min === max) return colors[0]

  const t = clamp01((value - min) / (max - min))
  return interpolateHexColorByT({ t, colors })
}
