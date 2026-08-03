import React from 'react'

import { Media } from '@/components/Media'
import { IconClock } from '@/components/Brand/icons'
import { formatRelative } from '@/utilities/formatArabicDate'
import { cn } from '@/utilities/ui'
import type { NewsItem } from './types'

/** صورة الخبر مع بديل متدرّج عند غياب الصورة */
export const NewsImage: React.FC<{
  item: NewsItem
  size?: 'thumbnail' | 'square' | 'small' | 'medium' | 'large' | 'xlarge'
  className?: string
  fill?: boolean
}> = ({ item, size = 'medium', className, fill = true }) => {
  if (item.image) {
    return (
      <Media
        resource={item.image}
        size={size}
        fill={fill}
        imgClassName={cn('object-cover', className)}
        alt={item.imageAlt || item.title}
      />
    )
  }
  return (
    <div
      className={cn('size-full bg-linear-140 from-brand/70 to-brand-deep', className)}
      aria-hidden="true"
    />
  )
}

/** شارة القسم فوق الصورة */
export const CategoryChip: React.FC<{ label: string; color?: string | null; overlay?: boolean }> = ({
  label,
  color,
  overlay = true,
}) => (
  <span
    className={cn(
      'inline-flex rounded-full px-2.5 py-1 text-[11.5px] font-extrabold text-white',
      overlay && 'absolute start-3 top-3 z-2 backdrop-blur-sm',
    )}
    style={{ backgroundColor: color || 'rgba(0,0,0,.42)' }}
  >
    {label}
  </span>
)

/** شارة عاجل */
export const BreakingChip: React.FC = () => (
  <span className="absolute end-3 top-3 z-2 inline-flex items-center gap-1.5 rounded-full bg-alert px-2.5 py-1 text-[11px] font-extrabold text-white">
    <span className="size-1.5 animate-pulse rounded-full bg-white" />
    عاجل
  </span>
)

/** ختم الوقت */
export const TimeStamp: React.FC<{ date?: string | null; className?: string; onDark?: boolean }> = ({
  date,
  className,
  onDark,
}) => {
  if (!date) return null
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[12.5px] font-semibold',
        onDark ? 'text-white/80' : 'text-muted-foreground',
        className,
      )}
    >
      <IconClock className="size-3 opacity-80" />
      {formatRelative(date)}
    </span>
  )
}

/** شارة مدّة الفيديو */
export const DurationChip: React.FC<{ duration?: string | null }> = ({ duration }) =>
  duration ? (
    <span className="absolute bottom-2 end-2 z-2 rounded-[5px] bg-black/70 px-1.5 py-0.5 text-[11px] font-bold text-white">
      {duration}
    </span>
  ) : null

/** أيقونة تشغيل فوق صور الفيديو */
export const PlayBadge: React.FC<{ size?: 'sm' | 'lg' }> = ({ size = 'sm' }) => (
  <span
    className={cn(
      'absolute inset-0 z-2 m-auto grid place-items-center rounded-full bg-white/90 text-brand-deep shadow-lg',
      size === 'lg' ? 'size-16' : 'size-11',
    )}
  >
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('ms-0.5', size === 'lg' ? 'size-7' : 'size-5')}
      aria-hidden="true"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  </span>
)

/** عنوان قسم مع خط فاصل ورابط "كل الأخبار" */
export const SectionHead: React.FC<{
  title: string
  href?: string
  color?: string | null
  moreLabel?: string
}> = ({ title, href, color, moreLabel = 'كل الأخبار' }) => (
  <div className="mb-4 flex items-center gap-3.5">
    <h2 className="relative ps-3.5 text-[21px] font-extrabold tracking-tight">
      <span
        className="absolute start-0 top-1/2 h-[22px] w-[5px] -translate-y-1/2 rounded"
        style={{ backgroundColor: color || 'var(--brand)' }}
      />
      {title}
    </h2>
    <span className="h-px flex-1 bg-border" />
    {href && (
      <a
        href={href}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-brand transition hover:opacity-80"
      >
        {moreLabel}
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5" aria-hidden="true">
          <path d="M15 5l-1.4 1.4L18.2 11H4v2h14.2l-4.6 4.6L15 19l7-7-7-7z" />
        </svg>
      </a>
    )}
  </div>
)
