import React from 'react'
import { ReactFlow, Background, Controls, Position } from '@xyflow/react'
import { getTransitionMs } from '../presentation/uiStyle.js'
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
const EDGE_ALARM_STYLE = { stroke: '#ef4444', strokeWidth: 3 }
const BASE_MARKER_ID = 'pipe-arrow-base'
const ALARM_MARKER_ID = 'pipe-arrow-alarm'
const MIN_ZOOM = 1 / 6
const INTRO_TICK_MS_DEFAULT = 70
const INTRO_TICK_MS_MIN = 30
const INTRO_FIT_PADDING = 0.32
const SVG_DEFS_STYLE = {
  position: 'absolute',
  width: 0,
  height: 0,
  pointerEvents: 'none',
}

const DEFAULT_EDGE_OPTIONS = {
  type: 'smoothstep',
  animated: false,
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
const edgeTypes = { bus: SmartPipeEdge }

function computeAlarmFlag(decision) {
  if (!decision) return false
  const conf = typeof decision.confidence === 'number' ? decision.confidence : 0
  return conf >= 0.82 || /anomaly|alarm/i.test(String(decision.type || ''))
}

function shallowEqualBadgeState(a, b) {
  if (a === b) return true
  if (!a || !b) return false
  return a.label === b.label && a.alarm === b.alarm
}

const PtBadge = React.memo(function PtBadge() {
  const select = React.useCallback((state) => {
    const d = state.latestDecision
    const alarm = computeAlarmFlag(d)
    const sectionId = d?.meta?.sectionId ?? null
    const unitId = d?.meta?.unitId ?? null
    const label = sectionId
      ? `ALARM ${sectionId}${unitId ? ` • ${unitId}` : ''}`
      : 'ALARM —'
    return { label, alarm }
  }, [])

  const { label, alarm } = useRealtimeSelector(select, shallowEqualBadgeState)

  return (
    <span style={SIGNAL_BADGE_STYLE}>
      <span style={alarm ? SIGNAL_DOT_ALARM_STYLE : SIGNAL_DOT_OK_STYLE} />
      <span style={SIGNAL_LABEL_STYLE}>STATUS</span>
      <span style={SIGNAL_VALUE_STYLE}>{label}</span>
    </span>
  )
})

function buildLayoutFromUnits(units) {
  return units.map((u) => ({
    id: u.id,
    type: u.type || 'Unit',
    x: typeof u.x === 'number' ? u.x : null,
    y: typeof u.y === 'number' ? u.y : null,
    sectionId: typeof u.sectionId === 'string' ? u.sectionId : null,
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
        pa.length
          ? pa.reduce((acc, p) => acc + (orderById.get(p) ?? 0), 0) / pa.length
          : 0
      const bb =
        pb.length
          ? pb.reduce((acc, p) => acc + (orderById.get(p) ?? 0), 0) / pb.length
          : 0
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

function buildIntroTimeline(diagram) {
  const units = Array.isArray(diagram?.units) ? diagram.units : []
  const connections = Array.isArray(diagram?.connections) ? diagram.connections : []

  const events = []

  for (let i = 0; i < units.length; i += 1) {
    events.push({
      type: 'node.add',
      jsonPath: `$.diagram.units[${i}]`,
      targetId: units[i]?.id || `unit-${i}`,
    })
  }

  for (let i = 0; i < connections.length; i += 1) {
    const c = connections[i]
    events.push({
      type: 'edge.add',
      jsonPath: `$.diagram.connections[${i}]`,
      targetId: `${c?.from || 'x'}->${c?.to || 'y'}-${i}`,
    })
  }

  return events
}

function stringifyPrimitive(value) {
  if (typeof value === 'undefined') return 'null'
  return JSON.stringify(value)
}

function buildJsonLinesModel(value) {
  const lines = []

  function pushLine(text, path = null) {
    lines.push({ text, path })
  }

  function addCommaToLastLine() {
    if (!lines.length) return
    lines[lines.length - 1].text += ','
  }

  function render(currentValue, path, indent, keyLabel = null) {
    const pad = ' '.repeat(indent)
    const keyPrefix =
      keyLabel == null ? '' : `${JSON.stringify(String(keyLabel))}: `

    if (currentValue === null || typeof currentValue !== 'object') {
      pushLine(`${pad}${keyPrefix}${stringifyPrimitive(currentValue)}`, path)
      return
    }

    if (Array.isArray(currentValue)) {
      pushLine(`${pad}${keyPrefix}[`, path)
      for (let i = 0; i < currentValue.length; i += 1) {
        render(currentValue[i], `${path}[${i}]`, indent + 2)
        if (i < currentValue.length - 1) addCommaToLastLine()
      }
      pushLine(`${pad}]`)
      return
    }

    const entries = Object.entries(currentValue)
    pushLine(`${pad}${keyPrefix}{`, path)
    for (let i = 0; i < entries.length; i += 1) {
      const [key, nextValue] = entries[i]
      render(nextValue, `${path}.${key}`, indent + 2, key)
      if (i < entries.length - 1) addCommaToLastLine()
    }
    pushLine(`${pad}}`)
  }

  render(value, '$', 0)
  return { lines }
}

export const ProcessDiagram = React.memo(function ProcessDiagram({
  diagram,
  uiConfig,
  simulationJson,
}) {
  const transitionMs = getTransitionMs(uiConfig)

  const introConfig = simulationJson?.intro
  const showcaseIntroEnabled = !!introConfig && introConfig.enabled !== false

  const introTickMsRaw = introConfig?.speedMs
  const introTickMs =
    typeof introTickMsRaw === 'number' && Number.isFinite(introTickMsRaw)
      ? Math.max(INTRO_TICK_MS_MIN, introTickMsRaw)
      : INTRO_TICK_MS_DEFAULT

  const baseNodes = React.useMemo(() => {
    if (!diagram?.units?.length) return []
    const units = buildLayoutFromUnits(diagram.units)
    const useAbsolute = diagram?.layout === 'absolute'
    const positions =
      useAbsolute &&
      units.every((u) => typeof u.x === 'number' && typeof u.y === 'number')
        ? null
        : computeLayeredLayout({
            units,
            connections: diagram.connections || [],
          })

    return units.map((u) => ({
      id: u.id,
      type: 'unit',
      position: positions
        ? positions.get(u.id) || { x: 40, y: 40 }
        : { x: u.x, y: u.y },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      draggable: false,
      selectable: false,
      data: {
        title: u.type || 'Unit',
        subtitle: u.id,
        uiConfig,
        transitionMs,
        sectionId: u.sectionId,
      },
    }))
  }, [diagram, uiConfig, transitionMs])

  const baseEdges = React.useMemo(() => {
    if (!diagram?.connections?.length) return []
    const sectionByUnitId = new Map(
      (diagram.units || [])
        .filter((u) => typeof u?.id === 'string')
        .map((u) => [u.id, typeof u.sectionId === 'string' ? u.sectionId : null]),
    )

    const edges = []
    for (let idx = 0; idx < diagram.connections.length; idx += 1) {
      const c = diagram.connections[idx]
      if (!c?.from || !c?.to) continue
      const kind = c?.kind === 'bus' ? 'bus' : 'internal'
      const fromSection = sectionByUnitId.get(c.from) ?? null
      const toSection = sectionByUnitId.get(c.to) ?? null

      edges.push({
        id: `${c.from}->${c.to}-${idx}`,
        source: c.from,
        target: c.to,
        animated: kind === 'bus',
        type: kind === 'bus' ? 'bus' : 'smoothstep',
        data: {
          kind,
          sourceSection: fromSection,
          targetSection: toSection,
        },
      })
    }

    return edges
  }, [diagram])

  const introTimeline = React.useMemo(() => {
    if (!showcaseIntroEnabled) return []
    return buildIntroTimeline(diagram)
  }, [showcaseIntroEnabled, diagram])

  const [introState, setIntroState] = React.useState(() => ({
    nodeCount: 0,
    edgeCount: 0,
    activePath: null,
    eventIndex: -1,
  }))
  const reactFlowRef = React.useRef(null)
  const [flowReady, setFlowReady] = React.useState(false)

  const onFlowInit = React.useCallback((instance) => {
    reactFlowRef.current = instance
    setFlowReady(true)
  }, [])

  React.useEffect(() => {
    if (!showcaseIntroEnabled || introTimeline.length === 0) {
      setIntroState({
        nodeCount: baseNodes.length,
        edgeCount: baseEdges.length,
        activePath: null,
        eventIndex: -1,
      })
      return
    }

    setIntroState({
      nodeCount: 0,
      edgeCount: 0,
      activePath: null,
      eventIndex: -1,
    })

    let nextEventIndex = -1
    const timer = setInterval(() => {
      nextEventIndex += 1
      const event = introTimeline[nextEventIndex]
      if (!event) {
        clearInterval(timer)
        return
      }

      setIntroState((prev) => ({
        nodeCount: prev.nodeCount + (event.type === 'node.add' ? 1 : 0),
        edgeCount: prev.edgeCount + (event.type === 'edge.add' ? 1 : 0),
        activePath: event.jsonPath,
        eventIndex: nextEventIndex,
      }))

      if (nextEventIndex >= introTimeline.length - 1) {
        clearInterval(timer)
      }
    }, introTickMs)

    return () => clearInterval(timer)
  }, [
    showcaseIntroEnabled,
    introTimeline,
    introTickMs,
    baseNodes.length,
    baseEdges.length,
  ])

  const visibleNodes = React.useMemo(() => {
    if (!showcaseIntroEnabled) return baseNodes
    const count = Math.max(0, Math.min(baseNodes.length, introState.nodeCount))
    return baseNodes.slice(0, count)
  }, [showcaseIntroEnabled, baseNodes, introState.nodeCount])

  const visibleEdges = React.useMemo(() => {
    if (!showcaseIntroEnabled) return baseEdges
    const count = Math.max(0, Math.min(baseEdges.length, introState.edgeCount))
    return baseEdges.slice(0, count)
  }, [showcaseIntroEnabled, baseEdges, introState.edgeCount])

  const jsonLines = React.useMemo(() => {
    if (!showcaseIntroEnabled) return []
    const model = buildJsonLinesModel(simulationJson || {})
    return model.lines
  }, [showcaseIntroEnabled, simulationJson])

  const jsonLineRefs = React.useRef(new Map())
  const jsonViewportRef = React.useRef(null)

  React.useEffect(() => {
    if (!showcaseIntroEnabled) return
    if (!introState.activePath) return

    const viewportEl = jsonViewportRef.current
    const targetLine = jsonLineRefs.current.get(introState.activePath)
    if (!viewportEl || !targetLine) return

    const viewportRect = viewportEl.getBoundingClientRect()
    const lineRect = targetLine.getBoundingClientRect()
    const deltaTop = lineRect.top - viewportRect.top
    const desiredTop =
      viewportEl.scrollTop +
      deltaTop -
      (viewportEl.clientHeight / 2 - targetLine.clientHeight / 2)

    const maxTop = Math.max(0, viewportEl.scrollHeight - viewportEl.clientHeight)
    const clampedTop = Math.max(0, Math.min(maxTop, desiredTop))

    viewportEl.scrollTo({ top: clampedTop, behavior: 'smooth' })
  }, [showcaseIntroEnabled, introState.activePath, introState.eventIndex])

  React.useEffect(() => {
    if (!showcaseIntroEnabled) return
    if (!flowReady) return
    if (!visibleNodes.length) return

    const instance = reactFlowRef.current
    if (!instance || typeof instance.fitView !== 'function') return

    const viewport = instance.getViewport?.()
    const fitOptions = {
      padding: INTRO_FIT_PADDING,
      duration: Math.max(140, Math.round(introTickMs * 1.6)),
      includeHiddenNodes: false,
    }

    if (typeof viewport?.zoom === 'number') {
      fitOptions.maxZoom = viewport.zoom
    }

    const frame = requestAnimationFrame(() => {
      instance.fitView(fitOptions)
    })

    return () => cancelAnimationFrame(frame)
  }, [
    showcaseIntroEnabled,
    flowReady,
    introTickMs,
    visibleNodes.length,
    visibleEdges.length,
    introState.eventIndex,
  ])

  const introProgressText = React.useMemo(() => {
    if (!showcaseIntroEnabled || introTimeline.length === 0) return null
    const current = Math.min(introState.eventIndex + 1, introTimeline.length)
    return `${current}/${introTimeline.length}`
  }, [showcaseIntroEnabled, introTimeline.length, introState.eventIndex])

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

  const flowCanvas = (
    <div style={FLOW_WRAP_STYLE}>
      <ReactFlow
        key={`${diagram.id}-${uiConfig?.id || ''}`}
        nodes={visibleNodes}
        edges={visibleEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        minZoom={MIN_ZOOM}
        style={FLOW_STYLE}
        onInit={onFlowInit}
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
  )

  return (
    <div className="card" style={CARD_STYLE}>
      <svg
        aria-hidden="true"
        focusable="false"
        width="0"
        height="0"
        style={SVG_DEFS_STYLE}
      >
        <defs>
          <marker
            id={BASE_MARKER_ID}
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={EDGE_BASE_STYLE.stroke} />
          </marker>
          <marker
            id={ALARM_MARKER_ID}
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={EDGE_ALARM_STYLE.stroke} />
          </marker>
        </defs>
      </svg>
      <RenderCounter name="Diagram" mode="fixed" index={1} />
      <div className="rowWrap" style={HEADER_ROW_STYLE}>
        <div>
          <div className="h2" style={TITLE_STYLE}>
            Process Diagram
          </div>
          <div className="muted" style={MUTED_STYLE}>
            {diagram.id}
            {showcaseIntroEnabled && introProgressText
              ? ` • intro ${introProgressText}`
              : ''}
          </div>
        </div>
        <PtBadge />
      </div>

      {showcaseIntroEnabled ? (
        <div className="processIntroSplit">
          {flowCanvas}

          <aside className="introJsonPanel" aria-live="polite">
            <div className="rowWrap" style={HEADER_ROW_STYLE}>
              <div>
                <div className="h2" style={TITLE_STYLE}>
                  JSON Sequence
                </div>
                <div className="muted" style={MUTED_STYLE}>
                  Synchronized highlight and auto-focus
                </div>
              </div>
              {introProgressText ? (
                <span className="introJsonProgress">step {introProgressText}</span>
              ) : null}
            </div>
            <div ref={jsonViewportRef} className="introJsonViewport">
              <pre className="introJsonPre">
                <code>
                  {jsonLines.map((line, index) => {
                    const isActive = line.path === introState.activePath
                    const lineKey = `${index}-${line.path || 'none'}-${
                      isActive ? introState.eventIndex : 'idle'
                    }`
                    return (
                      <span
                        key={lineKey}
                        ref={(el) => {
                          if (!line.path) return
                          if (el) jsonLineRefs.current.set(line.path, el)
                          else jsonLineRefs.current.delete(line.path)
                        }}
                        className={isActive ? 'introJsonLine active' : 'introJsonLine'}
                      >
                        {line.text}
                        {'\n'}
                      </span>
                    )
                  })}
                </code>
              </pre>
            </div>
          </aside>
        </div>
      ) : (
        flowCanvas
      )}
    </div>
  )
})
