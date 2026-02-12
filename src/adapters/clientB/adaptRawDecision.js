/**
 * clientB raw shape (example):
 * {
 *   decisionId: string,
 *   decisionType: string,
 *   scorePct: number, // 0..100
 *   timestampMs: number,
 *   asset: { id: string },
 *   ageSec: number,
 *   rationale: string,
 *   metrics: Array<{ label:string, v?:number, u?:string, dir?:string }>
 * }
 */
export function adaptRawDecisionClientB(raw, clientConfig) {
  const signals = Array.isArray(raw?.metrics)
    ? raw.metrics.map((m) => ({
        name: m?.label ?? 'unknown',
        trend: m?.dir ?? 'unknown',
        value: typeof m?.v === 'number' ? m.v : undefined,
        unit: m?.u ?? undefined,
      }))
    : []

  const confidence =
    typeof raw?.scorePct === 'number'
      ? Math.max(0, Math.min(1, raw.scorePct / 100))
      : 0

  const normalized = {
    id: raw?.decisionId ?? `${clientConfig.id}-${Date.now()}`,
    type: raw?.decisionType ?? 'UnknownDecision',
    confidence,
    timestamp:
      typeof raw?.timestampMs === 'number'
        ? new Date(raw.timestampMs).toISOString()
        : new Date().toISOString(),
    window: { minutes: 30 },
    signals,
    meta: {
      clientId: clientConfig.id,
      unitId: raw?.asset?.id ?? 'unit-unknown',
      sectionId: typeof raw?.asset?.sectionId === 'string' ? raw.asset.sectionId : null,
      freshnessSec: typeof raw?.ageSec === 'number' ? raw.ageSec : null,
      reason: raw?.rationale ?? 'n/a',
    },
  }

  return normalized
}
