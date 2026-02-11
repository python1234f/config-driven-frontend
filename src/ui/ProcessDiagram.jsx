import React from 'react'
import { ReactFlow, Background, Controls, Position } from '@xyflow/react'
import {
  getTransitionMs,
} from '../presentation/uiStyle.js'
import { RenderCounter } from './debug/RenderCounter.jsx'
import { SmartUnitNode } from './nodes/SmartUnitNode.jsx'
import { SmartPipeEdge } from './edges/SmartPipeEdge.jsx'
import { useRealtimeSelector } from './realtime/realtimeStore.js'

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

const EDGE_BASE_STYLE = { stroke: '#cbd5e1', strokeWidth: 2 }

const DEFAULT_EDGE_OPTIONS = {
  type: 'smoothstep',
  animated: true,
  style: EDGE_BASE_STYLE,
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

const SIGNAL_LABEL_STYLE = { opacity: 0.9 }
const SIGNAL_VALUE_STYLE = { fontWeight: 700 }

const NODE_W = 168
const NODE_H = 76
const NODE_X_GAP = 120
const NODE_Y_GAP = 54
const nodeTypes = { unit: SmartUnitNode }
const edgeTypes = { pipe: SmartPipeEdge }

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

function computeAlarmFlag(decision) {
  if (!decision) return false
  const conf = typeof decision.confidence === 'number' ? decision.confidence : 0
  return conf >= 0.82 || /anomaly|alarm/i.test(String(decision.type || ''))
}

function shallowEqualBadgeState(a, b) {
  if (a === b) return true
  if (!a || !b) return false
  return a.ptText === b.ptText && a.alarm === b.alarm
}

const PtBadge = React.memo(function PtBadge() {
  const select = React.useCallback((state) => {
    const d = state.latestDecision
    const alarm = computeAlarmFlag(d)
    const ptText = formatSignalValue(findSignal(d, 'PT-101'))
    return { ptText, alarm }
  }, [])

  const { ptText, alarm } = useRealtimeSelector(select, shallowEqualBadgeState)

  return (
    <span style={SIGNAL_BADGE_STYLE}>
      <span style={alarm ? SIGNAL_DOT_ALARM_STYLE : SIGNAL_DOT_OK_STYLE} />
      <span style={SIGNAL_LABEL_STYLE}>PT-101</span>
      <span style={SIGNAL_VALUE_STYLE}>{ptText ?? '—'}</span>
    </span>
  )
})

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
  const transitionMs = getTransitionMs(uiConfig)

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
        title: u.type || 'Unit',
        subtitle: u.id,
        uiConfig,
        transitionMs,
      },
    }))
  }, [diagram, uiConfig, transitionMs])

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
          type: 'pipe',
        }
      })
      .filter(Boolean)
  }, [diagram])

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
        <PtBadge />
      </div>

      <div style={FLOW_WRAP_STYLE}>
        <ReactFlow
          key={`${diagram.id}-${uiConfig?.id || ''}`}
          defaultNodes={baseNodes}
          defaultEdges={baseEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
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
