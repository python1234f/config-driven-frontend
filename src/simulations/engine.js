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

function makeClientARaw(simulation, tickIndex, timestampIso, signals, confidence, decisionMeta) {
  return {
    id: `${simulation.id}-t${String(tickIndex).padStart(3, '0')}`,
    kind: simulation?.decision?.type ?? 'UnknownDecision',
    confidence,
    ts: timestampIso,
    unitId: decisionMeta?.unitId ?? simulation?.decision?.meta?.unitId ?? 'unit-unknown',
    sectionId: decisionMeta?.sectionId ?? simulation?.decision?.meta?.sectionId ?? null,
    freshnessSec: 30,
    reason: decisionMeta?.reason ?? simulation?.decision?.meta?.reason ?? 'n/a',
    signals: signals.map((s) => ({
      name: s.name,
      value: s.value,
      unit: s.unit,
      trend: s.trend,
    })),
  }
}

function makeClientBRaw(simulation, tickIndex, timestampMs, signals, confidence, decisionMeta) {
  return {
    decisionId: `${simulation.id}-t${String(tickIndex).padStart(3, '0')}`,
    decisionType: simulation?.decision?.type ?? 'UnknownDecision',
    scorePct: Math.round(clamp01(confidence) * 100),
    timestampMs,
    asset: {
      id: decisionMeta?.unitId ?? simulation?.decision?.meta?.unitId ?? 'unit-unknown',
      sectionId: decisionMeta?.sectionId ?? simulation?.decision?.meta?.sectionId ?? null,
    },
    ageSec: 30,
    rationale: decisionMeta?.reason ?? simulation?.decision?.meta?.reason ?? 'n/a',
    metrics: signals.map((s) => ({
      label: s.name,
      v: s.value,
      u: s.unit,
      dir: s.trend,
    })),
  }
}

function buildFaultContext(simulation) {
  const enabled = simulation?.fault?.enabled !== false
  const jumpEveryTicks = typeof simulation?.fault?.jumpEveryTicks === 'number' ? simulation.fault.jumpEveryTicks : 5
  const unitIndex = typeof simulation?.fault?.unitIndex === 'number' ? simulation.fault.unitIndex : 0
  const sectionPath = Array.isArray(simulation?.fault?.sectionPath) ? simulation.fault.sectionPath.filter(Boolean) : []

  const units = Array.isArray(simulation?.diagram?.units) ? simulation.diagram.units : []
  const unitIdsBySection = new Map()
  for (const u of units) {
    const sid = typeof u?.sectionId === 'string' ? u.sectionId : null
    const id = typeof u?.id === 'string' ? u.id : null
    if (!sid || !id) continue
    const list = unitIdsBySection.get(sid) || []
    list.push(id)
    unitIdsBySection.set(sid, list)
  }

  for (const [sid, list] of unitIdsBySection.entries()) {
    list.sort()
    unitIdsBySection.set(sid, list)
  }

  return { enabled, jumpEveryTicks, unitIndex, sectionPath, unitIdsBySection }
}

function resolveDecisionMeta(simulation, tickIndex, faultCtx) {
  const base = simulation?.decision?.meta || {}
  const fallback = {
    unitId: typeof base?.unitId === 'string' ? base.unitId : 'unit-unknown',
    sectionId: typeof base?.sectionId === 'string' ? base.sectionId : null,
    reason: typeof base?.reason === 'string' ? base.reason : 'n/a',
  }

  if (!faultCtx?.enabled) return fallback
  if (!faultCtx.sectionPath?.length) return fallback

  const step = faultCtx.jumpEveryTicks > 0 ? Math.floor(tickIndex / faultCtx.jumpEveryTicks) : tickIndex
  const activeSection = faultCtx.sectionPath[step % faultCtx.sectionPath.length]
  const ids = faultCtx.unitIdsBySection.get(activeSection) || []
  const idx = Math.max(0, Math.min(ids.length - 1, faultCtx.unitIndex || 0))
  const unitId = ids[idx] || fallback.unitId

  return {
    unitId,
    sectionId: activeSection,
    reason: `Chain reaction propagating through ${activeSection} (active unit: ${unitId}).`,
  }
}

function makeRawDecision(simulation, tickIndex, timestampMs, faultCtx) {
  const signals = computeSignals(simulation, tickIndex)
  const confidence = computeConfidence(simulation, tickIndex)
  const timestampIso = new Date(timestampMs).toISOString()
  const clientId = simulation?.clientConfig?.id
  const decisionMeta = resolveDecisionMeta(simulation, tickIndex, faultCtx)

  const encodersByClientId = {
    clientA: () => makeClientARaw(simulation, tickIndex, timestampIso, signals, confidence, decisionMeta),
    clientB: () => makeClientBRaw(simulation, tickIndex, timestampMs, signals, confidence, decisionMeta),
  }

  const encoder = encodersByClientId[clientId]
  if (!encoder) {
    console.warn(
      '[SIMULATION]',
      'Unknown clientConfig.id for raw encoding:',
      clientId,
      'fallback to clientA raw shape',
    )
    return makeClientARaw(simulation, tickIndex, timestampIso, signals, confidence, decisionMeta)
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

  let tickIndex = 0
  let intervalId = null
  const faultCtx = buildFaultContext(simulation)

  function emitTick() {
    const timestampMs = startTimestampMs + tickIndex * simulation.tickMs
    const raw = makeRawDecision(simulation, tickIndex, timestampMs, faultCtx)

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
