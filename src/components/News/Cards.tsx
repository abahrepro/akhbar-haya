import Link from 'next/link'
import React from 'react'

import { cn } from '@/utilities/ui'
import {
  BreakingChip,
  CategoryChip,
  DurationChip,
  NewsImage,
  PlayBadge,
  TimeStamp,
} from './Bits'
import type { NewsItem } from './types'

/* ============ البطاقة الرئيسية الكبيرة (الهيرو) ============ */
export const LeadCard: React.FC<{ item: NewsItem }> = ({ item }) => (
  <Link
    href={item.href}
    className="group relative block min-h-[460px] overflow-hidden rounded-[14px] shadow-sm transition hover:-translate-y-0.5 lg:min-h-[496px] @container"
  >
    <div className="absolute inset-0">
      <NewsImage item={item} size="medium" />
    </div>
    {item.breaking && <BreakingChip />}
    {item.type === 'video' && <PlayBadge size="lg" />}
    <div className="absolute inset-x-0 bottom-0 z-3 bg-linear-to-t from-[rgba(6,14,9,.94)] via-[rgba(6,14,9,.55)] to-transparent p-6 sm:p-7">
      {item.category && (
        <span className="mb-3 inline-flex rounded-full bg-brand px-2.5 py-1 text-[11.5px] font-extrabold text-white">
          {item.category.title}
        </span>
      )}
      <h2 className="text-pretty font-serif text-[clamp(25px,6.4cqi,48px)] font-black leading-[1.22] text-white">
        {item.title}
      </h2>
      <TimeStamp date={item.publishedAt} className="mt-3" onDark />
    </div>
  </Link>
)

/**
 * بطاقة هيرو جانبية.
 * على الهاتف تظهر بطاقتان جنب بعض بعرض ~١٦٥ بكسل، فارتفاع ٢٤١ يجعلها نحيلة جداً.
 */
export const HeroSideCard: React.FC<{ item: NewsItem }> = ({ item }) => (
  <Link
    href={item.href}
    className="group relative block min-h-[146px] overflow-hidden rounded-[14px] shadow-sm transition hover:-translate-y-0.5 sm:min-h-[241px] @container"
  >
    <div className="absolute inset-0">
      <NewsImage item={item} size="medium" />
    </div>
    {item.category && <CategoryChip label={item.category.title} color={item.category.color} />}
    {item.type === 'video' && <PlayBadge />}
    <div className="absolute inset-x-0 bottom-0 z-3 bg-linear-to-t from-[rgba(6,14,9,.94)] via-[rgba(6,14,9,.35)] to-transparent p-3.5">
      <h3 className="line-clamp-3 text-pretty font-serif text-[clamp(14px,7.4cqi,22px)] font-bold leading-[1.32] text-white">
        {item.title}
      </h3>
    </div>
  </Link>
)

/* ============ بطاقة قياسية بصورة أعلاها ============ */
export const NewsCard: React.FC<{ item: NewsItem; showExcerpt?: boolean }> = ({
  item,
  showExcerpt = false,
}) => (
  <Link
    href={item.href}
    className="group flex flex-col overflow-hidden rounded-[14px] border border-border bg-card shadow-sm transition hover:-translate-y-0.5 @container"
  >
    <div className="relative aspect-16/10 overflow-hidden">
      <NewsImage item={item} size="medium" />
      {item.category && <CategoryChip label={item.category.title} color={item.category.color} />}
      {item.breaking && <BreakingChip />}
      {item.type === 'video' && (
        <>
          <PlayBadge />
          <DurationChip duration={item.videoDuration} />
        </>
      )}
    </div>
    <div className="flex flex-1 flex-col gap-2 p-3.5">
      <h3 className="text-pretty font-serif text-[clamp(15.5px,6.8cqi,21px)] font-bold leading-[1.38] transition group-hover:text-brand">
        {item.title}
      </h3>
      {showExcerpt && item.excerpt && (
        <p className="line-clamp-2 text-[13.5px] leading-relaxed text-ink-soft">{item.excerpt}</p>
      )}
      <TimeStamp date={item.publishedAt} className="mt-auto pt-1" />
    </div>
  </Link>
)

