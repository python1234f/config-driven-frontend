import React from 'react'
import { Badge } from './common/Badge.jsx'
import { JsonView } from './common/JsonView.jsx'
import { FeatureGate } from '../features/FeatureGate.jsx'

function formatConfidence(v) {
  if (typeof v !== 'number') return 'n/a'
  return `${Math.round(v * 100)}%`
}

export function DecisionDetailsPanel({ decision }) {
  if (!decision) {
    return (
      <div className="card">
        <div className="h2">Decision Details</div>
        <div className="muted">Select a decision to inspect details.</div>
      </div>
    )
  }

  const hasSignals = Array.isArray(decision.signals) && decision.signals.length > 0

  return (
    <div className="card stack">
      <div className="rowWrap" style={{ justifyContent: 'space-between' }}>
        <div>
          <div className="h2">Decision Details</div>
          <div className="muted">
            {decision.id} • {decision.meta?.clientId}
          </div>
        </div>
        <FeatureGate name="aiConfidence">
          <Badge>{formatConfidence(decision.confidence)}</Badge>
        </FeatureGate>
      </div>

      <div className="stack">
        <div className="rowWrap">
          <Badge>TYPE: {decision.type}</Badge>
          <Badge>UNIT: {decision.meta?.unitId ?? 'unit-unknown'}</Badge>
          {typeof decision.meta?.freshnessSec === 'number' && (
            <Badge>freshness: {decision.meta.freshnessSec}s</Badge>
          )}
        </div>

        <div>
          <div className="h2">Signals</div>
          {!hasSignals ? (
            <div className="muted">No signals provided.</div>
          ) : (
            <div className="list">
              {decision.signals.map((s, idx) => (
                <div key={`${s.name}-${idx}`} className="listItem">
                  <div className="rowWrap" style={{ justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                    <div className="muted">{s.trend}</div>
                  </div>
                  <div className="muted">
                    {typeof s.value === 'number' ? s.value : 'n/a'} {s.unit ?? ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="h2">Raw normalizedDecision (JSON)</div>
          <JsonView value={decision} />
        </div>
      </div>
    </div>
  )
}

