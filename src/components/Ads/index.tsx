import React from 'react'

import { cn } from '@/utilities/ui'

type AdSource = 'google' | 'house'

type Props = {
  /** مصدر الإعلان: شبكة جوجل أو مبيعات مباشرة */
  source?: AdSource
  /** مقاس الوحدة كما يظهر للمحرّر */
  size: string
  /** اسم الوحدة (Leaderboard / Billboard …) */
  name?: string
  className?: string
}

/**
 * مساحة إعلانية — عنصر نائب حتى يُربط بـ Google Ad Manager.
 * يميّز بصرياً بين إعلانات جوجل والإعلانات المباعة مباشرة.
 */
export const AdSlot: React.FC<Props> = ({ source = 'google', size, name, className }) => (
  <div
    className={cn(
      'relative grid place-items-center overflow-hidden rounded-[9px] text-center',
      source === 'google'
        ? 'border border-dashed border-border-strong bg-secondary'
        : 'border border-brand/40 bg-linear-135 from-brand-tint to-card',
      className,
    )}
    style={{ borderColor: source === 'google' ? 'var(--border)' : undefined }}
  >
    <span
      className={cn(
        'absolute start-2.5 top-2 z-2 rounded-full px-2 py-0.5 text-[9.5px] font-extrabold',
        source === 'google'
          ? 'border border-border bg-card text-muted-foreground'
          : 'bg-brand text-white',
      )}
    >
      {source === 'google' ? 'Google Ads' : 'من خلالنا'}
    </span>
    <span className="absolute end-2.5 top-2 z-2 text-[10px] font-bold tracking-wide text-muted-foreground opacity-80">
      إعلان
    </span>
    <div className={cn('px-3', source === 'house' ? 'text-brand-deep' : 'text-ink-soft')}>
      <div className="text-sm font-bold">مساحة إعلانية {size}</div>
      {name && <div className="mt-0.5 text-xs font-medium text-muted-foreground">{name}</div>}
    </div>
  </div>
)

/** إعلان أصلي داخل التدفّق (يُباع مباشرة) */
export const NativeAd: React.FC<{
  title: string
  sponsor: string
  cta?: string
  className?: string
}> = ({ title, sponsor, cta = 'اكتشف العرض', className }) => (
  <div
    className={cn(
      'grid items-center gap-4 rounded-[14px] border border-brand/30 bg-linear-135 from-brand-tint/60 to-card p-3.5 shadow-sm sm:grid-cols-[230px_1fr]',
      className,
    )}
  >
    <div className="aspect-16/10 overflow-hidden rounded-[9px] bg-linear-140 from-[#2f6b8a] to-[#123040]" />
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="self-start rounded-full border border-brand/30 bg-card px-2.5 py-0.5 text-[10.5px] font-extrabold text-brand-deep">
        محتوى مدعوم · من خلالنا
      </span>
      <h3 className="text-pretty font-serif text-xl font-extrabold leading-[1.35]">{title}</h3>
      <span className="text-[12.5px] font-medium text-muted-foreground">برعاية: {sponsor}</span>
      <button className="mt-1 self-start rounded-full bg-brand px-4 py-2 text-[13.5px] font-bold text-white transition hover:bg-brand-deep">
        {cta} ←
      </button>
    </div>
  </div>
)
