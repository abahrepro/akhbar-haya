'use client'

import React from 'react'

/** تاريخ النشر بصيغة عربية على سطرين */
export const DateCell: React.FC<{ cellData?: string | null }> = ({ cellData }) => {
  if (!cellData) return <span className="ah text-[var(--ah-muted)] opacity-50">—</span>

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
    <span className="ah flex flex-col gap-0.5 whitespace-nowrap">
      <span className="text-[13px] font-semibold">{date}</span>
      <span className="text-[11px] tabular-nums text-[var(--ah-muted)]">{time}</span>
    </span>
  )
}

export default DateCell
