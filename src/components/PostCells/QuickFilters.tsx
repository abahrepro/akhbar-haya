'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback } from 'react'

import './cells.scss'

/** بداية اليوم بتوقيت عمّان بصيغة ISO */
const startOfToday = (): string => {
  const d = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Amman',
  }).format(new Date())
  return `${d}T00:00:00.000Z`
}

const daysAgo = (n: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

type Filter = { key: string; label: string; params: Record<string, string> }

const FILTERS: Filter[] = [
  { key: 'all', label: 'الكل', params: {} },
  {
    key: 'today',
    label: 'اليوم',
    params: { 'where[publishedAt][greater_than_equal]': startOfToday() },
  },
  {
    key: 'week',
    label: 'هذا الأسبوع',
    params: { 'where[publishedAt][greater_than_equal]': daysAgo(7) },
  },
  { key: 'draft', label: 'مسودات', params: { 'where[_status][equals]': 'draft' } },
  { key: 'breaking', label: '🔴 عاجل', params: { 'where[breaking][equals]': 'true' } },
  { key: 'featured', label: '⭐ مميّز', params: { 'where[featured][equals]': 'true' } },
  { key: 'photo', label: '📷 صورة وخبر', params: { 'where[type][equals]': 'photo' } },
  { key: 'video', label: '🎥 فيديو', params: { 'where[type][equals]': 'video' } },
]

/** أزرار فلترة سريعة أعلى جدول الأخبار */
export const QuickFilters: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const current = searchParams.toString()

  const isActive = useCallback(
    (f: Filter) => {
      const keys = Object.keys(f.params)
      if (keys.length === 0) return !current.includes('where')
      // نطابق المفتاح فقط لأن القيم الزمنية تتغيّر
      return keys.every((k) => current.includes(encodeURIComponent(k).replace(/%5B/g, '[').replace(/%5D/g, ']')) || current.includes(k))
    },
    [current],
  )

  const apply = useCallback(
    (f: Filter) => {
      const sp = new URLSearchParams()
      Object.entries(f.params).forEach(([k, v]) => sp.set(k, v))
      const qs = sp.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname)
    },
    [pathname, router],
  )

  return (
    <div className="ah-quick-filters">
      <span className="ah-quick-filters__label">عرض سريع:</span>
      {FILTERS.map((f) => (
        <button
          key={f.key}
          type="button"
          onClick={() => apply(f)}
          className={`ah-quick-filters__btn${isActive(f) ? ' is-active' : ''}`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}

export default QuickFilters
