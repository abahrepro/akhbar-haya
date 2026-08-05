'use client'

import React, { useCallback, useEffect, useState } from 'react'

import type { Media as MediaType } from '@/payload-types'
import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'

type Props = {
  images?: (MediaType | number | string)[] | null
  layout?: ('grid' | 'carousel') | null
  caption?: string | null
  className?: string
}

/** ألبوم صور داخل المتن — شبكة أو شريط، مع عارض ملء الشاشة */
export const PhotoGalleryBlock: React.FC<Props> = ({ images, layout, caption, className }) => {
  const items = (images ?? []).filter((i): i is MediaType => typeof i === 'object' && i !== null)
  const [open, setOpen] = useState<number | null>(null)

  const move = useCallback(
    (dir: 1 | -1) => setOpen((i) => (i === null ? null : (i + dir + items.length) % items.length)),
    [items.length],
  )

  // التنقّل بلوحة المفاتيح داخل العارض
  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
      // في RTL يتقدّم السهم الأيسر للأمام
      if (e.key === 'ArrowLeft') move(1)
      if (e.key === 'ArrowRight') move(-1)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, move])

  if (items.length === 0) return null

  return (
    <figure className={cn('my-7 not-prose', className)}>
      <div
        className={cn(
          layout === 'carousel'
            ? 'flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2'
            : items.length === 1
              ? 'grid grid-cols-1 gap-3'
              : 'grid grid-cols-2 gap-3 md:grid-cols-3',
        )}
      >
        {items.map((img, i) => (
          <button
            key={img.id ?? i}
            onClick={() => setOpen(i)}
            aria-label={`تكبير الصورة ${i + 1} من ${items.length}`}
            className={cn(
              'group relative overflow-hidden rounded-[12px] transition hover:opacity-95',
              layout === 'carousel'
                ? 'aspect-4/3 w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-[32%]'
                : 'aspect-4/3 w-full',
            )}
          >
            <Media resource={img} size="small" fill imgClassName="object-cover" />
            <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[12px] font-bold text-white">
              {i + 1}/{items.length}
            </span>
          </button>
        ))}
      </div>

      {caption && (
        <figcaption className="mt-2.5 border-s-[3px] border-brand ps-2.5 text-[14px] text-muted-foreground">
          {caption}
        </figcaption>
      )}

      {/* عارض ملء الشاشة */}
      {open !== null && (
        <div
          onClick={() => setOpen(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={() => setOpen(null)}
            aria-label="إغلاق"
            className="absolute end-4 top-4 grid size-11 place-items-center rounded-full bg-white/15 text-2xl text-white"
          >
            ✕
          </button>

          {items.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  move(-1)
                }}
                aria-label="السابق"
                className="absolute end-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-2xl text-white"
              >
                ›
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  move(1)
                }}
                aria-label="التالي"
                className="absolute start-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-2xl text-white"
              >
                ‹
              </button>
            </>
          )}

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[85vh] w-full max-w-[1100px]"
          >
            <Media resource={items[open]} size="medium" imgClassName="mx-auto max-h-[85vh] w-auto object-contain" />
          </div>

          <span className="absolute bottom-5 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-bold text-white">
            {open + 1} / {items.length}
          </span>
        </div>
      )}
    </figure>
  )
}
