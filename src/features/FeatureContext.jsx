import React from 'react'

export const FeatureContext = React.createContext({})

export function useFeatures() {
  return React.useContext(FeatureContext)
}

export function FeatureProvider({ features, children }) {
  React.useEffect(() => {
    console.log('[FEATURES]', 'FeatureProvider set', features)
  }, [features])

  return (
    <FeatureContext.Provider value={features || {}}>
      {children}
    </FeatureContext.Provider>
  )
}
