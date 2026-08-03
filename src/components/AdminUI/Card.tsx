import React from 'react'

import { cn } from '@/utilities/ui'

/** بطاقة موحّدة داخل اللوحة */
export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <section
    className={cn(
      'overflow-hidden rounded-xl border border-[var(--ah-line)] bg-[var(--ah-surface-2)]',
      className,
    )}
  >
    {children}
  </section>
)

/** ترويسة البطاقة مع رابط اختياري */
export const CardHeader: React.FC<{
  title: string
  href?: string
  action?: React.ReactNode
}> = ({ title, href, action }) => (
  <div className="flex items-center justify-between gap-3 border-b border-[var(--ah-line)] px-4 py-3">
    <h3 className="m-0 text-[15px] font-extrabold text-[var(--ah-text)]">{title}</h3>
    {action}
    {href && !action && (
      <a
        href={href}
        className="shrink-0 text-xs font-bold text-[var(--ah-brand)] no-underline hover:underline"
      >
        عرض الكل ←
      </a>
    )}
  </div>
)
