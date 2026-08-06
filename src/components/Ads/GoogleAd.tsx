'use client'

import Script from 'next/script'
import React, { useEffect, useRef } from 'react'

/**
 * وحدة AdSense ثابتة المقاس.
 *
 * لا نستعمل `data-ad-format="auto"` ولا `full-width-responsive` ولا الإعلانات
 * التلقائية: تلك تقرّر مقاسها وموضعها وقت التحميل فتزيح التصميم وتقفز الصفحة
 * تحت القارئ — وهو سبب إيقاف الإعلانات على الموقع القديم. المقاس هنا مصرّح
 * به مسبقاً، والصندوق الحاوي يقصّ أي تجاوز.
 */
export const GoogleAd: React.FC<{
  publisherId: string
  unitId: string
  width: number
  height: number
}> = ({ publisherId, unitId, width, height }) => {
  const pushed = useRef(false)

  useEffect(() => {
    // التحديث في التطوير قد يشغّل التأثير مرّتين، والدفع المكرّر يرمي خطأ
    if (pushed.current) return
    pushed.current = true
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] }
      w.adsbygoogle = w.adsbygoogle || []
      w.adsbygoogle.push({})
    } catch {
      /* حاجب إعلانات أو سكربت لم يُحمّل — لا شيء نفعله */
    }
  }, [])

  return (
    <>
      <Script
        id="adsbygoogle-init"
        strategy="afterInteractive"
        crossOrigin="anonymous"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
      />
      <ins
        className="adsbygoogle"
        style={{ display: 'inline-block', width, height }}
        data-ad-client={publisherId}
        data-ad-slot={unitId}
      />
    </>
  )
}
