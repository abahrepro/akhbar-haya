import React from 'react'

import { ACCENT, IconTile, type Accent } from './IconTile'

/** بطاقة رقم بأيقونة ملوّنة وظلّ ناعم */
export const Stat: React.FC<{
  n: number
  label: string
  hint?: string
  href?: string
  accent?: Accent
  icon: React.ReactNode
}> = ({ n, label, hint, href, accent = 'green', icon }) => {
  const c = ACCENT[accent]

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <IconTile accent={accent}>{icon}</IconTile>
        {hint && (
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-extrabold"
            style={{ background: c.bg, color: c.fg }}
          >
            {hint}
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className="text-[30px] font-extrabold leading-none tabular-nums text-[var(--ah-text)]">
          {n}
        </div>
        <div className="mt-1.5 text-[13px] font-semibold text-[var(--ah-muted)]">{label}</div>
      </div>
    </>
  )

  const classes =
    'block rounded-2xl bg-[var(--ah-card)] p-4 no-underline shadow-[0_1px_2px_rgba(16,24,40,.04),0_8px_24px_-12px_rgba(16,24,40,.10)] transition-all hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(16,24,40,.06),0_12px_28px_-12px_rgba(16,24,40,.16)]'

  if (!href) return <div className={classes}>{body}</div>
  return (
    <a href={href} className={classes}>
      {body}
    </a>
  )
}
