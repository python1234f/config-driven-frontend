import React from 'react'
import { FeatureProvider } from './features/FeatureContext.jsx'
import { FeatureGate } from './features/FeatureGate.jsx'
import { DecisionInspector } from './ui/DecisionInspector.jsx'
import { ProcessDiagram } from './ui/ProcessDiagram.jsx'
import { JsonView } from './ui/common/JsonView.jsx'
import { getClientConfig, getRandomClientId, listClients } from './config/index.js'
import pressureRiseSimulation from './examples/pressure-rise-simulation.json'
import pressureRiseUi from './examples/pressure-rise-ui.json'
import { startSimulation } from './simulations/engine.js'
import { validateSimulation } from './simulations/validate.js'
import {
  pushRealtimeDecision,
  resetRealtimeState,
  setRealtimeState,
} from './ui/realtime/realtimeStore.js'
import { RenderCounter } from './ui/debug/RenderCounter.jsx'

const DEFAULT_SIMULATION_ID = pressureRiseSimulation.id || 'pressure-rise'
const PT_HISTORY_LIMIT = 50
const DECISION_HISTORY_LIMIT = 12

const SHELL_STYLE = {
  minHeight: '100vh',
  padding: 16,
  color: '#e5e7eb',
  background: '#05070d',
  position: 'relative',
}

const DARK_CARD_STYLE = {
  background: '#0b1220',
  border: '1px solid rgba(148, 163, 184, 0.16)',
  borderRadius: 14,
  padding: 12,
}

const DARK_MUTED_STYLE = { color: 'rgba(203, 213, 225, 0.75)' }
const FALLBACK_CARD_STYLE = { ...DARK_CARD_STYLE, height: '100%' }

const SHOWCASE_GRID_STYLE = {
  display: 'grid',
  gap: 12,
  gridTemplateRows: 'minmax(420px, 70vh) auto',
  alignItems: 'stretch',
}

const STATUS_BAR_STYLE = {
  marginTop: 12,
  display: 'grid',
  gap: 10,
}

const SUMMARY_STYLE = { cursor: 'pointer', color: '#e5e7eb' }
const ROW_BETWEEN_STYLE = { justifyContent: 'space-between' }
const JSON_BLOCK_STYLE = { marginTop: 10 }

function cloneClientConfig(config) {
  if (!config || typeof config !== 'object') return config
  return {
    ...config,
    units: { ...(config.units || {}) },
    thresholds: { ...(config.thresholds || {}) },
    features: { ...(config.features || {}) },
    adaptRawDecision: config.adaptRawDecision,
    getMockRawDecisions: config.getMockRawDecisions,
  }
}

