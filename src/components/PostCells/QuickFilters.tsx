'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback } from 'react'

import { cn } from '@/utilities/ui'

/** بداية اليوم بتوقيت عمّان */
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
  { key: 'breaking', label: 'عاجل', params: { 'where[breaking][equals]': 'true' } },
  { key: 'featured', label: 'مميّز', params: { 'where[featured][equals]': 'true' } },
  { key: 'photo', label: 'صورة وخبر', params: { 'where[type][equals]': 'photo' } },
  { key: 'video', label: 'فيديو', params: { 'where[type][equals]': 'video' } },
]

/** أزرار فلترة سريعة أعلى جدول الأخبار */
export const QuickFilters: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = decodeURIComponent(searchParams.toString())

  const isActive = useCallback(
    (f: Filter) => {
      const keys = Object.keys(f.params)
      if (keys.length === 0) return !current.includes('where')
      return keys.every((k) => current.includes(k))
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
    <div className="ah flex flex-wrap items-center gap-1.5 pb-4 pt-3" dir="rtl">
      <span className="me-1 text-[13px] font-bold text-[var(--ah-muted)]">عرض سريع:</span>
      {FILTERS.map((f) => {
        const active = isActive(f)
        return (
          <button
            key={f.key}
            type="button"
            onClick={() => apply(f)}
            className={cn(
              'cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] font-bold transition-colors',
              active
                ? 'border-[var(--ah-brand)] bg-[var(--ah-brand)] text-white'
                : 'border-[var(--ah-line)] bg-[var(--ah-surface-2)] text-[var(--ah-text)] hover:border-[var(--ah-brand)] hover:text-[var(--ah-brand)]',
            )}
          >
            {f.label}
          </button>
        )
      })}
    </div>
  )
}

export default QuickFilters
