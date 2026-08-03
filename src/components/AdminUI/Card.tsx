import React from 'react'

import { cn } from '@/utilities/ui'

/** بطاقة بيضاء بظلّ ناعم — بلا حدود قاسية */
export const Card: React.FC<{
  children: React.ReactNode
  className?: string
  padded?: boolean
}> = ({ children, className, padded = false }) => (
  <section
    className={cn(
      'overflow-hidden rounded-2xl bg-[var(--ah-card)] shadow-[0_1px_2px_rgba(16,24,40,.04),0_8px_24px_-12px_rgba(16,24,40,.10)]',
      padded && 'p-5',
      className,
    )}
  >
    {children}
  </section>
)

/** ترويسة بطاقة — بلا خط فاصل، تعتمد المسافة للفصل */
export const CardHeader: React.FC<{
  title: string
  href?: string
  hint?: string
  action?: React.ReactNode
  className?: string
}> = ({ title, href, hint, action, className }) => (
  <div className={cn('flex items-center justify-between gap-3 px-5 pb-1 pt-5', className)}>
    <div className="min-w-0">
      <h3 className="m-0 text-[16px] font-extrabold tracking-tight text-[var(--ah-text)]">
        {title}
      </h3>
      {hint && <p className="m-0 mt-0.5 text-[12.5px] text-[var(--ah-muted)]">{hint}</p>}
    </div>
    {action}
    {href && !action && (
      <a
        href={href}
        className="shrink-0 text-[12.5px] font-bold text-[var(--ah-brand)] no-underline hover:underline"
      >
        عرض الكل
      </a>
    )}
  </div>
)
