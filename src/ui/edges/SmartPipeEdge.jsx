import React from 'react'
import { BaseEdge, getSmoothStepPath } from '@xyflow/react'
import { useRealtimeSelector } from '../realtime/realtimeStore.js'

const EDGE_BASE_STYLE = { stroke: '#cbd5e1', strokeWidth: 2 }
const EDGE_ALARM_STYLE = { stroke: '#ef4444', strokeWidth: 3 }
const BORDER_RADIUS = 10
const BASE_MARKER_ID = 'pipe-arrow-base'
const ALARM_MARKER_ID = 'pipe-arrow-alarm'
const EDGE_ALARM_ANIM_STYLE = {
  strokeDasharray: 5,
  animation: 'dashdraw 0.5s linear infinite',
}

function computeAlarmFlag(decision) {
  if (!decision) return false
  const conf = typeof decision.confidence === 'number' ? decision.confidence : 0
  return conf >= 0.82 || /anomaly|alarm/i.test(String(decision.type || ''))
}

function shallowEqualEdgeState(a, b) {
  if (a === b) return true
  if (!a || !b) return false
  return a.sectionId === b.sectionId && a.isAlarm === b.isAlarm
}

export const SmartPipeEdge = React.memo(function SmartPipeEdge({
  data,
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
      const sectionId = d?.meta?.sectionId ?? null
      const isAlarm = computeAlarmFlag(d)
      return { sectionId, isAlarm }
    },
    [],
  )

  const { sectionId, isAlarm } = useRealtimeSelector(select, shallowEqualEdgeState)
  const sourceSection = data?.sourceSection ?? null
  const isBus = data?.kind === 'bus'
  const edgeAlarm = isBus && !!sectionId && isAlarm && sourceSection === sectionId

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: BORDER_RADIUS,
  })

  const style = edgeAlarm ? { ...EDGE_ALARM_STYLE, ...EDGE_ALARM_ANIM_STYLE } : EDGE_BASE_STYLE
  const markerId = edgeAlarm ? ALARM_MARKER_ID : BASE_MARKER_ID

  return (
    <>
      <BaseEdge path={edgePath} style={style} markerEnd={`url(#${markerId})`} />
    </>
  )
})
