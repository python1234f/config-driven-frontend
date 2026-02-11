import React from 'react'
import { ReactFlow, Background, Controls, Handle, MarkerType, Position } from '@xyflow/react'
import {
  getReadableTextStyle,
  getTransitionMs,
  getUnitFillColor,
  hexToRgba,
} from '../presentation/uiStyle.js'
import { useRealtimeStore } from './realtime/realtimeStore.js'
import { RenderCounter } from './debug/RenderCounter.jsx'

const CARD_STYLE = {
  background: '#0b1220',
  border: '1px solid rgba(148, 163, 184, 0.16)',
  borderRadius: 14,
  padding: 12,
  height: '100%',
  position: 'relative',
  display: 'grid',
  gridTemplateRows: 'auto 1fr',
  gap: 10,
}

const TITLE_STYLE = { color: '#e5e7eb' }
const MUTED_STYLE = { color: 'rgba(203, 213, 225, 0.75)' }

const HEADER_ROW_STYLE = {
  justifyContent: 'space-between',
  alignItems: 'center',
}

const FLOW_WRAP_STYLE = {
  width: '100%',
  height: '100%',
  minHeight: 280,
  borderRadius: 12,
  overflow: 'hidden',
  background: '#070a12',
}

const FLOW_STYLE = {
  background: '#070a12',
}

const FIT_VIEW_OPTIONS = { padding: 0.18 }

const EDGE_BASE_STYLE = { stroke: '#cbd5e1', strokeWidth: 2 }
const EDGE_ALARM_STYLE = { stroke: '#ef4444', strokeWidth: 3 }
const EDGE_ALARM_MARKER_END = { type: MarkerType.ArrowClosed, color: '#ef4444' }

const DEFAULT_EDGE_OPTIONS = {
  type: 'smoothstep',
  animated: true,
  style: EDGE_BASE_STYLE,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#cbd5e1',
  },
  pathOptions: { borderRadius: 10 },
}

const SIGNAL_BADGE_STYLE = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 10px',
  borderRadius: 999,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'rgba(2, 6, 23, 0.6)',
  color: '#e5e7eb',
  fontSize: 12,
}

const SIGNAL_DOT_OK_STYLE = {
  width: 8,
  height: 8,
  borderRadius: 999,
  background: '#22c55e',
  boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.15)',
}

const SIGNAL_DOT_ALARM_STYLE = {
  ...SIGNAL_DOT_OK_STYLE,
  background: '#ef4444',
  boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.18)',
}

const LIVE_LABEL_STYLE = { opacity: 0.9 }
const SIGNAL_LABEL_STYLE = { opacity: 0.9 }
const SIGNAL_VALUE_STYLE = { fontWeight: 700 }

const NODE_DEFAULT_BG = 'rgba(15, 23, 42, 0.85)'
const NODE_DEFAULT_BORDER = 'rgba(148, 163, 184, 0.22)'
const NODE_DEFAULT_TEXT_FILL = '#e5e7eb'
const NODE_DEFAULT_TEXT_STROKE = 'rgba(0,0,0,0.65)'
const NODE_W = 168
const NODE_H = 76
const NODE_X_GAP = 120
const NODE_Y_GAP = 54

const HANDLE_STYLE = {
  width: 10,
  height: 10,
  opacity: 0,
  border: 'none',
  background: 'transparent',
  pointerEvents: 'none',
}

