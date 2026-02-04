import React from 'react'
import { FeatureGate } from '../features/FeatureGate.jsx'
import { DecisionHistoryList } from './DecisionHistoryList.jsx'
import { DecisionDetailsPanel } from './DecisionDetailsPanel.jsx'

export function DecisionInspector({ decisions, runtimeConfig }) {
  const [selectedId, setSelectedId] = React.useState(null)

  React.useEffect(() => {
    const nextId = decisions?.[0]?.id ?? null
    console.log('[DECISION]', 'DecisionInspector reset selection', nextId)
    setSelectedId(nextId)
  }, [decisions])

  const selected =
    Array.isArray(decisions) && selectedId
      ? decisions.find((d) => d.id === selectedId) ?? null
      : null

  return (
    <div className="stack">
      <div>
        <div className="h1">Decision Inspector</div>
        <div className="muted">
          UI consumes only <code>NormalizedDecision</code>.
        </div>
      </div>

      <FeatureGate
        name="decisionHistory"
        fallback={
          <div className="card">
            <div className="h2">Decision History</div>
            <div className="muted">
              Feature disabled by client capabilities (FeatureGate).
            </div>
          </div>
        }
      >
        <DecisionHistoryList
          decisions={decisions}
          selectedId={selectedId}
          onSelectId={setSelectedId}
          runtimeConfig={runtimeConfig}
        />
      </FeatureGate>

      <DecisionDetailsPanel decision={selected} />
    </div>
  )
}

