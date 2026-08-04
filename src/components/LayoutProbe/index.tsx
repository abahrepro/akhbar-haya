'use client'

import React from 'react'

/**
 * مِسبار تخطيط يُفعَّل بإضافة `?debug=layout` إلى أي رابط.
 *
 * صفحة تشخيص منفصلة لا تنفع هنا: العطل يظهر في الصفحات المكتملة وحدها،
 * فالقياس يجب أن يجري فوق المحتوى الحقيقي على الجهاز الذي يُظهره.
 */
type Row = { tag: string; cls: string; w: number; l: number; r: number; clipped: boolean }

/** هل يقصّ أحد الأجداد هذا العنصر أفقياً؟ */
const isClipped = (el: Element): boolean => {
  let p = el.parentElement
  while (p) {
    const ox = getComputedStyle(p).overflowX
    if (ox === 'hidden' || ox === 'clip' || ox === 'auto' || ox === 'scroll') return true
    p = p.parentElement
  }
  return false
}

export const LayoutProbe: React.FC = () => {
  const [on, setOn] = React.useState(false)
  const [data, setData] = React.useState<null | {
    client: number
    scroll: number
    scrollX: number
    over: number
    boxes: string[]
    rows: Row[]
  }>(null)

  const measure = React.useCallback(() => {
    const d = document.documentElement
    const rows: Row[] = []

    /** عرض الصندوق الداخلي للأب بعد طرح حشوته */
    const innerOf = (el: Element) => {
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      return {
        left: r.left + parseFloat(cs.paddingLeft || '0') + parseFloat(cs.borderLeftWidth || '0'),
        right: r.right - parseFloat(cs.paddingRight || '0') - parseFloat(cs.borderRightWidth || '0'),
      }
    }

    // العنصر الذي يتجاوز صندوق أبيه هو المتسبّب، حتى لو قصّه جدّ أعلى
    document.querySelectorAll('main *').forEach((el) => {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) return
      const p = el.parentElement
      if (!p) return
      const inner = innerOf(p)
      const spill = Math.round(Math.max(inner.left - r.left, r.right - inner.right))
      if (spill > 1) {
        rows.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || '').toString().slice(0, 40),
          w: Math.round(r.width),
          l: Math.round(r.left),
          r: spill,
          clipped: false,
        })
      }
    })

    const box = (sel: string) => {
      const el = document.querySelector(sel)
      if (!el) return 'none'
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      return `${Math.round(r.left)}..${Math.round(r.right)} pad ${cs.paddingLeft}/${cs.paddingRight}`
    }

    rows.sort((a, b) => b.r - a.r)
    setData({
      client: d.clientWidth,
      scroll: d.scrollWidth,
      scrollX: Math.round(window.scrollX),
      over: d.scrollWidth - d.clientWidth,
      boxes: [
        `container ${box('main.container')}`,
        `grid      ${box('main.container > div')}`,
        `article   ${box('article')}`,
      ],
      rows: rows.slice(0, 8),
    })
  }, [])

  React.useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('debug')) return
    setOn(true)
    const t = setTimeout(measure, 1200)
    return () => clearTimeout(t)
  }, [measure])

  if (!on) return null

  return (
    <div
      style={{
        position: 'fixed',
        insetInlineStart: 0,
        insetBlockEnd: 0,
        zIndex: 99999,
        maxHeight: '52vh',
        overflow: 'auto',
        background: data && data.over > 0 ? '#3a0000' : '#003000',
        color: '#fff',
        font: '11px/1.55 monospace',
        padding: 8,
        width: '100%',
        direction: 'ltr',
      }}
    >
      <button
        onClick={measure}
        style={{ padding: '5px 12px', marginBottom: 6, background: '#fff', color: '#000' }}
      >
        قِس الآن
      </button>
      {data && (
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
          {[
            `overflow = ${data.over}px   ${data.over > 0 ? '<<< FOUND' : 'none'}`,
            `client ${data.client} / scroll ${data.scroll} / scrollX ${data.scrollX}`,
            ...data.boxes,
            `--- spilling past parent: ${data.rows.length} ---`,
            ...data.rows.map((r) => `SPILL ${r.r}px  ${r.tag} w=${r.w} l=${r.l}\n  .${r.cls}`),
          ].join('\n')}
        </pre>
      )}
    </div>
  )
}
