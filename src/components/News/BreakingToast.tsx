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
        /*
         * خلفية حمراء ممتلئة لا باهتة: العاجل يجب أن يُرى قبل أن يُقرأ.
         * والحدّ الجانبي الأحمر يسقط هنا — لا يُرى على خلفية من لونه.
         */
        'grid grid-cols-[auto_1fr_auto] items-center gap-3.5 overflow-hidden rounded-[9px] bg-alert shadow-sm transition-all duration-500 ease-out',
        visible
          ? 'mb-5 max-h-[200px] translate-y-0 px-4 py-3 opacity-100'
          : 'pointer-events-none mb-0 max-h-0 -translate-y-3 px-4 py-0 opacity-0',
      )}
    >
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[16px] font-extrabold text-alert">
        <span className="size-1.5 animate-pulse rounded-full bg-alert" />
        عاجل
      </span>
      <Link
        href={href}
        /* أصغر على الهاتف: الشريط ضيّق هناك فالعنوان الطويل يتكسّر أسطراً */
        className="min-w-0 text-[20px] font-bold leading-[1.45] text-white transition hover:underline sm:text-[23px]"
      >
        {title}
      </Link>
      <button
        onClick={dismiss}
        aria-label="إغلاق الخبر العاجل"
        className="grid size-7.5 shrink-0 cursor-pointer place-items-center rounded-lg text-white/80 transition hover:bg-white/20 hover:text-white"
      >
        <IconClose className="size-4" />
      </button>
    </div>
  )
}
