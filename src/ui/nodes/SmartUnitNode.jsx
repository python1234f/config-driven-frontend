import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { useRealtimeSelector } from '../realtime/realtimeStore.js'
import {
  getReadableTextStyle,
  getUnitFillColor,
  hexToRgba,
} from '../../presentation/uiStyle.js'

const NODE_DEFAULT_BG = 'rgba(15, 23, 42, 0.85)'
const NODE_DEFAULT_BORDER = 'rgba(148, 163, 184, 0.22)'
const NODE_DEFAULT_TEXT_FILL = '#e5e7eb'
const NODE_DEFAULT_TEXT_STROKE = 'rgba(0,0,0,0.65)'

const LIVE_LABEL_STYLE = { opacity: 0.9 }
const HANDLE_STYLE = {
  width: 10,
  height: 10,
  opacity: 0,
  border: 'none',
  background: 'transparent',
  pointerEvents: 'none',
}

function formatSignalValue(signal) {
  if (!signal) return null
  const v = typeof signal.value === 'number' ? signal.value : null
  if (v === null) return null
  const unit = signal.unit ? ` ${signal.unit}` : ''
  return `${v.toFixed(2)}${unit}`
}

function findSignal(decision, signalName) {
  const signals = Array.isArray(decision?.signals) ? decision.signals : []
  return signals.find((s) => s?.name === signalName) ?? null
}

function computeAlarmFlag(decision) {
  if (!decision) return false
  const conf = typeof decision.confidence === 'number' ? decision.confidence : 0
  return conf >= 0.82 || /anomaly|alarm/i.test(String(decision.type || ''))
}

function shallowEqualUnitState(a, b) {
  if (a === b) return true
  if (!a || !b) return false
  return (
    a.fill === b.fill &&
    a.sectionAlarm === b.sectionAlarm &&
    a.isActive === b.isActive &&
    a.isAlarm === b.isAlarm &&
    a.valueText === b.valueText
  )
}

export const SmartUnitNode = React.memo(function SmartUnitNode({ id, data }) {
  const title = data?.title ?? 'Unit'
  const subtitle = data?.subtitle ?? ''
  const uiConfig = data?.uiConfig ?? null
  const sectionId = data?.sectionId ?? null
  const transitionMs = typeof data?.transitionMs === 'number' ? data.transitionMs : 0

  const select = React.useCallback(
    (state) => {
      const decision = state.latestDecision
      const isActive = decision?.meta?.unitId === id
      const isAlarm = isActive ? computeAlarmFlag(decision) : false

      const sectionAlarm =
        !!sectionId &&
        computeAlarmFlag(decision) &&
        decision?.meta?.sectionId === sectionId

      const hasFillCfg = !!uiConfig?.units?.[id]?.fill
      const fill = sectionAlarm
        ? '#ef4444'
        : hasFillCfg && decision && uiConfig
          ? getUnitFillColor({ unitId: id, latestDecision: decision, uiConfig })
          : null

      const valueText = isActive ? formatSignalValue(findSignal(decision, 'PT-101')) : null

      return { fill, sectionAlarm, isActive, isAlarm, valueText }
    },
    [id, uiConfig, sectionId],
  )

  const { fill, sectionAlarm, isActive, isAlarm, valueText } = useRealtimeSelector(
    select,
    shallowEqualUnitState,
  )

  const { accent, bg, border, ring, textFill, textStroke } = React.useMemo(() => {
    const accent = fill || '#22c55e'
    const bg = fill
      ? hexToRgba(fill, sectionAlarm ? 0.12 : 0.16) || NODE_DEFAULT_BG
      : NODE_DEFAULT_BG
    const border = fill
      ? hexToRgba(fill, sectionAlarm ? 0.6 : 0.42) || 'rgba(148, 163, 184, 0.26)'
      : NODE_DEFAULT_BORDER

    const ring = isActive
      ? isAlarm
        ? 'rgba(239, 68, 68, 0.65)'
        : 'rgba(34, 197, 94, 0.55)'
      : null

    const readable = fill ? getReadableTextStyle(fill) : null
    const textFill = readable?.fill ?? NODE_DEFAULT_TEXT_FILL
    const textStroke = readable?.stroke ?? NODE_DEFAULT_TEXT_STROKE

    return { accent, bg, border, ring, textFill, textStroke }
  }, [fill, sectionAlarm, isActive, isAlarm])

  const rootStyle = React.useMemo(() => {
    return {
      width: 168,
      padding: 12,
      borderRadius: 14,
      background: bg,
      border: `1px solid ${border}`,
      boxShadow: ring
        ? `0 0 0 2px ${ring}, 0 14px 34px rgba(0,0,0,0.35)`
        : '0 14px 34px rgba(0,0,0,0.35)',
      transition:
        transitionMs > 0
          ? `box-shadow ${transitionMs}ms linear, border ${transitionMs}ms linear, background ${transitionMs}ms linear`
          : undefined,
    }
  }, [bg, border, ring, transitionMs])

  const headingStyle = React.useMemo(() => {
    return {
      margin: 0,
      fontSize: 12,
      letterSpacing: '0.02em',
      fontWeight: 700,
      color: textFill,
      textShadow: `0 1px 0 ${textStroke}`,
    }
  }, [textFill, textStroke])

  const subStyle = React.useMemo(() => {
    return {
      marginTop: 4,
      fontSize: 11,
      color: 'rgba(203, 213, 225, 0.78)',
    }
  }, [])

  const valueRowStyle = React.useMemo(() => {
    return {
      marginTop: 10,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
      fontSize: 12,
      color: 'rgba(226, 232, 240, 0.92)',
    }
  }, [])

  const chipStyle = React.useMemo(() => {
    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '2px 8px',
      borderRadius: 999,
      border: `1px solid ${hexToRgba(accent, 0.28) || 'rgba(34,197,94,0.28)'}`,
      background: hexToRgba(accent, 0.12) || 'rgba(34,197,94,0.12)',
      color: '#e5e7eb',
      fontSize: 11,
      fontWeight: 600,
    }
  }, [accent])

  return (
    <div style={rootStyle}>
      <Handle type="target" position={Position.Left} style={HANDLE_STYLE} />
      <Handle type="source" position={Position.Right} style={HANDLE_STYLE} />
      <div style={headingStyle}>{title}</div>
      <div style={subStyle}>{subtitle}</div>
      {valueText ? (
        <div style={valueRowStyle}>
          <span style={LIVE_LABEL_STYLE}>LIVE</span>
          <span style={chipStyle}>{valueText}</span>
        </div>
      ) : null}
    </div>
  )
})
