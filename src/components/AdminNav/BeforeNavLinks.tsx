import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import './nav.scss'

const baseClass = 'ah-nav'

/** بداية اليوم بتوقيت عمّان */
const startOfTodayISO = (): string => {
  const d = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Amman',
  }).format(new Date())
  return `${d}T00:00:00.000Z`
}

/**
 * يُعرض أعلى الشريط الجانبي:
 * زر إنشاء خبر + عدّادات حيّة تنقل مباشرة للقوائم المفلترة.
 */
const BeforeNavLinks: React.FC = async () => {
  const payload = await getPayload({ config: configPromise })

  const [drafts, today, breaking] = await Promise.all([
    payload.count({ collection: 'posts', where: { _status: { equals: 'draft' } } }),
    payload.count({
      collection: 'posts',
      where: {
        and: [
          { _status: { equals: 'published' } },
          { publishedAt: { greater_than_equal: startOfTodayISO() } },
        ],
      },
    }),
    payload.count({
      collection: 'posts',
      where: { and: [{ breaking: { equals: true } }, { _status: { equals: 'published' } }] },
    }),
  ])

  const counters = [
    {
      label: 'منشور اليوم',
      n: today.totalDocs,
      href: '/admin/collections/posts',
      tone: 'ok' as const,
    },
    {
      label: 'مسودات',
      n: drafts.totalDocs,
      href: '/admin/collections/posts?where[_status][equals]=draft',
      tone: 'draft' as const,
    },
    {
      label: 'عاجل',
      n: breaking.totalDocs,
      href: '/admin/collections/posts?where[breaking][equals]=true',
      tone: 'breaking' as const,
    },
  ]

  return (
    <div className={baseClass}>
      <a className={`${baseClass}__new`} href="/admin/collections/posts/create">
        <span className={`${baseClass}__plus`}>+</span>
        خبر جديد
      </a>

      <div className={`${baseClass}__counters`}>
        {counters.map((c) => (
          <a key={c.label} href={c.href} className={`${baseClass}__counter`}>
            <span className={`${baseClass}__n ${baseClass}__n--${c.tone}`}>{c.n}</span>
            <span className={`${baseClass}__label`}>{c.label}</span>
          </a>
        ))}
      </div>

      <a
        className={`${baseClass}__site`}
        href="/"
        target="_blank"
        rel="noopener noreferrer"
      >
        🌐 معاينة الموقع
      </a>
    </div>
  )
}

export default BeforeNavLinks