const nodeTypes = {
  unit: React.memo(function UnitNode({ data }) {
    const title = data?.title ?? 'Unit'
    const subtitle = data?.subtitle ?? ''
    const valueText = data?.valueText ?? null
    const accent = data?.accent ?? '#22c55e'
    const bg = data?.bg ?? NODE_DEFAULT_BG
    const border = data?.border ?? NODE_DEFAULT_BORDER
    const ring = data?.ring ?? null
    const transitionMs = typeof data?.transitionMs === 'number' ? data.transitionMs : 0
    const textFill = data?.textFill ?? NODE_DEFAULT_TEXT_FILL
    const textStroke = data?.textStroke ?? NODE_DEFAULT_TEXT_STROKE

    const rootStyle = {
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

    const headingStyle = {
      margin: 0,
      fontSize: 12,
      letterSpacing: '0.02em',
      fontWeight: 700,
      color: textFill,
      textShadow: `0 1px 0 ${textStroke}`,
    }

    const subStyle = {
      marginTop: 4,
      fontSize: 11,
      color: 'rgba(203, 213, 225, 0.78)',
    }

    const valueRowStyle = {
      marginTop: 10,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
      fontSize: 12,
      color: 'rgba(226, 232, 240, 0.92)',
    }

    const chipStyle = {
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
  }),
}

function findSignal(decision, signalName) {
  const signals = Array.isArray(decision?.signals) ? decision.signals : []
  return signals.find((s) => s?.name === signalName) ?? null
}

function formatSignalValue(signal) {
  if (!signal) return null
  const v = typeof signal.value === 'number' ? signal.value : null
  if (v === null) return null
  const unit = signal.unit ? ` ${signal.unit}` : ''
  return `${v.toFixed(2)}${unit}`
}

function isAlarmish({ latestDecision, uiConfig }) {
  if (!latestDecision) return false
  const conf = typeof latestDecision.confidence === 'number' ? latestDecision.confidence : 0
  if (conf >= 0.82) return true

  const pt = findSignal(latestDecision, 'PT-101')
  const ptValue = typeof pt?.value === 'number' ? pt.value : null
  const max = uiConfig?.scales?.pressureBar?.range?.max
  if (typeof ptValue === 'number' && typeof max === 'number') return ptValue >= max * 0.96
  return false
}

function buildLayoutFromUnits(units) {
  return units.map((u) => ({
    id: u.id,
    type: u.type || 'Unit',
  }))
}

function computeLayeredLayout({ units, connections }) {
  const unitIds = (units || []).map((u) => u.id)
  const outgoing = new Map()
  const incoming = new Map()

  for (const id of unitIds) {
    outgoing.set(id, [])
    incoming.set(id, [])
  }

  for (const c of connections || []) {
    const from = c?.from
    const to = c?.to
    if (!outgoing.has(from) || !incoming.has(to)) continue
    outgoing.get(from).push(to)
    incoming.get(to).push(from)
  }

  const layerById = new Map()
  const queue = []
  const sources = unitIds.filter((id) => (incoming.get(id)?.length || 0) === 0)
  const start = sources.length ? sources : unitIds.slice(0, 1)

  for (const id of start) {
    layerById.set(id, 0)
    queue.push(id)
  }

  while (queue.length) {
    const id = queue.shift()
    const layer = layerById.get(id) ?? 0
    const next = outgoing.get(id) || []
    for (const to of next) {
      const prev = layerById.get(to)
      const cand = layer + 1
      if (prev == null || cand > prev) {
        layerById.set(to, cand)
        queue.push(to)
      }
    }
  }

  for (const id of unitIds) {
    if (!layerById.has(id)) layerById.set(id, 0)
  }

  const layers = new Map()
  for (const id of unitIds) {
    const l = layerById.get(id) ?? 0
    const list = layers.get(l) || []
    list.push(id)
    layers.set(l, list)
  }

  const sortedLayerKeys = Array.from(layers.keys()).sort((a, b) => a - b)
  const orderById = new Map(unitIds.map((id, idx) => [id, idx]))

  for (const layerKey of sortedLayerKeys) {
    const ids = layers.get(layerKey) || []
    if (layerKey === 0) continue
    ids.sort((a, b) => {
      const pa = incoming.get(a) || []
      const pb = incoming.get(b) || []
      const ba =
        pa.length ? pa.reduce((acc, p) => acc + (orderById.get(p) ?? 0), 0) / pa.length : 0
      const bb =
        pb.length ? pb.reduce((acc, p) => acc + (orderById.get(p) ?? 0), 0) / pb.length : 0
      if (ba !== bb) return ba - bb
      return (orderById.get(a) ?? 0) - (orderById.get(b) ?? 0)
    })
    ids.forEach((id, idx) => orderById.set(id, idx))
  }

  const positions = new Map()
  for (const layerKey of sortedLayerKeys) {
    const ids = layers.get(layerKey) || []
    for (let i = 0; i < ids.length; i += 1) {
      const id = ids[i]
      positions.set(id, {
        x: 40 + layerKey * (NODE_W + NODE_X_GAP),
        y: 40 + i * (NODE_H + NODE_Y_GAP),
      })
    }
  }

  return positions
}

export const ProcessDiagram = React.memo(function ProcessDiagram({
  diagram,
  uiConfig,
}) {
  const latestDecision = useRealtimeStore((s) => s.latestDecision)
  const transitionMs = getTransitionMs(uiConfig)
  const activeUnitId = latestDecision?.meta?.unitId ?? null
  const alarm = isAlarmish({ latestDecision, uiConfig })
  const flowRef = React.useRef(null)
  const nodeIndexByUnitIdRef = React.useRef(new Map())
  const lastAlarmSourceRef = React.useRef(null)

  const onFlowInit = React.useCallback((instance) => {
    flowRef.current = instance
    instance.fitView(FIT_VIEW_OPTIONS)
  }, [])

  const baseNodes = React.useMemo(() => {
    if (!diagram?.units?.length) return []
    const units = buildLayoutFromUnits(diagram.units)
    const positions = computeLayeredLayout({
      units,
      connections: diagram.connections || [],
    })

    return units.map((u) => ({
      id: u.id,
      type: 'unit',
      position: positions.get(u.id) || { x: 40, y: 40 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      draggable: false,
      selectable: false,
      data: {
        unitId: u.id,
        title: u.type || 'Unit',
        subtitle: u.id,
        transitionMs,
        textFill: NODE_DEFAULT_TEXT_FILL,
        textStroke: NODE_DEFAULT_TEXT_STROKE,
        __sig: '',
      },
    }))
  }, [diagram, transitionMs])

  const baseEdges = React.useMemo(() => {
    if (!diagram?.connections?.length) return []
    return diagram.connections
      .map((c, idx) => {
        if (!c?.from || !c?.to) return null
        return {
          id: `${c.from}->${c.to}-${idx}`,
          source: c.from,
          target: c.to,
          animated: true,
          type: 'smoothstep',
          data: { __sig: '' },
        }
      })
      .filter(Boolean)
  }, [diagram])

  React.useEffect(() => {
    const instance = flowRef.current
    if (!instance) return
    instance.setNodes(baseNodes)
    instance.setEdges(baseEdges)
    instance.fitView(FIT_VIEW_OPTIONS)
  }, [baseNodes, baseEdges])

  React.useEffect(() => {
    nodeIndexByUnitIdRef.current = new Map(
      baseNodes.map((n, idx) => [n?.data?.unitId, idx]).filter(([id]) => !!id),
    )
  }, [baseNodes])

  React.useEffect(() => {
    const instance = flowRef.current
    if (!instance) return

    const pt = findSignal(latestDecision, 'PT-101')
    const ptText = formatSignalValue(pt)
    const dynamicUnitIds = new Set([
      ...Object.keys(uiConfig?.units || {}),
      ...(activeUnitId ? [activeUnitId] : []),
    ])

    instance.setNodes((prev) => {
      if (!Array.isArray(prev) || prev.length === 0) return prev
      if (!dynamicUnitIds.size) return prev

      let next = prev
      const nodeIndexByUnitId = nodeIndexByUnitIdRef.current

      for (const unitId of dynamicUnitIds) {
        const idx = nodeIndexByUnitId.get(unitId)
        if (typeof idx !== 'number') continue
        const n = next[idx]
        if (!n) continue

        const uiFill =
          latestDecision && uiConfig
            ? getUnitFillColor({ unitId, latestDecision, uiConfig })
            : null

        const accent = uiFill || '#22c55e'
        const bg = uiFill
          ? hexToRgba(uiFill, 0.16) || NODE_DEFAULT_BG
          : NODE_DEFAULT_BG
        const border = uiFill
          ? hexToRgba(uiFill, 0.42) || 'rgba(148, 163, 184, 0.26)'
          : NODE_DEFAULT_BORDER

        const ring =
          activeUnitId && unitId === activeUnitId
            ? alarm
              ? 'rgba(239, 68, 68, 0.65)'
              : 'rgba(34, 197, 94, 0.55)'
            : null

        const readable = uiFill ? getReadableTextStyle(uiFill) : null
        const textFill = readable?.fill ?? NODE_DEFAULT_TEXT_FILL
        const textStroke = readable?.stroke ?? NODE_DEFAULT_TEXT_STROKE

        const valueText = unitId === activeUnitId ? ptText : null
        const sig = [
          transitionMs,
          accent,
          bg,
          border,
          ring || '',
          textFill,
          textStroke,
          valueText || '',
        ].join('|')

        if (n.data?.__sig === sig) continue

        if (next === prev) next = prev.slice()
        next[idx] = {
          ...n,
          data: {
            ...n.data,
            transitionMs,
            accent,
            bg,
            border,
            ring,
            textFill,
            textStroke,
            valueText,
            __sig: sig,
          },
        }
      }

      return next
    })

    const nextAlarmSource = activeUnitId && alarm ? activeUnitId : null
    const prevAlarmSource = lastAlarmSourceRef.current
    if (prevAlarmSource === nextAlarmSource) return

    instance.setEdges((prev) => {
      if (!Array.isArray(prev) || prev.length === 0) return prev
      let next = prev

      for (let i = 0; i < prev.length; i += 1) {
        const e = prev[i]
        const shouldTouch =
          (prevAlarmSource && e.source === prevAlarmSource) ||
          (nextAlarmSource && e.source === nextAlarmSource)

        if (!shouldTouch) continue

        const edgeAlarm = !!nextAlarmSource && e.source === nextAlarmSource
        const sig = edgeAlarm ? `alarm:${nextAlarmSource}` : 'ok'
        if (e.data?.__sig === sig) continue

        if (next === prev) next = prev.slice()
        next[i] = {
          ...e,
          style: edgeAlarm ? EDGE_ALARM_STYLE : undefined,
          markerEnd: edgeAlarm ? EDGE_ALARM_MARKER_END : undefined,
          data: { ...(e.data || {}), __sig: sig },
        }
      }

      return next
    })
    lastAlarmSourceRef.current = nextAlarmSource
  }, [latestDecision, uiConfig, transitionMs, activeUnitId, alarm])

  const pt = findSignal(latestDecision, 'PT-101')
  const ptText = formatSignalValue(pt)

  if (!diagram) {
    return (
      <div className="card" style={CARD_STYLE}>
        <div className="h2" style={TITLE_STYLE}>
          Process Diagram
        </div>
        <div className="muted" style={MUTED_STYLE}>
          No diagram loaded.
        </div>
      </div>
    )
  }

  return (
    <div className="card" style={CARD_STYLE}>
      <RenderCounter name="Diagram" index={0} />
      <div className="rowWrap" style={HEADER_ROW_STYLE}>
        <div>
          <div className="h2" style={TITLE_STYLE}>
            Process Diagram
          </div>
          <div className="muted" style={MUTED_STYLE}>
            {diagram.id}
          </div>
        </div>

        <span style={SIGNAL_BADGE_STYLE}>
          <span style={alarm ? SIGNAL_DOT_ALARM_STYLE : SIGNAL_DOT_OK_STYLE} />
          <span style={SIGNAL_LABEL_STYLE}>PT-101</span>
          <span style={SIGNAL_VALUE_STYLE}>{ptText ?? '—'}</span>
        </span>
      </div>

      <div style={FLOW_WRAP_STYLE}>
        <ReactFlow
          defaultNodes={baseNodes}
          defaultEdges={baseEdges}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
          onInit={onFlowInit}
          nodesDraggable={false}
          nodesConnectable={false}
          style={FLOW_STYLE}
        >
          <Background
            variant="dots"
            gap={18}
            size={1}
            color="rgba(148, 163, 184, 0.22)"
          />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  )
})
