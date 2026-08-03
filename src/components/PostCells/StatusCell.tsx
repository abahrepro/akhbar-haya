'use client'

import React from 'react'

import { StatusBadge } from '@/components/AdminUI/Badge'

type RowData = { _status?: string; publishedAt?: string | null }

/** شارة حالة الخبر — منشور / مسودة / مجدول */
export const StatusCell: React.FC<{ cellData?: string; rowData?: RowData }> = ({
  cellData,
  rowData,
}) => (
  <span className="ah">
    <StatusBadge status={cellData ?? rowData?._status} publishedAt={rowData?.publishedAt} />
  </span>
)

export default StatusCell
