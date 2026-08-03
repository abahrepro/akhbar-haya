'use client'

import Link from 'next/link'
import React, { useEffect, useState } from 'react'

import { IconClose } from '@/components/Brand/icons'
import { cn } from '@/utilities/ui'

type Props = {
  title: string
  href: string
  /** معرّف الخبر — يُستخدم لتذكّر أن المستخدم أغلقه */
  id: string | number
}

/** تنبيه الخبر العاجل — ينبثق فوق المحتوى ويمكن إغلاقه */
export const BreakingToast: React.FC<Props> = ({ title, href, id }) => {
  const [visible, setVisible] = useState(false)
  const storageKey = `ah-breaking-dismissed-${id}`

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem(storageKey)) return
    const t = setTimeout(() => setVisible(true), 1800)
    return () => clearTimeout(t)
  }, [storageKey])

  const dismiss = () => {
    setVisible(false)
    try {
      sessionStorage.setItem(storageKey, '1')
    } catch {
      /* تجاهل: التخزين قد يكون معطّلاً */
    }
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'grid grid-cols-[auto_1fr_auto] items-center gap-3.5 overflow-hidden rounded-[9px] border-s-4 border-alert bg-alert/10 shadow-sm transition-all duration-500 ease-out',
        visible
          ? 'mb-5 max-h-[200px] translate-y-0 px-4 py-3 opacity-100'
          : 'pointer-events-none mb-0 max-h-0 -translate-y-3 px-4 py-0 opacity-0',
      )}
    >
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-alert px-3 py-1 text-[13px] font-extrabold text-white">
        <span className="size-1.5 animate-pulse rounded-full bg-white" />
        عاجل
      </span>
      <Link
        href={href}
        className="min-w-0 text-[15.5px] font-bold leading-[1.5] transition hover:text-alert"
      >
        {title}
      </Link>
      <button
        onClick={dismiss}
        aria-label="إغلاق الخبر العاجل"
        className="grid size-7.5 shrink-0 cursor-pointer place-items-center rounded-lg text-muted-foreground transition hover:bg-alert/15 hover:text-alert"
      >
        <IconClose className="size-4" />
      </button>
    </div>
  )
}
