import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const collectorUrl =
  process.env.OTEL_COLLECTOR_PROXY_TARGET ||
  process.env.NEXT_PUBLIC_OTEL_EXPORTER_OTLP_URL ||
  'https://api.jungle-panopticon.cloud/producer/v1/traces'

export async function POST(request: Request) {
  try {
    const body = await request.arrayBuffer()
    const headers = new Headers(request.headers)
    headers.delete('host')

    const upstreamResponse = await fetch(collectorUrl, {
      method: 'POST',
      headers,
      body,
    })

    const responseBody = await upstreamResponse.arrayBuffer()
    const responseHeaders = new Headers()
    const contentType = upstreamResponse.headers.get('content-type')
    if (contentType) {
      responseHeaders.set('content-type', contentType)
    }

    return new Response(responseBody, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('Failed to proxy OTLP request', error)
    return NextResponse.json(
      { error: 'Failed to forward OTLP trace payload' },
      { status: 502 },
    )
  }
}
