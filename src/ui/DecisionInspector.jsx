import React from 'react'
import { FeatureGate } from '../features/FeatureGate.jsx'
import { JsonView } from './common/JsonView.jsx'
import { useRealtimeStore } from './realtime/realtimeStore.js'

const CARD_STYLE = {
  background: '#0b1220',
  border: '1px solid rgba(148, 163, 184, 0.16)',
  borderRadius: 14,
  padding: 12,
}

const TITLE_STYLE = { color: '#e5e7eb' }
const MUTED_STYLE = { color: 'rgba(203, 213, 225, 0.75)' }

const TOP_ROW_STYLE = {
  justifyContent: 'space-between',
  alignItems: 'center',
}

const CONF_BADGE_BASE_STYLE = {
  display: 'inline-flex',
  alignItems: 'baseline',
  gap: 8,
  padding: '10px 14px',
  borderRadius: 999,
  border: '1px solid rgba(148, 163, 184, 0.22)',
  background: 'rgba(2, 6, 23, 0.62)',
  color: '#e5e7eb',
}

const CONF_BADGE_ALARM_STYLE = {
  ...CONF_BADGE_BASE_STYLE,
  border: '1px solid rgba(239, 68, 68, 0.38)',
  background: 'rgba(239, 68, 68, 0.12)',
}

const CONF_VALUE_STYLE = { fontSize: 18, fontWeight: 800, letterSpacing: '0.01em' }
const CONF_LABEL_STYLE = { fontSize: 12, opacity: 0.85, fontWeight: 700 }

const REASON_STYLE = {
  padding: 12,
  borderRadius: 12,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'rgba(2, 6, 23, 0.55)',
  color: 'rgba(226, 232, 240, 0.92)',
  lineHeight: 1.45,
}

const SUMMARY_STYLE = { cursor: 'pointer', color: '#e5e7eb' }
const DETAILS_STACK_STYLE = { marginTop: 10 }
const DETAILS_CARD_STYLE = { ...CARD_STYLE, padding: 12 }

function formatConfidence(confidence) {
  if (typeof confidence !== 'number' || Number.isNaN(confidence)) return '—'
  return `${Math.round(confidence * 100)}%`
}

function isAlarmish(latestDecision) {
  if (!latestDecision) return false
  const conf = typeof latestDecision.confidence === 'number' ? latestDecision.confidence : 0
  return conf >= 0.82 || /anomaly|alarm/i.test(String(latestDecision.type || ''))
}

export const DecisionInspector = React.memo(function DecisionInspector() {
  const latestDecision = useRealtimeStore((s) => s.latestDecision)
  const decisionHistory = useRealtimeStore((s) => s.decisionHistory)

  const [rawOpen, setRawOpen] = React.useState(false)
  const [historyOpen, setHistoryOpen] = React.useState(false)

  const onRawToggle = React.useCallback((e) => {
    setRawOpen(e.currentTarget.open)
  }, [])

  const onHistoryToggle = React.useCallback((e) => {
    setHistoryOpen(e.currentTarget.open)
  }, [])

  const alarm = isAlarmish(latestDecision)

  if (!latestDecision) {
    return (
      <div className="card stack" style={CARD_STYLE}>
        <div>
          <div className="h2" style={TITLE_STYLE}>
            Latest Insight
          </div>
          <div className="muted" style={MUTED_STYLE}>
            Waiting for first decision…
          </div>
        </div>
      </div>
    )
  }

  const timestamp =
    typeof latestDecision.timestamp === 'string'
      ? latestDecision.timestamp
      : new Date().toISOString()

  const reason = latestDecision?.meta?.reason || 'No reason provided.'
  const unitId = latestDecision?.meta?.unitId || 'unit-unknown'

  return (
    <div className="card stack" style={CARD_STYLE}>
      <div className="rowWrap" style={TOP_ROW_STYLE}>
        <div>
          <div className="h2" style={TITLE_STYLE}>
            Latest Insight
          </div>
          <div className="muted" style={MUTED_STYLE}>
            {latestDecision.type} • {unitId} • {new Date(timestamp).toLocaleString()}
          </div>
        </div>

        <FeatureGate
          name="aiConfidence"
          fallback={
            <span style={CONF_BADGE_BASE_STYLE}>
              <span style={CONF_VALUE_STYLE}>—</span>
              <span style={CONF_LABEL_STYLE}>CONF</span>
            </span>
          }
        >
          <span style={alarm ? CONF_BADGE_ALARM_STYLE : CONF_BADGE_BASE_STYLE}>
            <span style={CONF_VALUE_STYLE}>{formatConfidence(latestDecision.confidence)}</span>
            <span style={CONF_LABEL_STYLE}>CONF</span>
          </span>
        </FeatureGate>
      </div>

      <div style={REASON_STYLE}>{reason}</div>

      <details className="card" style={DETAILS_CARD_STYLE} onToggle={onRawToggle}>
        <summary className="h2" style={SUMMARY_STYLE}>
          Raw JSON
        </summary>
        <div className="stack" style={DETAILS_STACK_STYLE}>
          {rawOpen ? <JsonView value={latestDecision} /> : <div className="muted" style={MUTED_STYLE}>Open to view payload.</div>}
        </div>
      </details>

      <details className="card" style={DETAILS_CARD_STYLE} onToggle={onHistoryToggle}>
        <summary className="h2" style={SUMMARY_STYLE}>
          Recent history (limited)
        </summary>
        <div className="stack" style={DETAILS_STACK_STYLE}>
          {historyOpen ? (
            <JsonView value={Array.isArray(decisionHistory) ? decisionHistory : []} />
          ) : (
            <div className="muted" style={MUTED_STYLE}>
              Open to view history.
            </div>
          )}
        </div>
      </details>
    </div>
  )
})
