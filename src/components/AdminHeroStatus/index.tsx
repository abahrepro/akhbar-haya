'use client'

import { useFormFields } from '@payloadcms/ui'
import React from 'react'

const LABEL: Record<string, string> = {
  '1': 'البطاقة الكبيرة',
  '2': 'الثانية',
  '3': 'الثالثة',
  '4': 'الرابعة',
  '5': 'الخامسة',
}

/**
 * يؤكّد للمحرّر أين سيقع الخبر.
 * أرقام المواضع وحدها لا تصف شكل السلايدر — الموضع الأول بطاقة كبيرة
 * والبقية صغيرة جانبها، والفرق بينهما يعني شيئاً عند اختيار الخبر.
 */
export const AdminHeroStatus: React.FC = () => {
  const [raw] = useFormFields(([fields]) => [fields?.heroSlot?.value])
  const slot = typeof raw === 'string' ? raw : ''
  if (!slot) return null

  return (
    <div className="ah-hero-slot">
      <span className="ah-hero-slot__num">{slot}</span>
      مثبّت في السلايدر — {LABEL[slot] ?? slot}
      {slot !== '1' && <em> (بطاقة جانبية)</em>}
    </div>
  )
}
