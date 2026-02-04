import React from 'react'

export function JsonView({ value }) {
  const text = React.useMemo(() => {
    try {
      return JSON.stringify(value, null, 2)
    } catch (e) {
      return String(value)
    }
  }, [value])

  return <pre className="json">{text}</pre>
}

