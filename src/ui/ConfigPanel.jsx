import React from 'react'
import { JsonView } from './common/JsonView.jsx'

export function ConfigPanel({
  clients,
  activeClientId,
  runtimeConfig,
  onSelectClientId,
  onSimulateClient,
  onToggleFeature,
}) {
  return (
    <div className="panel">
      <div className="stack">
        <div>
          <div className="h1">Client Config Panel</div>
          <div className="muted">
            Demo: switch client without forking UI code.
          </div>
        </div>

        <div className="card stack">
          <div className="rowWrap">
            <label className="muted" htmlFor="clientSelect">
              Active client
            </label>
            <select
              id="clientSelect"
              value={activeClientId}
              onChange={(e) => onSelectClientId(e.target.value)}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <button type="button" className="secondary" onClick={onSimulateClient}>
              Simulate client
            </button>
          </div>

          <div className="stack">
            <div className="h2">Features</div>

            <label className="row">
              <input
                type="checkbox"
                checked={!!runtimeConfig?.features?.decisionHistory}
                onChange={(e) =>
                  onToggleFeature('decisionHistory', e.target.checked)
                }
              />
              <span>decisionHistory</span>
            </label>

            <label className="row">
              <input
                type="checkbox"
                checked={!!runtimeConfig?.features?.aiConfidence}
                onChange={(e) =>
                  onToggleFeature('aiConfidence', e.target.checked)
                }
              />
              <span>aiConfidence</span>
            </label>
          </div>
        </div>

        <div className="card stack">
          <div className="h2">Runtime config (JSON)</div>
          <JsonView value={runtimeConfig} />
        </div>
      </div>
    </div>
  )
}

