'use client'

import { useFormFields } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

/**
 * حالة العاجل كما يراها القارئ الآن.
 *
 * العمود يبقى مؤشّراً بعد انتهاء النافذة، فيرى المحرّر «عاجل» مؤشّراً
 * والموقع لا يعرضه — والتناقض يدفعه إلى الشكّ في العطل. هذا السطر يقول
 * ما يجري بالضبط بدل أن يتركه يخمّن.
 */
export const AdminBreakingStatus: React.FC = () => {
  const [rawUntil, rawMinutes] = useFormFields(([fields]) => [
    fields?.breakingUntil?.value,
    fields?.breakingMinutes?.value,
  ])

  // العدّ يتغيّر بمرور الوقت لا بتغيّر الحقول، فنحدّثه بأنفسنا
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30_000)
    return () => clearInterval(t)
  }, [])

  const until = typeof rawUntil === 'string' ? new Date(rawUntil).getTime() : null
  const minutes = Number(rawMinutes) || 60

  let tone = 'live'
  let text = ''

  if (!until) {
    text = `لم يُحفظ بعد — سيبدأ العاجل ${minutes} دقيقة من لحظة الحفظ.`
    tone = 'pending'
  } else {
    const left = Math.round((until - Date.now()) / 60_000)
    if (left > 0) {
      text = `يظهر عاجلاً الآن — يتوقّف تلقائياً بعد ${left} دقيقة.`
    } else {
      text = `توقّف تلقائياً — لم يعد يظهر عاجلاً منذ ${Math.abs(left)} دقيقة.`
      tone = 'ended'
    }
  }

  return (
    <div className={`ah-breaking ah-breaking--${tone}`}>
      <span className="ah-breaking__dot" />
      {text}
    </div>
  )
}
