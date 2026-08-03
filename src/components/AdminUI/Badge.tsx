import React from 'react'

import { cn } from '@/utilities/ui'

type Tone = 'brand' | 'alert' | 'gold' | 'muted' | 'blue' | 'purple' | 'clay'

const TONES: Record<Tone, string> = {
  brand: 'bg-[var(--ah-brand)]/12 text-[var(--ah-brand)]',
  alert: 'bg-[var(--ah-alert)] text-white',
  gold: 'bg-[var(--ah-gold)]/16 text-[var(--ah-gold)]',
  muted: 'bg-[var(--ah-line)] text-[var(--ah-muted)]',
  blue: 'bg-[#2563a8]/15 text-[#2563a8]',
  purple: 'bg-[#6d4aa7]/15 text-[#6d4aa7]',
  clay: 'bg-[#b5603a]/15 text-[#b5603a]',
}

/** شارة صغيرة موحّدة داخل اللوحة */
export const Badge: React.FC<{
  children: React.ReactNode
  tone?: Tone
  className?: string
}> = ({ children, tone = 'muted', className }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-extrabold leading-5 whitespace-nowrap',
      TONES[tone],
      className,
    )}
  >
    {children}
  </span>
)

/** شارة الحالة — تكتشف «مجدول» من تاريخ النشر المستقبلي */
export const StatusBadge: React.FC<{
  status?: string | null
  publishedAt?: string | null
}> = ({ status, publishedAt }) => {
  const scheduled =
    status === 'published' && publishedAt && new Date(publishedAt).getTime() > Date.now()

  if (scheduled) return <Badge tone="gold">مجدول</Badge>
  if (status === 'published') return <Badge tone="brand">منشور</Badge>
  return <Badge tone="muted">مسودة</Badge>
}

/** شارة نوع الخبر */
const TYPE_MAP: Record<string, { label: string; tone: Tone }> = {
  photo: { label: 'صورة وخبر', tone: 'clay' },
  video: { label: 'فيديو', tone: 'blue' },
  opinion: { label: 'رأي', tone: 'purple' },
}

export const TypeBadge: React.FC<{ type?: string | null }> = ({ type }) => {
  const t = type ? TYPE_MAP[type] : undefined
  if (!t) return null
  return <Badge tone={t.tone}>{t.label}</Badge>
}
