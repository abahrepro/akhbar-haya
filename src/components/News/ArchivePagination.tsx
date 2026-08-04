import Link from 'next/link'
import React from 'react'

import { cn } from '@/utilities/ui'

/**
 * ترقيم صفحات الأرشيف.
 *
 * روابط حقيقية (‏<a>‎) لا أزرار: تفهرسها محرّكات البحث، وتُفتح في تبويب جديد،
 * وتعمل بلا جافاسكربت. مكوّن خادم — لا يضيف شيئاً لحزمة العميل.
 */
export const ArchivePagination: React.FC<{
  page: number
  totalPages: number
  /** جذر المسار بلا ترقيم، مثال: /category/رياضة */
  basePath: string
  className?: string
}> = ({ page, totalPages, basePath, className }) => {
  if (totalPages <= 1) return null

  // الصفحة الأولى تبقى على المسار الجذر — لا نريد نسختين لنفس المحتوى
  const href = (n: number) => (n === 1 ? basePath : `${basePath}/page/${n}`)

  // نافذة حول الصفحة الحالية، مع الأولى والأخيرة دائماً
  const nums = new Set<number>([1, totalPages])
  for (let i = page - 2; i <= page + 2; i++) {
    if (i >= 1 && i <= totalPages) nums.add(i)
  }
  const pages = [...nums].sort((a, b) => a - b)

  const box =
    'inline-flex h-10 min-w-10 items-center justify-center rounded-[10px] border px-3 text-[14px] font-bold transition'
  const idle = 'border-border bg-card text-ink-soft hover:border-brand hover:text-brand'
  const off = 'border-border bg-secondary text-muted-foreground opacity-45'

  return (
    <nav
      aria-label="تنقّل بين الصفحات"
      className={cn('mt-10 flex flex-col items-center gap-3', className)}
    >
      <div className="flex flex-wrap items-center justify-center gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} rel="prev" className={cn(box, idle)}>
            السابق
          </Link>
        ) : (
          <span className={cn(box, off)} aria-disabled="true">
            السابق
          </span>
        )}

        {pages.map((n, i) => {
          const gap = i > 0 && n - pages[i - 1] > 1
          return (
            <React.Fragment key={n}>
              {gap && (
                <span className="px-1 text-muted-foreground" aria-hidden="true">
                  …
                </span>
              )}
              {n === page ? (
                <span aria-current="page" className={cn(box, 'border-brand bg-brand text-white')}>
                  {n.toLocaleString('ar-EG')}
                </span>
              ) : (
                <Link href={href(n)} className={cn(box, idle)}>
                  {n.toLocaleString('ar-EG')}
                </Link>
              )}
            </React.Fragment>
          )
        })}

        {page < totalPages ? (
          <Link href={href(page + 1)} rel="next" className={cn(box, idle)}>
            التالي
          </Link>
        ) : (
          <span className={cn(box, off)} aria-disabled="true">
            التالي
          </span>
        )}
      </div>

      <p className="text-[13px] font-semibold text-muted-foreground">
        صفحة {page.toLocaleString('ar-EG')} من {totalPages.toLocaleString('ar-EG')}
      </p>
    </nav>
  )
}
