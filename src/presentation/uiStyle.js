import { hexToRgb, interpolateHexColor, interpolateHexColorByT, interpolateHexColorStopsByT } from './colorScale.js'

function safeNumber(v, fallback = null) {
  if (typeof v === 'string') {
    const parsed = Number(v)
    if (!Number.isNaN(parsed)) return parsed
  }
  return typeof v === 'number' && !Number.isNaN(v) ? v : fallback
}

const warned = new Set()
function warnOnce(key, ...args) {
  if (warned.has(key)) return
  warned.add(key)
  console.warn('[PRESENTATION]', ...args)
}

export function getTransitionMs(uiConfig) {
  const ms = safeNumber(uiConfig?.motion?.transitionMs, 0)
  return ms && ms > 0 ? ms : 0
}

function resolvePalette(uiConfig, paletteId) {
  const palette = uiConfig?.palettes?.[paletteId]
  if (Array.isArray(palette)) return { type: 'array', colors: palette }
  if (palette && typeof palette === 'object') {
    const stops = Object.entries(palette)
      .map(([k, v]) => ({ pos: parseFloat(k), color: v }))
      .filter((s) => typeof s.pos === 'number' && !Number.isNaN(s.pos) && typeof s.color === 'string')
      .sort((a, b) => a.pos - b.pos)
    if (stops.length >= 2) return { type: 'stops', stops }
  }
  return null
}

function resolveScale(uiConfig, scaleId) {
  const scale = uiConfig?.scales?.[scaleId]
  if (!scale) return null

  const min = safeNumber(scale?.range?.min, null)
  const max = safeNumber(scale?.range?.max, null)
  if (min === null || max === null) return null

  const paletteId = scale?.colors?.palette
  const palette = resolvePalette(uiConfig, paletteId)
  if (!palette) {
    warnOnce(`missing-palette:${paletteId}`, 'Missing palette:', paletteId)
    return null
  }

  return { min, max, palette, paletteId }
}

function clamp01(t) {
  if (typeof t !== 'number' || Number.isNaN(t)) return 0
  return Math.max(0, Math.min(1, t))
}

function resolveColor({ value, min, max, palette }) {
  if (typeof min !== 'number' || typeof max !== 'number' || min === max) {
    if (palette?.type === 'array') return palette.colors?.[0] ?? null
    if (palette?.type === 'stops') return palette.stops?.[0]?.color ?? null
    return null
  }

  let minV = min
  let maxV = max
  if (minV > maxV) {
    warnOnce(`swapped-range:${minV}:${maxV}`, 'Scale range min > max; swapping', { min, max })
    ;[minV, maxV] = [maxV, minV]
  }

  const clamped = Math.max(minV, Math.min(maxV, value))
  const t = clamp01((clamped - minV) / (maxV - minV))

  if (palette.type === 'array') return interpolateHexColorByT({ t, colors: palette.colors })
  if (palette.type === 'stops') return interpolateHexColorStopsByT({ t, stops: palette.stops })
  return null
}

function resolveColorDebug({ value, min, max, palette }) {
  let minV = min
  let maxV = max
  if (minV > maxV) ;[minV, maxV] = [maxV, minV]
  const clamped = Math.max(minV, Math.min(maxV, value))
  const t = minV === maxV ? 0 : clamp01((clamped - minV) / (maxV - minV))
  const hex = resolveColor({ value, min: minV, max: maxV, palette })
  return { min: minV, max: maxV, clamped, t, hex, paletteType: palette?.type ?? 'unknown' }
}

export function getSignalColor({ signalName, value, uiConfig }) {
  if (!uiConfig) return null
  const signalCfg = uiConfig?.signals?.[signalName]
  const scaleId = signalCfg?.scale
  const scale = resolveScale(uiConfig, scaleId)
  if (!scale) {
    warnOnce(`missing-scale:${scaleId}`, 'Missing scale for signal:', signalName, scaleId)
    return null
  }
  const v = safeNumber(value, null)
  if (v === null) return null
  return resolveColor({ value: v, min: scale.min, max: scale.max, palette: scale.palette })
}

export function getSignalColorDebug({ signalName, value, uiConfig }) {
  if (!uiConfig) return null
  const signalCfg = uiConfig?.signals?.[signalName]
  const scaleId = signalCfg?.scale
  const scale = resolveScale(uiConfig, scaleId)
  if (!scale) return null
  const v = safeNumber(value, null)
  if (v === null) return null
  return {
    scaleId,
    paletteId: scale.paletteId ?? null,
    ...resolveColorDebug({ value: v, min: scale.min, max: scale.max, palette: scale.palette }),
  }
}

function findSignalValue(latestDecision, signalName) {
  const signals = Array.isArray(latestDecision?.signals) ? latestDecision.signals : []
  const s = signals.find((x) => x?.name === signalName)
  if (!s) return null
  return typeof s.value === 'number' ? s.value : null
}

export function getUnitFillColor({ unitId, latestDecision, uiConfig }) {
  if (!uiConfig) return null
  const unitCfg = uiConfig?.units?.[unitId]
  const fillCfg = unitCfg?.fill
  if (!fillCfg) return null

  const fromSignal = fillCfg?.fromSignal
  const scaleId = fillCfg?.scale
  if (typeof fromSignal !== 'string' || fromSignal.length === 0) return null
  const scale = resolveScale(uiConfig, scaleId)
  if (!scale) {
    warnOnce(`missing-scale:${scaleId}`, 'Missing scale for unit fill:', unitId, scaleId)
    return null
  }

  const v = findSignalValue(latestDecision, fromSignal)
  if (v === null) return null

  return resolveColor({ value: v, min: scale.min, max: scale.max, palette: scale.palette })
}

export function hexToRgba(hex, alpha) {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  const a = typeof alpha === 'number' ? Math.max(0, Math.min(1, alpha)) : 1
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`
}

function relativeLuminance({ r, g, b }) {
  const srgb = [r, g, b].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
}

export function getReadableTextStyle(bgHex) {
  const rgb = hexToRgb(bgHex)
  if (!rgb) {
    return { fill: '#0b1220', stroke: 'rgba(255,255,255,0.7)' }
  }
  const lum = relativeLuminance(rgb)
  if (lum < 0.45) {
    return { fill: '#ffffff', stroke: 'rgba(0,0,0,0.55)' }
  }
  return { fill: '#0b1220', stroke: 'rgba(255,255,255,0.75)' }
}
