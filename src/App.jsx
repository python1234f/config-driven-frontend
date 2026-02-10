import React from 'react'
import { FeatureProvider } from './features/FeatureContext.jsx'
import { ConfigPanel } from './ui/ConfigPanel.jsx'
import { DecisionInspector } from './ui/DecisionInspector.jsx'
import { getClientConfig, getRandomClientId, listClients } from './config/index.js'
import pressureRiseSimulation from './examples/pressure-rise-simulation.json'
import pressureRiseUi from './examples/pressure-rise-ui.json'
import { startSimulation } from './simulations/engine.js'
import { validateSimulation } from './simulations/validate.js'
import { getSignalColor } from './presentation/uiStyle.js'

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
  const [activeClientId, setActiveClientId] = React.useState(clients[0]?.id)
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
  const [activeSimulationId, setActiveSimulationId] = React.useState(null)

  const baseConfig = React.useMemo(() => {
    const cfg = getClientConfig(activeClientId)
    console.log('[CONFIG]', 'baseConfig loaded', activeClientId, cfg)
    return cfg
  }, [activeClientId])

  const [runtimeConfig, setRuntimeConfig] = React.useState(() =>
    cloneClientConfig(baseConfig),
  )

  React.useEffect(() => {
    setRuntimeConfig(cloneClientConfig(baseConfig))
  }, [baseConfig])

  const [decisions, setDecisions] = React.useState([])
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
    console.log('[PRESENTATION]', 'uiConfig loaded', uiConfig?.id ?? null, uiConfig)
  }, [activeSimulation, uiConfig])

  React.useEffect(() => {
    if (!activeSimulation) return
    const simClientId = activeSimulation?.json?.clientConfig?.id
    if (typeof simClientId === 'string' && simClientId.length > 0) {
      console.log('[SIMULATION]', 'apply clientConfig.id ->', simClientId)
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

    setRuntimeConfig((prev) => {
      const next = cloneClientConfig(baseConfig)
      next.features = {
        ...(next?.features || {}),
        ...(sim?.clientConfig?.features || {}),
      }
      console.log('[SIMULATION]', 'applied clientConfig.features override', next.features)
      return next
    })
  }, [activeSimulation, baseConfig])

  React.useEffect(() => {
    if (activeSimulation) return
    setDiagram(null)
    const raw = runtimeConfig?.getMockRawDecisions?.() ?? []
    console.log('[DECISION]', 'raw decisions', raw)
    const normalized = raw.map((r) => runtimeConfig.adaptRawDecision(r, runtimeConfig))
    console.log('[DECISION]', 'normalized decisions', normalized)
    setDecisions(normalized)
  }, [activeSimulation, runtimeConfig])

  React.useEffect(() => {
    if (!activeSimulation) return
    if (typeof runtimeConfig?.adaptRawDecision !== 'function') return

    setDecisions([])

    const sim = activeSimulation.json

    const engine = startSimulation(sim, {
      onDecision: (raw) => {
        const normalized = runtimeConfig.adaptRawDecision(raw, runtimeConfig)
        console.log('[DECISION]', 'updated from simulation', normalized?.id, normalized)

        const pt = Array.isArray(normalized?.signals)
          ? normalized.signals.find((s) => s?.name === 'PT-101')
          : null
        if (pt && uiConfig) {
          const hex = getSignalColor({
            signalName: pt.name,
            value: pt.value,
            uiConfig,
          })
          console.log('[SIMULATION]', 'PT-101', {
            value: pt.value,
            unit: pt.unit,
            hex,
          })
        }

        setDecisions((prev) => [normalized, ...(prev || [])])
      },
    })

    return () => {
      engine.stop()
    }
  }, [activeSimulation, runtimeConfig, uiConfig])

  function onSimulateClient() {
    const nextId = getRandomClientId()
    console.log('[CONFIG]', 'Simulate client ->', nextId)
    setActiveSimulationId(null)
    setActiveClientId(nextId)
  }

  function onToggleFeature(featureName, enabled) {
    console.log('[FEATURES]', 'toggle feature', featureName, enabled)
    setRuntimeConfig((prev) => ({
      ...prev,
      features: {
        ...(prev?.features || {}),
        [featureName]: !!enabled,
      },
    }))
  }

  return (
    <FeatureProvider features={runtimeConfig?.features}>
      <div className="appShell">
        <ConfigPanel
          clients={clients}
          activeClientId={activeClientId}
          runtimeConfig={runtimeConfig}
          simulations={simulations}
          activeSimulationId={activeSimulationId}
          onSelectSimulationId={(id) => {
            console.log('[SIMULATION]', 'select simulation', id)
            setActiveSimulationId(id)
          }}
          onSelectClientId={setActiveClientId}
          onSimulateClient={onSimulateClient}
          onToggleFeature={onToggleFeature}
        />
        <main className="main">
          <DecisionInspector
            decisions={decisions}
            runtimeConfig={runtimeConfig}
            diagram={diagram}
            uiConfig={uiConfig}
          />
        </main>
      </div>
    </FeatureProvider>
  )
}
