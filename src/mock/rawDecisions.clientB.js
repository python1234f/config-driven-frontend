export function getMockRawDecisionsClientB() {
  console.log('[DECISION]', 'getMockRawDecisionsClientB')
  return [
    {
      decisionId: 'B-9001',
      decisionType: 'FlowRestriction',
      scorePct: 93,
      timestampMs: Date.now() - 1 * 60 * 1000,
      asset: { id: 'cracker-7' },
      ageSec: 25,
      rationale: 'Flow restriction detected: valve response lag.',
      metrics: [
        { label: 'FV-12', v: 44.1, u: '%', dir: 'down' },
        { label: 'DP-3', v: 1.7, u: 'bar', dir: 'up' },
      ],
    },
    {
      decisionId: 'B-9002',
      decisionType: 'MaintenanceSuggestion',
      scorePct: 38,
      timestampMs: Date.now() - 14 * 60 * 1000,
      asset: { id: 'compressor-2' },
      ageSec: 920,
      rationale: 'Low confidence: insufficient sensor coverage.',
      metrics: [{ label: 'VIB-RMS', v: 8.2, u: 'mm/s', dir: 'unknown' }],
    },
  ]
}
