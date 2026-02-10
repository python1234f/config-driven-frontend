function clamp01(v) {
  if (typeof v !== 'number' || Number.isNaN(v)) return 0
  return Math.max(0, Math.min(1, v))
}

function computeTrend(deltaPerTick) {
  if (typeof deltaPerTick !== 'number') return 'unknown'
  if (deltaPerTick > 0) return 'up'
  if (deltaPerTick < 0) return 'down'
  return 'flat'
}

function computeSignals(simulation, tickIndex) {
  return (simulation?.signals || []).map((s) => {
    const value =
      typeof s?.start === 'number' && typeof s?.deltaPerTick === 'number'
        ? s.start + s.deltaPerTick * tickIndex
        : undefined
    const trend = s?.trend ?? computeTrend(s?.deltaPerTick)
    return {
      name: s?.name ?? 'unknown',
      unit: s?.unit ?? '',
      value,
      trend,
    }
  })
}

function computeConfidence(simulation, tickIndex) {
  const conf = simulation?.decision?.confidence
  const start = typeof conf?.start === 'number' ? conf.start : 0
  const delta = typeof conf?.deltaPerTick === 'number' ? conf.deltaPerTick : 0
  const max = typeof conf?.max === 'number' ? conf.max : 1
  return clamp01(Math.min(max, start + delta * tickIndex))
}

function makeClientARaw(simulation, tickIndex, timestampIso, signals, confidence) {
  return {
    id: `${simulation.id}-t${String(tickIndex).padStart(3, '0')}`,
    kind: simulation?.decision?.type ?? 'UnknownDecision',
    confidence,
    ts: timestampIso,
    unitId: simulation?.decision?.meta?.unitId ?? 'unit-unknown',
    freshnessSec: 30,
    reason: simulation?.decision?.meta?.reason ?? 'n/a',
    signals: signals.map((s) => ({
      name: s.name,
      value: s.value,
      unit: s.unit,
      trend: s.trend,
    })),
  }
}

function makeClientBRaw(simulation, tickIndex, timestampMs, signals, confidence) {
  return {
    decisionId: `${simulation.id}-t${String(tickIndex).padStart(3, '0')}`,
    decisionType: simulation?.decision?.type ?? 'UnknownDecision',
    scorePct: Math.round(clamp01(confidence) * 100),
    timestampMs,
    asset: { id: simulation?.decision?.meta?.unitId ?? 'unit-unknown' },
    ageSec: 30,
    rationale: simulation?.decision?.meta?.reason ?? 'n/a',
    metrics: signals.map((s) => ({
      label: s.name,
      v: s.value,
      u: s.unit,
      dir: s.trend,
    })),
  }
}

function makeRawDecision(simulation, tickIndex, timestampMs) {
  const signals = computeSignals(simulation, tickIndex)
  const confidence = computeConfidence(simulation, tickIndex)
  const timestampIso = new Date(timestampMs).toISOString()
  const clientId = simulation?.clientConfig?.id

  const encodersByClientId = {
    clientA: () => makeClientARaw(simulation, tickIndex, timestampIso, signals, confidence),
    clientB: () => makeClientBRaw(simulation, tickIndex, timestampMs, signals, confidence),
  }

  const encoder = encodersByClientId[clientId]
  if (!encoder) {
    console.warn(
      '[SIMULATION]',
      'Unknown clientConfig.id for raw encoding:',
      clientId,
      'fallback to clientA raw shape',
    )
    return makeClientARaw(simulation, tickIndex, timestampIso, signals, confidence)
  }

  return encoder()
}

export function startSimulation(simulation, { onDecision } = {}) {
  if (!simulation?.id) throw new Error('simulation.id required')
  if (typeof simulation?.tickMs !== 'number') throw new Error('simulation.tickMs required')
  if (typeof simulation?.durationTicks !== 'number')
    throw new Error('simulation.durationTicks required')
  if (typeof onDecision !== 'function') throw new Error('onDecision callback required')

  const loop = simulation?.loop !== false
  const startTimestampMs =
    typeof simulation?.startTimestampMs === 'number'
      ? simulation.startTimestampMs
      : Date.now()

  if (typeof simulation?.startTimestampMs !== 'number') {
    console.warn(
      '[SIMULATION]',
      'startTimestampMs missing; using Date.now() (run is deterministic but not reproducible across runs)',
    )
  }

  console.log('[SIMULATION]', 'loaded config', simulation.id, simulation)

  let tickIndex = 0
  let intervalId = null

  function emitTick() {
    const timestampMs = startTimestampMs + tickIndex * simulation.tickMs
    const raw = makeRawDecision(simulation, tickIndex, timestampMs)

    console.log('[SIMULATION]', 'tick', { id: simulation.id, tickIndex, timestampMs })
    onDecision(raw, { tickIndex, timestampMs, simulationId: simulation.id })

    tickIndex += 1
    if (tickIndex >= simulation.durationTicks) {
      if (loop) {
        tickIndex = 0
      } else {
        stop()
      }
    }
  }

  intervalId = setInterval(emitTick, simulation.tickMs)
  emitTick()

  function stop() {
    if (intervalId) clearInterval(intervalId)
    intervalId = null
  }

  return { stop }
}

