import React from 'react'
import { FeatureProvider } from './features/FeatureContext.jsx'
import { ConfigPanel } from './ui/ConfigPanel.jsx'
import { DecisionInspector } from './ui/DecisionInspector.jsx'
import { getClientConfig, getRandomClientId, listClients } from './config/index.js'

function deepClone(value) {
  try {
    return structuredClone(value)
  } catch (e) {
    return JSON.parse(JSON.stringify(value))
  }
}

export default function App() {
  const clients = React.useMemo(() => listClients(), [])
  const [activeClientId, setActiveClientId] = React.useState(clients[0]?.id)

  const baseConfig = React.useMemo(() => {
    const cfg = getClientConfig(activeClientId)
    console.log('[CONFIG]', 'baseConfig loaded', activeClientId, cfg)
    return cfg
  }, [activeClientId])

  const [runtimeConfig, setRuntimeConfig] = React.useState(() => deepClone(baseConfig))

  React.useEffect(() => {
    setRuntimeConfig(deepClone(baseConfig))
  }, [baseConfig])

  const [decisions, setDecisions] = React.useState([])

  React.useEffect(() => {
    const raw = runtimeConfig?.getMockRawDecisions?.() ?? []
    console.log('[DECISION]', 'raw decisions', raw)
    const normalized = raw.map((r) => runtimeConfig.adaptRawDecision(r, runtimeConfig))
    console.log('[DECISION]', 'normalized decisions', normalized)
    setDecisions(normalized)
  }, [runtimeConfig])

  function onSimulateClient() {
    const nextId = getRandomClientId()
    console.log('[CONFIG]', 'Simulate client ->', nextId)
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
          onSelectClientId={setActiveClientId}
          onSimulateClient={onSimulateClient}
          onToggleFeature={onToggleFeature}
        />
        <main className="main">
          <DecisionInspector decisions={decisions} runtimeConfig={runtimeConfig} />
        </main>
      </div>
    </FeatureProvider>
  )
}
