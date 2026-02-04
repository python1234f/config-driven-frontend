/**
 * @typedef {Object} NormalizedSignal
 * @property {string} name
 * @property {string} trend
 * @property {number=} value
 * @property {string=} unit
 */

/**
 * @typedef {Object} NormalizedDecisionMeta
 * @property {string} clientId
 * @property {string} unitId
 * @property {(number|null)=} freshnessSec
 * @property {string=} reason
 */

/**
 * @typedef {Object} NormalizedDecision
 * @property {string} id
 * @property {string} type
 * @property {number} confidence
 * @property {string} timestamp
 * @property {{minutes:number}} window
 * @property {NormalizedSignal[]} signals
 * @property {NormalizedDecisionMeta} meta
 */

export {}

