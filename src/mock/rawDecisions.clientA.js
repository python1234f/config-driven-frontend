export function getMockRawDecisionsClientA() {
  console.log('[DECISION]', 'getMockRawDecisionsClientA')
  return [
    {
      id: 'A-0001',
      kind: 'PressureAnomaly',
      confidence: 0.82,
      ts: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      unitId: 'train-1',
      freshnessSec: 40,
      reason: 'Pressure spike vs baseline trend.',
      signals: [
        { name: 'PT-101', value: 87.2, unit: 'bar', trend: 'up' },
        { name: 'FT-202', value: 13.4, unit: 'kg/s', trend: 'flat' },
      ],
    },
    {
      id: 'A-0002',
      kind: 'TempDrift',
      confidence: 0.41,
      ts: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
      unitId: 'train-2',
      freshnessSec: 620,
      reason: 'Temperature drift with missing calibration tag.',
      signals: [{ name: 'TT-77', value: 312.7, unit: 'C', trend: 'up' }],
    },
    {
      id: 'A-0003',
      kind: 'UnknownDecision',
      confidence: 0,
      ts: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      unitId: 'unit-unknown',
      freshnessSec: 120,
      reason: 'No signals payload (demo of graceful degradation).',
      signals: [],
    },
  ]
}
