'use client'

import React from 'react'

/**
 * صفحة تشخيص مؤقّتة لعطل التخطيط على أندرويد.
 * تقيس الفائض الأفقي وتسمّي العناصر المتسبّبة به على الجهاز نفسه،
 * لأن العطل لم يظهر في أي متصفّح على المكتب.
 */
type Row = { tag: string; cls: string; w: number; l: number; r: number }

export default function DebugLayout() {
  const [data, setData] = React.useState<null | {
    client: number
    scroll: number
    inner: number
    visual: number
    dpr: number
    dir: string
    htmlOvx: string
    bodyOvx: string
    scrollX: number
    ua: string
    rows: Row[]
  }>(null)

  const measure = React.useCallback(() => {
    const d = document.documentElement
    const rows: Row[] = []
    document.querySelectorAll('*').forEach((el) => {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) return
      if (r.right > d.clientWidth + 1 || r.left < -1) {
        rows.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || '').toString().slice(0, 46),
          w: Math.round(r.width),
          l: Math.round(r.left),
          r: Math.round(r.right),
        })
      }
    })
    setData({
      client: d.clientWidth,
      scroll: d.scrollWidth,
      inner: window.innerWidth,
      visual: Math.round(window.visualViewport?.width ?? 0),
      dpr: window.devicePixelRatio,
      dir: getComputedStyle(d).direction,
      htmlOvx: getComputedStyle(d).overflowX,
      bodyOvx: getComputedStyle(document.body).overflowX,
      scrollX: Math.round(window.scrollX),
      ua: navigator.userAgent.slice(0, 110),
      rows: rows.slice(0, 14),
    })
  }, [])

  React.useEffect(() => {
    const t = setTimeout(measure, 900)
    return () => clearTimeout(t)
  }, [measure])

  const over = data ? data.scroll - data.client : 0

  return (
    <main style={{ padding: 12, fontFamily: 'monospace', fontSize: 13, lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>تشخيص التخطيط</h1>
      <button
        onClick={measure}
        style={{ padding: '8px 16px', marginBottom: 12, border: '1px solid #999', borderRadius: 8 }}
      >
        أعد القياس
      </button>

      {!data ? (
        <p>جارٍ القياس…</p>
      ) : (
        <>
          <div
            style={{
              padding: 10,
              marginBottom: 12,
              borderRadius: 8,
              background: over > 0 ? '#fee' : '#efe',
              border: `2px solid ${over > 0 ? '#c00' : '#0a0'}`,
              fontWeight: 700,
            }}
          >
            {over > 0 ? `فائض أفقي: ${over}px ✗` : 'لا يوجد فائض أفقي ✓'}
          </div>

          <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
            {[
              `clientWidth   ${data.client}`,
              `scrollWidth   ${data.scroll}`,
              `innerWidth    ${data.inner}`,
              `visualVP      ${data.visual}`,
              `scrollX       ${data.scrollX}`,
              `devicePixel   ${data.dpr}`,
              `direction     ${data.dir}`,
              `html ovx      ${data.htmlOvx}`,
              `body ovx      ${data.bodyOvx}`,
            ].join('\n')}
          </pre>

          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '14px 0 6px' }}>
            عناصر خارج الإطار ({data.rows.length})
          </h2>
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: 11.5 }}>
            {data.rows.length === 0
              ? 'لا شيء'
              : data.rows
                  .map((r) => `${r.tag} w=${r.w} l=${r.l} r=${r.r}\n  ${r.cls}`)
                  .join('\n')}
          </pre>

          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '14px 0 6px' }}>المتصفّح</h2>
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: 11 }}>{data.ua}</pre>
        </>
      )}
    </main>
  )
}
