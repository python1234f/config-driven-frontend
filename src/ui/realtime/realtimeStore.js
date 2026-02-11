import React from 'react'

const INITIAL_STATE = {
  latestDecision: null,
  decisionHistory: [],
  ptHistory: [],
}

let state = INITIAL_STATE
const listeners = new Set()

function emit() {
  for (const l of listeners) l()
}

export function getRealtimeState() {
  return state
}

export function subscribeRealtime(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function resetRealtimeState() {
  state = {
    latestDecision: null,
    decisionHistory: [],
    ptHistory: [],
  }
  emit()
}

export function setRealtimeState(partial) {
  if (!partial || typeof partial !== 'object') return
  state = { ...state, ...partial }
  emit()
}

export function pushRealtimeDecision({
  decision,
  ptValue,
  decisionHistoryLimit = 12,
  ptHistoryLimit = 50,
  resetHistory = false,
}) {
  if (!decision) return

  const basePtHistory = resetHistory ? [] : state.ptHistory
  const baseDecisionHistory = resetHistory ? [] : state.decisionHistory

  const nextPtHistory =
    typeof ptValue === 'number' && !Number.isNaN(ptValue)
      ? [...basePtHistory, ptValue].slice(-ptHistoryLimit)
      : basePtHistory

  const nextDecisionHistory = [decision, ...baseDecisionHistory].slice(
    0,
    decisionHistoryLimit,
  )

  state = {
    ...state,
    latestDecision: decision,
    decisionHistory: nextDecisionHistory,
    ptHistory: nextPtHistory,
  }

  emit()
}

export function useRealtimeStore(selector) {
  const select = typeof selector === 'function' ? selector : (s) => s
  return React.useSyncExternalStore(
    subscribeRealtime,
    () => select(state),
    () => select(state),
  )
}
