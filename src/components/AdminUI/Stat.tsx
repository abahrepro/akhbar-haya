import React from 'react'

import { cn } from '@/utilities/ui'

/** بطاقة رقم إحصائي قابلة للنقر */
export const Stat: React.FC<{
  n: number
  label: string
  href?: string
  tone?: 'default' | 'gold' | 'alert'
}> = ({ n, label, href, tone = 'default' }) => {
  const numberColor =
    tone === 'gold'
      ? 'text-[var(--ah-gold)]'
      : tone === 'alert'
        ? 'text-[var(--ah-alert)]'
        : 'text-[var(--ah-brand)]'

  const body = (
    <>
      <span className={cn('text-[28px] font-extrabold leading-none tabular-nums', numberColor)}>
        {n}
      </span>
      <span className="text-[13px] font-semibold text-[var(--ah-muted)]">{label}</span>
    </>
  )

  const classes =
    'flex flex-col gap-1 rounded-xl border border-[var(--ah-line)] bg-[var(--ah-surface-2)] px-4 py-4 no-underline transition-all hover:-translate-y-0.5 hover:border-[var(--ah-brand)]'

  if (!href) return <div className={classes}>{body}</div>

  return (
    <a href={href} className={classes}>
      {body}
    </a>
  )
}
