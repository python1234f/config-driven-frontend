export function validateSimulation(simulation) {
  const errors = []

  if (!simulation || typeof simulation !== 'object') {
    return ['Simulation must be an object']
  }

  if (typeof simulation.id !== 'string' || simulation.id.length === 0) {
    errors.push('id: required string')
  }

  if (typeof simulation.tickMs !== 'number' || simulation.tickMs < 200) {
    errors.push('tickMs: number >= 200 required')
  }

  if (typeof simulation.durationTicks !== 'number' || simulation.durationTicks < 1) {
    errors.push('durationTicks: number >= 1 required')
  }

  if (simulation.intro != null) {
    if (!simulation.intro || typeof simulation.intro !== 'object') {
      errors.push('intro: object expected when provided')
    } else {
      if (
        simulation.intro.enabled != null &&
        typeof simulation.intro.enabled !== 'boolean'
      ) {
        errors.push('intro.enabled: boolean expected')
      }
      if (
        simulation.intro.speedMs != null &&
        (typeof simulation.intro.speedMs !== 'number' ||
          simulation.intro.speedMs < 30)
      ) {
        errors.push('intro.speedMs: number >= 30 expected')
      }
    }
  }

  if (!simulation.clientConfig || typeof simulation.clientConfig !== 'object') {
    errors.push('clientConfig: required object')
  } else {
    if (typeof simulation.clientConfig.id !== 'string' || simulation.clientConfig.id.length === 0) {
      errors.push('clientConfig.id: required string')
    }
    if (!simulation.clientConfig.features || typeof simulation.clientConfig.features !== 'object') {
      errors.push('clientConfig.features: required object')
    }
  }

  if (!Array.isArray(simulation.signals)) errors.push('signals: required array')
  if (!simulation.decision || typeof simulation.decision !== 'object') errors.push('decision: required object')

  return errors
}