/* ============ بطاقة مميّزة (صورة + مقتطف) ============ */
export const FeatureCard: React.FC<{ item: NewsItem }> = ({ item }) => (
  <Link
    href={item.href}
    className="group flex flex-col overflow-hidden rounded-[14px] border border-border bg-card shadow-sm transition hover:-translate-y-0.5 @container"
  >
    <div className="relative aspect-16/9 overflow-hidden">
      <NewsImage item={item} size="medium" />
      {item.category && <CategoryChip label={item.category.title} color={item.category.color} />}
      {item.type === 'video' && <PlayBadge />}
    </div>
    <div className="flex flex-col gap-2.5 p-4">
      <h3 className="text-pretty font-serif text-[clamp(18px,5.4cqi,28px)] font-extrabold leading-[1.3] transition group-hover:text-brand">
        {item.title}
      </h3>
      {item.excerpt && (
        <p className="line-clamp-2 text-[14.5px] leading-[1.7] text-ink-soft">{item.excerpt}</p>
      )}
      <div className="mt-1 flex items-center justify-between">
        <TimeStamp date={item.publishedAt} />
        <span className="inline-flex items-center gap-1.5 text-[13.5px] font-bold text-brand">
          اقرأ المزيد
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5" aria-hidden="true">
            <path d="M15 5l-1.4 1.4L18.2 11H4v2h14.2l-4.6 4.6L15 19l7-7-7-7z" />
          </svg>
        </span>
      </div>
    </div>
  </Link>
)

/* ============ صف قائمة (صورة مصغّرة + عنوان) ============ */
export const ListRow: React.FC<{ item: NewsItem; last?: boolean }> = ({ item, last }) => (
  <Link
    href={item.href}
    className={cn('group flex gap-3.5 py-3.5', !last && 'border-b border-border')}
  >
    <div className="relative h-[68px] w-24 shrink-0 overflow-hidden rounded-[9px]">
      <NewsImage item={item} size="thumbnail" />
      {item.type === 'video' && <PlayBadge />}
    </div>
    <div className="flex min-w-0 flex-col gap-1.5">
      <h4 className="text-pretty font-serif text-[15.5px] font-bold leading-[1.5] transition group-hover:text-brand">
        {item.title}
      </h4>
      <TimeStamp date={item.publishedAt} />
    </div>
  </Link>
)

/* ============ بطاقة صورة طويلة (صورة وخبر) ============ */
export const PhotoCard: React.FC<{ item: NewsItem }> = ({ item }) => (
  <Link
    href={item.href}
    className="group relative block min-h-[310px] overflow-hidden rounded-[14px] shadow-sm transition hover:-translate-y-0.5 @container"
  >
    <div className="absolute inset-0">
      <NewsImage item={item} size="medium" />
    </div>
    {item.category && <CategoryChip label={item.category.title} color={item.category.color} />}
    <div className="absolute inset-x-0 bottom-0 z-3 bg-linear-to-t from-[rgba(6,14,9,.95)] via-[rgba(6,14,9,.4)] to-transparent p-4">
      <h3 className="text-pretty font-serif text-[clamp(16px,7cqi,23px)] font-bold leading-[1.32] text-white">
        {item.title}
      </h3>
      <TimeStamp date={item.publishedAt} className="mt-2" onDark />
    </div>
  </Link>
)

/* ============ عنصر بنتو ============ */
export const BentoCard: React.FC<{ item: NewsItem; large?: boolean }> = ({ item, large }) => (
  <Link
    href={item.href}
    className={cn(
      'group relative block overflow-hidden rounded-[14px] shadow-sm transition hover:-translate-y-0.5 @container',
      // العريضة تملأ عرض الشبكة وصفّين — على الهاتف تصير كالهيرو والأربع الباقية ٢×٢ تحتها
      large && 'col-span-2 row-span-2',
    )}
  >
    <div className="absolute inset-0">
      <NewsImage item={item} size={large ? 'medium' : 'small'} />
    </div>
    {item.category && <CategoryChip label={item.category.title} color={item.category.color} />}
    {item.type === 'video' && <PlayBadge />}
    <div className="absolute inset-x-0 bottom-0 z-3 bg-linear-to-t from-[rgba(6,14,9,.94)] via-[rgba(6,14,9,.25)] to-transparent p-3.5">
      <h4 className="text-pretty font-serif text-[clamp(14.5px,6.2cqi,23px)] font-bold leading-[1.3] text-white">
        {item.title}
      </h4>
      {large && <TimeStamp date={item.publishedAt} className="mt-2" onDark />}
    </div>
  </Link>
)

/* ============ صف رأي/مقال ============ */
export const OpinionRow: React.FC<{ item: NewsItem; last?: boolean }> = ({ item, last }) => (
  <Link
    href={item.href}
    className={cn('group flex items-center gap-3.5 py-4', !last && 'border-b border-border')}
  >
    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-linear-145 from-[#6d4aa7] to-[#4a2f78] text-white">
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-6" aria-hidden="true">
        <path d="M5 4h11l3 3v13H5V4zm2 2v12h10V8h-3V6H7zm2 4h6v1.5H9V10zm0 3h6v1.5H9V13z" />
      </svg>
    </span>
    <div className="min-w-0">
      <h4 className="text-pretty font-serif text-[16.5px] font-bold leading-[1.45] transition group-hover:text-brand">
        {item.title}
      </h4>
      <TimeStamp date={item.publishedAt} className="mt-1" />
    </div>
  </Link>
)
