/**
 * @typedef {Object} ClientFeatures
 * @property {boolean} aiConfidence
 * @property {boolean} decisionHistory
 */

/**
 * @typedef {Object} ClientConfig
 * @property {string} id
 * @property {string} label
 * @property {Object} units
 * @property {string} alarmModel
 * @property {ClientFeatures} features
 * @property {(raw:any, cfg:ClientConfig)=>import('./normalizedDecision.js').NormalizedDecision} adaptRawDecision
 * @property {()=>any[]} getMockRawDecisions
 * @property {Object} thresholds
 * @property {number} thresholds.staleFreshnessSec
 * @property {number} thresholds.lowConfidenceLt
 */

export {}

