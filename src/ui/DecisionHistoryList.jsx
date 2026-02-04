import React from 'react'
import { Badge } from './common/Badge.jsx'
import { FeatureGate } from '../features/FeatureGate.jsx'

function isStale(decision, runtimeConfig) {
  const freshnessSec = decision?.meta?.freshnessSec
  if (typeof freshnessSec !== 'number') return false
  const limit = runtimeConfig?.thresholds?.staleFreshnessSec
  if (typeof limit !== 'number') return false
  return freshnessSec > limit
}

function isLowConfidence(decision, runtimeConfig) {
  const c = decision?.confidence
  if (typeof c !== 'number') return false
  const limit = runtimeConfig?.thresholds?.lowConfidenceLt
  if (typeof limit !== 'number') return c < 0.5
  return c < limit
}

export function DecisionHistoryList({
  decisions,
  selectedId,
  onSelectId,
  runtimeConfig,
}) {
  if (!Array.isArray(decisions) || decisions.length === 0) {
    return (
      <div className="card">
        <div className="h2">Decision History</div>
        <div className="muted">No decisions yet.</div>
      </div>
    )
  }

  return (
    <div className="card stack">
      <div className="rowWrap">
        <div className="h2">Decision History</div>
        <div className="muted">({decisions.length})</div>
      </div>
      <div className="list">
        {decisions.map((d) => {
          const selected = d.id === selectedId
          const stale = isStale(d, runtimeConfig)
          const low = isLowConfidence(d, runtimeConfig)
          const hasSignals = Array.isArray(d.signals) && d.signals.length > 0

          return (
            <div
              key={d.id}
              className={selected ? 'listItem selected' : 'listItem'}
              onClick={() => onSelectId(d.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelectId(d.id)
              }}
            >
              <div className="rowWrap" style={{ justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{d.type}</div>
                  <div className="muted">
                    {d.meta?.unitId ?? 'unit-unknown'} •{' '}
                    {new Date(d.timestamp).toLocaleString()}
                  </div>
                </div>

                <div className="rowWrap">
                  {!hasSignals && <Badge tone="warn">NO SIGNALS</Badge>}
                  {stale && <Badge tone="warn">STALE</Badge>}
                  <FeatureGate name="aiConfidence">
                    {low ? (
                      <Badge tone="danger">LOW CONF</Badge>
                    ) : (
                      <Badge>CONF OK</Badge>
                    )}
                  </FeatureGate>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

