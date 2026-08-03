import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

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

/** إجراءات وعدّادات أعلى الشريط الجانبي */
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
    { label: 'اليوم', n: today.totalDocs, href: '/admin/collections/posts', color: 'var(--ah-brand)' },
    {
      label: 'مسودات',
      n: drafts.totalDocs,
      href: '/admin/collections/posts?where[_status][equals]=draft',
      color: 'var(--ah-gold)',
    },
    {
      label: 'عاجل',
      n: breaking.totalDocs,
      href: '/admin/collections/posts?where[breaking][equals]=true',
      color: 'var(--ah-alert)',
    },
  ]

  return (
    <div className="ah mb-3 flex flex-col gap-2.5 border-b border-[var(--ah-line)] pb-4">
      <a
        href="/admin/collections/posts/create"
        className="flex items-center justify-center gap-1.5 rounded-[10px] bg-[var(--ah-brand)] px-4 py-2.5 text-sm font-extrabold text-white no-underline transition-all hover:-translate-y-px hover:bg-[var(--ah-brand-deep)]"
      >
        <span className="text-base leading-none">+</span>
        خبر جديد
      </a>

      <div className="grid grid-cols-3 gap-1.5">
        {counters.map((c) => (
          <a
            key={c.label}
            href={c.href}
            className="flex flex-col items-center gap-0.5 rounded-[9px] border border-[var(--ah-line)] bg-[var(--ah-surface-2)] px-1 py-2 no-underline transition-colors hover:border-[var(--ah-brand)]"
          >
            <span className="text-[19px] font-extrabold leading-none tabular-nums" style={{ color: c.color }}>
              {c.n}
            </span>
            <span className="text-[11px] font-semibold text-[var(--ah-muted)]">{c.label}</span>
          </a>
        ))}
      </div>

      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-[9px] border border-transparent py-1.5 text-center text-[13px] font-bold text-[var(--ah-muted)] no-underline transition-colors hover:border-[var(--ah-line)] hover:text-[var(--ah-text)]"
      >
        معاينة الموقع ↗
      </a>
    </div>
  )
}

export default BeforeNavLinks
