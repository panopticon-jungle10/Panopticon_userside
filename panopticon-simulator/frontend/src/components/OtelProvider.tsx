'use client'

import { PropsWithChildren, useEffect } from 'react'

// Dynamically import otel-browser to ensure it runs in browser only
if (typeof window !== 'undefined') {
  import('../lib/otel-browser')
}

export function OtelProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    console.log('[OtelProvider] Component mounted')
  }, [])

  return <>{children}</>
}
