'use client'

import React from 'react'

import './cells.scss'

type RowData = {
  id?: number | string
  title?: string
  heroImage?: { url?: string; sizes?: { thumbnail?: { url?: string } } } | number | null
  breaking?: boolean | null
  featured?: boolean | null
  type?: string | null
  _status?: string
}

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  photo: { label: '📷 صورة وخبر', cls: 'photo' },
  video: { label: '🎥 فيديو', cls: 'video' },
  opinion: { label: '✍️ رأي', cls: 'opinion' },
}

/**
 * خلية العنوان في جدول الأخبار:
 * صورة مصغّرة + العنوان + شارات (عاجل / مميّز / النوع).
 */
export const TitleCell: React.FC<{ cellData?: string; rowData?: RowData }> = ({
  cellData,
  rowData,
}) => {
  const row = rowData ?? {}
  const hero = typeof row.heroImage === 'object' && row.heroImage !== null ? row.heroImage : null
  const thumb = hero?.sizes?.thumbnail?.url ?? hero?.url ?? null
  const typeBadge = row.type ? TYPE_BADGE[row.type] : undefined

  return (
    <div className="ah-cell-title">
      <span className="ah-cell-title__thumb">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" loading="lazy" />
        ) : (
          <span className="ah-cell-title__thumb-ph" />
        )}
      </span>

      <span className="ah-cell-title__body">
        <span className="ah-cell-title__text">{cellData || '(بدون عنوان)'}</span>
        {(row.breaking || row.featured || typeBadge) && (
          <span className="ah-cell-title__badges">
            {row.breaking && <span className="ah-badge ah-badge--breaking">عاجل</span>}
            {row.featured && <span className="ah-badge ah-badge--star">مميّز</span>}
            {typeBadge && (
              <span className={`ah-badge ah-badge--${typeBadge.cls}`}>{typeBadge.label}</span>
            )}
          </span>
        )}
      </span>
    </div>
  )
}

export default TitleCell
