import React from 'react'
import {
  getSignalColor,
  getSignalColorDebug,
  getTransitionMs,
  getUnitFillColor,
  getReadableTextStyle,
  hexToRgba,
} from '../presentation/uiStyle.js'

function formatSignalValue(signal) {
  if (!signal) return 'n/a'
  const value = typeof signal.value === 'number' ? signal.value.toFixed(2) : 'n/a'
  const unit = signal.unit ? ` ${signal.unit}` : ''
  return `${value}${unit}`
}

function findSignal(latestDecision, signalName) {
  const signals = Array.isArray(latestDecision?.signals) ? latestDecision.signals : []
  return signals.find((s) => s?.name === signalName) ?? null
}

export function ProcessDiagram({ diagram, latestDecision, uiConfig }) {
  const signals = Array.isArray(latestDecision?.signals) ? latestDecision.signals : []
  const activeUnitId = latestDecision?.meta?.unitId ?? null
  const unitIds = React.useMemo(
    () => new Set((diagram?.units || []).map((u) => u.id)),
    [diagram],
  )
  const canHighlight = !!activeUnitId && unitIds.has(activeUnitId)
  const transitionMs = getTransitionMs(uiConfig)
  const colorDebugCounterRef = React.useRef(0)

  React.useEffect(() => {
    if (!diagram) return
    console.log('[DIAGRAM]', 'rendered', diagram.id, {
      units: diagram?.units?.length ?? 0,
      connections: diagram?.connections?.length ?? 0,
      signals: signals.length,
      activeUnitId,
      highlight: canHighlight,
    })
  }, [diagram, signals.length, activeUnitId, canHighlight])

  React.useEffect(() => {
    if (!uiConfig) return
    if (!latestDecision) return
    const pt = signals.find((s) => s?.name === 'PT-101')
    if (!pt) return
    const hex = getSignalColor({ signalName: pt.name, value: pt.value, uiConfig })
    colorDebugCounterRef.current += 1
    console.log('[PRESENTATION]', 'PT-101 -> hex', { value: pt.value, hex })
  }, [uiConfig, latestDecision, signals])

  if (!diagram) {
    return (
      <div className="card">
        <div className="h2">Process Diagram</div>
        <div className="muted">No diagram loaded.</div>
      </div>
    )
  }

  const width = 420
  const height = 220

  const unitById = Object.fromEntries((diagram.units || []).map((u) => [u.id, u]))

  return (
    <div className="card stack">
      <div className="rowWrap" style={{ justifyContent: 'space-between' }}>
        <div>
          <div className="h2">Process Diagram</div>
          <div className="muted">{diagram.id}</div>
        </div>
        <div className="muted">
          Driven by simulation JSON • updates every tick
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        style={{
          background: '#f6f7fb',
          borderRadius: 10,
          border: '1px solid #e6e8f0',
          filter: 'none',
        }}
      >
        {(diagram.connections || []).map((c, idx) => {
          const from = unitById[c.from]
          const to = unitById[c.to]
          if (!from || !to) return null
          const x1 = from.x + 60
          const y1 = from.y + 20
          const x2 = to.x
          const y2 = to.y + 20
          return (
            <line
              key={`${c.from}-${c.to}-${idx}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#55607a"
              strokeWidth="2"
              markerEnd="url(#arrow)"
            />
          )
        })}

        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#55607a" />
          </marker>
        </defs>

        {(diagram.units || []).map((u) => (
          <g key={u.id} transform={`translate(${u.x}, ${u.y})`}>
            {(() => {
              const fillHex = getUnitFillColor({
                unitId: u.id,
                latestDecision,
                uiConfig,
              })
              const fill = fillHex ?? '#ffffff'
              const stroke =
                fillHex ??
                (canHighlight && u.id === activeUnitId ? '#0b1220' : '#d6d9e6')
              const strokeWidth = fillHex ? 2 : canHighlight && u.id === activeUnitId ? 2 : 1

              return (
                <rect
                  x="0"
                  y="0"
                  width="120"
                  height="44"
                  rx="8"
                  style={{
                    fill,
                    stroke,
                    strokeWidth,
                    transition:
                      transitionMs > 0
                        ? `fill ${transitionMs}ms linear, stroke ${transitionMs}ms linear`
                        : undefined,
                  }}
                />
              )
            })()}
            {(() => {
              const fillHex = getUnitFillColor({
                unitId: u.id,
                latestDecision,
                uiConfig,
              })
              return <title>{fillHex ? `uiFill=${fillHex}` : 'uiFill=n/a'}</title>
            })()}
            <text x="10" y="16" fontSize="12" fill="#0b1220">
              {u.type}
            </text>
            <text x="10" y="30" fontSize="11" fill="#55607a">
              {u.id}
            </text>
            {(() => {
              const fillCfg = uiConfig?.units?.[u.id]?.fill
              const fromSignal = fillCfg?.fromSignal
              const s =
                typeof fromSignal === 'string' ? findSignal(latestDecision, fromSignal) : null
              const fillHex = getUnitFillColor({
                unitId: u.id,
                latestDecision,
                uiConfig,
              })
              if (!fillHex && !s) return null
              const { fill: textFill, stroke: textStroke } = getReadableTextStyle(
                fillHex || '#ffffff',
              )
              return (
                <text
                  x="10"
                  y="41"
                  fontSize="9"
                  fill={textFill}
                  stroke={textStroke}
                  strokeWidth="2"
                  paintOrder="stroke"
                  style={{ opacity: 0.98 }}
                >
                  {fromSignal && s
                    ? `${fromSignal}: ${formatSignalValue(s)}`
                    : fillHex
                      ? fillHex
                      : ''}
                </text>
              )
            })()}
          </g>
        ))}
      </svg>

      <div className="stack">
        <div className="h2">Live signals (from latest decision)</div>
        {signals.length === 0 ? (
          <div className="muted">No signals provided.</div>
        ) : (
          <div className="rowWrap">
            {signals.map((s, idx) => {
              const hex = getSignalColor({ signalName: s.name, value: s.value, uiConfig })
              const debug = getSignalColorDebug({
                signalName: s.name,
                value: s.value,
                uiConfig,
              })
              const style = hex
                ? {
                    backgroundColor: hexToRgba(hex, 0.18) || undefined,
                    borderColor: hex,
                    borderWidth: 2,
                    borderStyle: 'solid',
                    filter: 'none',
                    transition:
                      transitionMs > 0
                        ? `background-color ${transitionMs}ms linear, border-color ${transitionMs}ms linear`
                        : undefined,
                  }
                : undefined
              return (
                <span
                  key={`${s.name}-${idx}`}
                  className="badge"
                  style={style}
                  title={hex ? `uiColor=${hex}` : 'uiColor=n/a'}
                >
                  {hex ? (
                    <span
                      aria-hidden="true"
                      style={{
                        display: 'inline-block',
                        width: 18,
                        height: 18,
                        borderRadius: 5,
                        backgroundColor: hex,
                        border: '1px solid rgba(0,0,0,0.35)',
                        marginRight: 6,
                        filter: 'none',
                      }}
                    />
                  ) : null}
                  <span style={{ display: 'inline-grid', lineHeight: 1.15 }}>
                    <span>
                      <strong>{s.name}</strong>: {formatSignalValue(s)}
                    </span>
                    <span className="muted" style={{ fontSize: 11 }}>
                      trend: {s.trend ?? 'unknown'} • hex: {hex ?? 'n/a'}
                      {debug
                        ? ` • t=${debug.t.toFixed(2)} • range=${debug.min}-${debug.max}`
                        : ''}
                    </span>
                  </span>
                </span>
              )
            })}
          </div>
        )}

        {!!activeUnitId && !canHighlight && (
          <div className="muted">
            Note: meta.unitId <code>{activeUnitId}</code> does not match any diagram unit id.
          </div>
        )}
      </div>
    </div>
  )
}
