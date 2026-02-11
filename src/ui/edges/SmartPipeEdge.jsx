import React from 'react'
import { BaseEdge, getSmoothStepPath } from '@xyflow/react'
import { useRealtimeSelector } from '../realtime/realtimeStore.js'

const EDGE_BASE_STYLE = { stroke: '#cbd5e1', strokeWidth: 2 }
const EDGE_ALARM_STYLE = { stroke: '#ef4444', strokeWidth: 3 }
const BORDER_RADIUS = 10

function sanitizeMarkerId(id) {
  return String(id).replace(/[^a-zA-Z0-9_-]/g, '-')
}

function computeAlarmFlag(decision) {
  if (!decision) return false
  const conf = typeof decision.confidence === 'number' ? decision.confidence : 0
  return conf >= 0.82 || /anomaly|alarm/i.test(String(decision.type || ''))
}

function shallowEqualEdgeState(a, b) {
  if (a === b) return true
  if (!a || !b) return false
  return a.alarmSource === b.alarmSource && a.isAlarm === b.isAlarm
}

export const SmartPipeEdge = React.memo(function SmartPipeEdge({
  id,
  source,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}) {
  const select = React.useCallback(
    (state) => {
      const d = state.latestDecision
      const alarmSource = d?.meta?.unitId ?? null
      const isAlarm = computeAlarmFlag(d)
      return { alarmSource, isAlarm }
    },
    [],
  )

  const { alarmSource, isAlarm } = useRealtimeSelector(select, shallowEqualEdgeState)
  const edgeAlarm = !!alarmSource && isAlarm && source === alarmSource

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: BORDER_RADIUS,
  })

  const style = edgeAlarm ? EDGE_ALARM_STYLE : EDGE_BASE_STYLE
  const markerId = `pipe-arrow-${sanitizeMarkerId(id)}`

  return (
    <>
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={style.stroke} />
        </marker>
      </defs>
      <BaseEdge path={edgePath} style={style} markerEnd={`url(#${markerId})`} />
    </>
  )
})

