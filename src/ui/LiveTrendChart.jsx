import React from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useRealtimeStore } from './realtime/realtimeStore.js'
import { RenderCounter } from './debug/RenderCounter.jsx'

const CARD_STYLE = {
  background: '#0b1220',
  border: '1px solid rgba(148, 163, 184, 0.16)',
  borderRadius: 14,
  padding: 12,
  position: 'relative',
}

const TITLE_STYLE = { color: '#e5e7eb' }
const MUTED_STYLE = { color: 'rgba(203, 213, 225, 0.75)' }

const CHART_WRAP_STYLE = {
  width: '100%',
  height: '100%',
  minHeight: 180,
}

const HEADER_ROW_STYLE = { justifyContent: 'space-between', alignItems: 'baseline' }

const GRID_STYLE = { stroke: 'rgba(148, 163, 184, 0.16)' }
const AXIS_STYLE = { stroke: 'rgba(148, 163, 184, 0.28)' }
const TICK_STYLE = { fill: 'rgba(203, 213, 225, 0.75)', fontSize: 12 }
const TOOLTIP_STYLE = {
  background: 'rgba(2, 6, 23, 0.92)',
  border: '1px solid rgba(148, 163, 184, 0.22)',
  borderRadius: 12,
  color: '#e5e7eb',
}

const CHART_MARGIN = { top: 8, right: 12, bottom: 8, left: 0 }
const Y_DOMAIN = ['auto', 'auto']

function computeExtentFromMinMax(min, max) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null
  if (min === max) return { min: min - 1, max: max + 1 }
  return { min, max }
}

export const LiveTrendChart = React.memo(function LiveTrendChart({
  title = 'PT-101 trend',
  height = 170,
  stroke = '#22c55e',
}) {
  const values = useRealtimeStore((s) => s.ptHistory)

  const { data, extent, latest } = React.useMemo(() => {
    if (!Array.isArray(values) || values.length === 0) {
      return { data: [], extent: null, latest: null }
    }

    let min = Infinity
    let max = -Infinity
    const points = []

    for (let i = 0; i < values.length; i += 1) {
      const v = values[i]
      if (typeof v !== 'number' || Number.isNaN(v)) continue
      min = Math.min(min, v)
      max = Math.max(max, v)
      points.push({ i, value: v })
    }

    const extent = computeExtentFromMinMax(min, max)
    const latest = points.length ? points[points.length - 1].value : null
    return { data: points, extent, latest }
  }, [values])

  const chartWrapStyle = React.useMemo(
    () => ({ ...CHART_WRAP_STYLE, height }),
    [height],
  )

  const tooltipFormatter = React.useCallback((v) => {
    if (typeof v === 'number') return [v.toFixed(2), 'value']
    return [String(v), 'value']
  }, [])

  return (
    <div className="card stack" style={CARD_STYLE}>
      <RenderCounter name="Chart" index={0} />
      <div className="rowWrap" style={HEADER_ROW_STYLE}>
        <div>
          <div className="h2" style={TITLE_STYLE}>
            {title}
          </div>
          <div className="muted" style={MUTED_STYLE}>
            {latest == null ? 'Waiting for data…' : `latest: ${latest.toFixed(2)}`}
          </div>
        </div>
        {extent ? (
          <div className="muted" style={MUTED_STYLE}>
            min: {extent.min.toFixed(1)} • max: {extent.max.toFixed(1)}
          </div>
        ) : null}
      </div>

      <div style={chartWrapStyle}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="4 8" {...GRID_STYLE} />
            <XAxis
              dataKey="i"
              tickLine={false}
              axisLine={AXIS_STYLE}
              tick={TICK_STYLE}
              minTickGap={36}
            />
            <YAxis
              domain={Y_DOMAIN}
              tickLine={false}
              axisLine={AXIS_STYLE}
              tick={TICK_STYLE}
              width={44}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={MUTED_STYLE}
              formatter={tooltipFormatter}
            />
            <Line
              type="linear"
              dataKey="value"
              stroke={stroke}
              strokeWidth={3}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
})
