'use client'

import React from 'react'

import './cells.scss'

type RowData = { _status?: string; publishedAt?: string | null }

/** شارة حالة الخبر — منشور / مسودة / مجدول */
export const StatusCell: React.FC<{ cellData?: string; rowData?: RowData }> = ({
  cellData,
  rowData,
}) => {
  const status = cellData ?? rowData?._status ?? 'draft'
  const publishedAt = rowData?.publishedAt

  // منشور بتاريخ مستقبلي = مجدول
  const isScheduled =
    status === 'published' && publishedAt && new Date(publishedAt).getTime() > Date.now()

  if (isScheduled) return <span className="ah-badge ah-badge--scheduled">مجدول</span>
  if (status === 'published') return <span className="ah-badge ah-badge--ok">منشور</span>
  return <span className="ah-badge ah-badge--draft">مسودة</span>
}

export default StatusCell
