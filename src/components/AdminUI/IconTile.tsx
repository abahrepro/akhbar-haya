import React from 'react'

import { cn } from '@/utilities/ui'

export type Accent = 'violet' | 'coral' | 'amber' | 'blue' | 'green' | 'teal'

/** لوحة ألوان مساعدة للبيانات — مستقلّة عن الأخضر الأساسي للهوية */
export const ACCENT: Record<Accent, { fg: string; bg: string }> = {
  violet: { fg: '#7c5cfc', bg: 'rgba(124,92,252,.12)' },
  coral: { fg: '#f5566c', bg: 'rgba(245,86,108,.12)' },
  amber: { fg: '#f59f3f', bg: 'rgba(245,159,63,.14)' },
  blue: { fg: '#2f6fed', bg: 'rgba(47,111,237,.12)' },
  green: { fg: '#22a06b', bg: 'rgba(34,160,107,.12)' },
  teal: { fg: '#12b5b0', bg: 'rgba(18,181,176,.12)' },
}

/** مربّع أيقونة بخلفية ملوّنة ناعمة */
export const IconTile: React.FC<{
  accent?: Accent
  size?: number
  className?: string
  children: React.ReactNode
}> = ({ accent = 'green', size = 38, className, children }) => {
  const c = ACCENT[accent]
  return (
    <span
      className={cn('grid shrink-0 place-items-center rounded-[11px]', className)}
      style={{ width: size, height: size, background: c.bg, color: c.fg }}
    >
      {children}
    </span>
  )
}
