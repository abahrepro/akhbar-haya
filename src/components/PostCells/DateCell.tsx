'use client'

import React from 'react'

import './cells.scss'

/** تاريخ النشر بصيغة عربية مقروءة + الوقت النسبي */
export const DateCell: React.FC<{ cellData?: string | null }> = ({ cellData }) => {
  if (!cellData) return <span className="ah-cell-date ah-cell-date--empty">—</span>

  const d = new Date(cellData)
  const date = new Intl.DateTimeFormat('ar-JO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Amman',
  }).format(d)
  const time = new Intl.DateTimeFormat('ar-JO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Amman',
  }).format(d)

  return (
    <span className="ah-cell-date">
      <span className="ah-cell-date__d">{date}</span>
      <span className="ah-cell-date__t">{time}</span>
    </span>
  )
}

export default DateCell
