'use client'

import { useEffect } from 'react'

/** يسجّل قراءة واحدة للخبر — مرة لكل جلسة تصفّح كي لا يضخّم التحديث الأرقام */
export const ViewPing: React.FC<{ id: number | string }> = ({ id }) => {
  useEffect(() => {
    const key = `ah-viewed-${id}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    fetch('/next/views', {
      method: 'POST',
      body: JSON.stringify({ id }),
      keepalive: true,
    }).catch(() => {})
  }, [id])

  return null
}
