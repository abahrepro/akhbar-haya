'use client'

import React from 'react'

import { Badge, TypeBadge } from '@/components/AdminUI/Badge'

type RowData = {
  title?: string
  heroImage?: { url?: string; sizes?: { thumbnail?: { url?: string } } } | number | null
  breaking?: boolean | null
  featured?: boolean | null
  type?: string | null
}

/** خلية العنوان: صورة مصغّرة + العنوان + شارات */
export const TitleCell: React.FC<{ cellData?: string; rowData?: RowData }> = ({
  cellData,
  rowData,
}) => {
  const row = rowData ?? {}
  const hero = typeof row.heroImage === 'object' && row.heroImage !== null ? row.heroImage : null
  const thumb = hero?.sizes?.thumbnail?.url ?? hero?.url ?? null

  return (
    <div className="ah flex min-w-0 items-center gap-3">
      <span className="h-9 w-13 shrink-0 overflow-hidden rounded-lg bg-[var(--ah-line)]">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <span className="block size-full bg-gradient-to-br from-[var(--ah-brand)] to-[var(--ah-brand-deep)] opacity-35" />
        )}
      </span>

      <span className="flex min-w-0 flex-col gap-1">
        <span className="line-clamp-2 font-bold leading-snug">{cellData || '(بدون عنوان)'}</span>
        {(row.breaking || row.featured || row.type) && (
          <span className="flex flex-wrap gap-1">
            {row.breaking && <Badge tone="alert">عاجل</Badge>}
            {row.featured && <Badge tone="gold">مميّز</Badge>}
            <TypeBadge type={row.type} />
          </span>
        )}
      </span>
    </div>
  )
}

export default TitleCell
