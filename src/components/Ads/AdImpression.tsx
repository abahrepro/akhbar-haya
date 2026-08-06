'use client'

import { useEffect, useRef } from 'react'

/**
 * يسجّل ظهور الإعلان مرّة واحدة حين يدخل الشاشة فعلاً.
 *
 * التسجيل عند التحميل وحده يعدّ إعلاناً في أسفل الصفحة لم يره أحد، فيعطي
 * المعلن رقماً مضخّماً. نراقب دخوله الإطار المرئي بدل ذلك.
 */
export const AdImpression: React.FC<{ id: number | string }> = ({ id }) => {
  const sent = useRef(false)
  const box = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = box.current
    if (!el || sent.current) return

    const fire = () => {
      if (sent.current) return
      sent.current = true
      const body = JSON.stringify({ id })
      // sendBeacon ينجو من مغادرة الصفحة، وfetch احتياط لمتصفّح لا يدعمه
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/ad-view', new Blob([body], { type: 'application/json' }))
      } else {
        void fetch('/api/ad-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => {})
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            fire()
            observer.disconnect()
          }
        }
      },
      { threshold: 0.5 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [id])

  return <span ref={box} aria-hidden="true" className="absolute inset-0 -z-1" />
}
