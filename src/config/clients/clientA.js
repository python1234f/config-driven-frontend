import { adaptRawDecisionClientA } from '../../adapters/clientA/adaptRawDecision.js'
import { getMockRawDecisionsClientA } from '../../mock/rawDecisions.clientA.js'

/** @type {import('../../domain/clientConfig.js').ClientConfig} */
export const clientA = {
  id: 'clientA',
  label: 'Client A (Refinery Alpha)',
  units: { pressure: 'bar', temperature: 'C', flow: 'kg/s' },
  alarmModel: 'ISA-18.2-ish',
  thresholds: {
    staleFreshnessSec: 300,
    lowConfidenceLt: 0.5,
  },
  features: {
    aiConfidence: true,
    decisionHistory: true,
  },
  adaptRawDecision: adaptRawDecisionClientA,
  getMockRawDecisions: getMockRawDecisionsClientA,
}