export default function App() {
  const clients = React.useMemo(() => listClients(), [])
  const initialClientId =
    pressureRiseSimulation?.clientConfig?.id || clients[0]?.id || null
  const [activeClientId, setActiveClientId] = React.useState(initialClientId)
  const simulations = React.useMemo(
    () => [
      {
        id: pressureRiseSimulation.id,
        label: pressureRiseSimulation.label,
        json: pressureRiseSimulation,
      },
    ],
    [],
  )
  const [activeSimulationId, setActiveSimulationId] = React.useState(
    DEFAULT_SIMULATION_ID,
  )

  const baseConfig = React.useMemo(() => {
    return getClientConfig(activeClientId)
  }, [activeClientId])

  const [runtimeConfig, setRuntimeConfig] = React.useState(() =>
    cloneClientConfig(baseConfig),
  )

  React.useEffect(() => {
    setRuntimeConfig(cloneClientConfig(baseConfig))
  }, [baseConfig])

  const [diagram, setDiagram] = React.useState(null)

  const activeSimulation = React.useMemo(() => {
    if (!activeSimulationId) return null
    return simulations.find((s) => s.id === activeSimulationId) ?? null
  }, [activeSimulationId, simulations])

  const uiConfig = React.useMemo(() => {
    if (!activeSimulation) return null
    if (activeSimulation.id === pressureRiseSimulation.id) return pressureRiseUi
    return null
  }, [activeSimulation])

  React.useEffect(() => {
    if (!activeSimulation) return
    const simClientId = activeSimulation?.json?.clientConfig?.id
    if (typeof simClientId === 'string' && simClientId.length > 0) {
      setActiveClientId(simClientId)
    }
  }, [activeSimulation])

  React.useEffect(() => {
    if (!activeSimulation) return
    const sim = activeSimulation.json
    const errors = validateSimulation(sim)
    if (errors.length) {
      console.warn('[SIMULATION]', 'invalid JSON simulation', sim?.id, errors)
    }

    setDiagram(sim?.diagram ?? null)
    resetRealtimeState()

    setRuntimeConfig((prev) => {
      const next = cloneClientConfig(baseConfig)
      next.features = {
        ...(next?.features || {}),
        ...(sim?.clientConfig?.features || {}),
      }
      return next
    })
  }, [activeSimulation, baseConfig])

  React.useEffect(() => {
    if (activeSimulation) return
    setDiagram(null)
    const raw = runtimeConfig?.getMockRawDecisions?.() ?? []
    const normalized = raw.map((r) => runtimeConfig.adaptRawDecision(r, runtimeConfig))
    const nextLatest = normalized[0] ?? null
    setRealtimeState({
      latestDecision: nextLatest,
      decisionHistory: normalized.slice(0, DECISION_HISTORY_LIMIT),
      ptHistory: [],
    })
  }, [activeSimulation, runtimeConfig])

  React.useEffect(() => {
    if (!activeSimulation) return
    if (typeof runtimeConfig?.adaptRawDecision !== 'function') return

    resetRealtimeState()

    const sim = activeSimulation.json

    const engine = startSimulation(sim, {
      onDecision: (raw, meta) => {
        const normalized = runtimeConfig.adaptRawDecision(raw, runtimeConfig)
        const pt = Array.isArray(normalized?.signals)
          ? normalized.signals.find((s) => s?.name === 'PT-101')
          : null

        pushRealtimeDecision({
          decision: normalized,
          ptValue: typeof pt?.value === 'number' ? pt.value : undefined,
          decisionHistoryLimit: DECISION_HISTORY_LIMIT,
          ptHistoryLimit: PT_HISTORY_LIMIT,
          resetHistory: meta?.tickIndex === 0,
        })
      },
    })

    return () => {
      engine.stop()
    }
  }, [activeSimulation, runtimeConfig, uiConfig])

  const onSimulateClient = React.useCallback(() => {
    const nextId = getRandomClientId()
    setActiveSimulationId(null)
    setActiveClientId(nextId)
  }, [])

  const onToggleFeature = React.useCallback((featureName, enabled) => {
    setRuntimeConfig((prev) => ({
      ...prev,
      features: {
        ...(prev?.features || {}),
        [featureName]: !!enabled,
      },
    }))
  }, [])

  const onSelectSimulationId = React.useCallback((id) => {
    setActiveSimulationId(id || null)
  }, [])

  const onSelectClientId = React.useCallback((id) => {
    setActiveClientId(id)
  }, [])

  const onClientSelectChange = React.useCallback(
    (e) => onSelectClientId(e.target.value),
    [onSelectClientId],
  )

  const onSimulationSelectChange = React.useCallback(
    (e) => onSelectSimulationId(e.target.value),
    [onSelectSimulationId],
  )

  return (
    <FeatureProvider features={runtimeConfig?.features}>
      <div style={SHELL_STYLE}>
        <RenderCounter name="App" mode="fixed" index={0} />
        <div style={SHOWCASE_GRID_STYLE}>
          <FeatureGate
            name="processDiagram"
            fallback={
              <div className="card stack" style={FALLBACK_CARD_STYLE}>
                <div>
                  <div className="h2">Process Diagram</div>
                  <div className="muted" style={DARK_MUTED_STYLE}>
                    Feature disabled by client capabilities.
                  </div>
                </div>
              </div>
            }
          >
            <ProcessDiagram diagram={diagram} uiConfig={uiConfig} />
          </FeatureGate>
          <DecisionInspector />
        </div>

        <div style={STATUS_BAR_STYLE}>
          <div className="card stack" style={DARK_CARD_STYLE}>
            <div className="rowWrap" style={ROW_BETWEEN_STYLE}>
              <div>
                <div className="h2">Controls</div>
                <div className="muted" style={DARK_MUTED_STYLE}>
                  Premium showcase mode • simulation runs on load
                </div>
              </div>
              <div className="rowWrap">
                <button type="button" className="secondary" onClick={onSimulateClient}>
                  Simulate client
                </button>
              </div>
            </div>

            <div className="rowWrap">
              <label className="muted" htmlFor="clientSelect">
                Client
              </label>
              <select id="clientSelect" value={activeClientId || ''} onChange={onClientSelectChange}>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>

              <label className="muted" htmlFor="simSelect">
                Simulation
              </label>
              <select id="simSelect" value={activeSimulationId || ''} onChange={onSimulationSelectChange}>
                <option value="">(none)</option>
                {(simulations || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label || s.id}
                  </option>
                ))}
              </select>
            </div>

            <div className="rowWrap">
              <label className="row">
                <input
                  type="checkbox"
                  checked={!!runtimeConfig?.features?.processDiagram}
                  onChange={(e) => onToggleFeature('processDiagram', e.target.checked)}
                />
                <span>processDiagram</span>
              </label>
              <label className="row">
                <input
                  type="checkbox"
                  checked={!!runtimeConfig?.features?.aiConfidence}
                  onChange={(e) => onToggleFeature('aiConfidence', e.target.checked)}
                />
                <span>aiConfidence</span>
              </label>
              <label className="row">
                <input
                  type="checkbox"
                  checked={!!runtimeConfig?.features?.decisionHistory}
                  onChange={(e) => onToggleFeature('decisionHistory', e.target.checked)}
                />
                <span>decisionHistory</span>
              </label>
            </div>
          </div>

          <details className="card" style={DARK_CARD_STYLE}>
            <summary className="h2" style={SUMMARY_STYLE}>
              JSON (diagnostics)
            </summary>
            <div className="stack" style={JSON_BLOCK_STYLE}>
              <details className="card" style={DARK_CARD_STYLE}>
                <summary className="h2" style={SUMMARY_STYLE}>
                  Runtime config
                </summary>
                <div style={JSON_BLOCK_STYLE}>
                  <JsonView value={runtimeConfig} />
                </div>
              </details>
              <details className="card" style={DARK_CARD_STYLE}>
                <summary className="h2" style={SUMMARY_STYLE}>
                  Active simulation JSON
                </summary>
                <div style={JSON_BLOCK_STYLE}>
                  <JsonView value={activeSimulation?.json || null} />
                </div>
              </details>
              <details className="card" style={DARK_CARD_STYLE}>
                <summary className="h2" style={SUMMARY_STYLE}>
                  UI config JSON
                </summary>
                <div style={JSON_BLOCK_STYLE}>
                  <JsonView value={uiConfig} />
                </div>
              </details>
            </div>
          </details>
        </div>
      </div>
    </FeatureProvider>
  )
}
