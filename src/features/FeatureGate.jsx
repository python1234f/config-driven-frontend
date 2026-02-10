import React from 'react'
import { useFeatures } from './FeatureContext.jsx'

export function FeatureGate({ name, children, fallback = null }) {
  const features = useFeatures()
  const enabled = !!features?.[name]
  if (!enabled) return fallback
  return <>{children}</>
}
