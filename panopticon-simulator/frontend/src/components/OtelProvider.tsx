'use client'

import { PropsWithChildren, useEffect } from 'react'
import { initBrowserTracing } from '../lib/otel-browser'

export function OtelProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    // 클라이언트 최초 렌더 시 한 번만 브라우저 OTEL 초기화
    initBrowserTracing()
  }, [])

  return <>{children}</>
}
