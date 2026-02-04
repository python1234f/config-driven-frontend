/**
 * clientA raw shape (example):
 * {
 *   id: string,
 *   kind: string,
 *   confidence: number,
 *   ts: string,
 *   unitId: string,
 *   freshnessSec: number,
 *   reason: string,
 *   signals: Array<{ name:string, value?:number, unit?:string, trend?:string }>
 * }
 */
export function adaptRawDecisionClientA(raw, clientConfig) {
  console.log('[ADAPTER]', 'clientA raw->normalized input', raw)

  const signals = Array.isArray(raw?.signals)
    ? raw.signals.map((s) => ({
        name: s?.name ?? 'unknown',
        trend: s?.trend ?? 'unknown',
        value: typeof s?.value === 'number' ? s.value : undefined,
        unit: s?.unit ?? undefined,
      }))
    : []

  const normalized = {
    id: raw?.id ?? `${clientConfig.id}-${Date.now()}`,
    type: raw?.kind ?? 'UnknownDecision',
    confidence: typeof raw?.confidence === 'number' ? raw.confidence : 0,
    timestamp: raw?.ts ?? new Date().toISOString(),
    window: { minutes: 15 },
    signals,
    meta: {
      clientId: clientConfig.id,
      unitId: raw?.unitId ?? 'unit-unknown',
      freshnessSec:
        typeof raw?.freshnessSec === 'number' ? raw.freshnessSec : null,
      reason: raw?.reason ?? 'n/a',
    },
  }

  console.log('[ADAPTER]', 'clientA raw->normalized output', normalized)
  return normalized
}

