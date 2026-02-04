import { adaptRawDecisionClientB } from '../../adapters/clientB/adaptRawDecision.js'
import { getMockRawDecisionsClientB } from '../../mock/rawDecisions.clientB.js'

/** @type {import('../../domain/clientConfig.js').ClientConfig} */
export const clientB = {
  id: 'clientB',
  label: 'Client B (Gas Plant Beta)',
  units: { pressure: 'kPa', temperature: 'K', flow: 'm3/h' },
  alarmModel: 'Custom-SLA-2025',
  thresholds: {
    staleFreshnessSec: 600,
    lowConfidenceLt: 0.6,
  },
  features: {
    aiConfidence: false,
    decisionHistory: true,
  },
  adaptRawDecision: adaptRawDecisionClientB,
  getMockRawDecisions: getMockRawDecisionsClientB,
}

