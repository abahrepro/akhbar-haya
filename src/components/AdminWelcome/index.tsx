import type { ServerProps } from 'payload'
import React from 'react'

import type { Post } from '@/payload-types'
import { postHref } from '@/utilities/postUrl'
import { PublishChart, type DayPoint } from './PublishChart'

/**
 * لوحة بداية غرفة الأخبار — تظهر أعلى لوحة تحكّم Payload.
 *
 * المحرّر يحتاج عند الدخول: أن يكتب، أن يكمل مسودّاته، وأن يرى إيقاع
 * النشر بنظرة. الأرقام كلها من قاعدة البيانات الحيّة عبر صلاحيات
 * المستخدم نفسه — لا يرى إلا ما يحقّ له.
 */

const DAYS = 14

export const AdminWelcome: React.FC<ServerProps> = async ({ payload, user }) => {
  const now = new Date()
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dayStart = (offset: number) => {
    const d = startOf(now)
    d.setDate(d.getDate() - offset)
    return d
  }

  const countBetween = (from: Date, to?: Date) =>
    payload.count({
      collection: 'posts',
      where: {
        and: [
          { _status: { equals: 'published' } },
          { publishedAt: { greater_than_equal: from.toISOString() } },
          ...(to ? [{ publishedAt: { less_than: to.toISOString() } }] : []),
        ],
      },
      overrideAccess: false,
      user,
    })

  const [series, drafts, total, latest] = await Promise.all([
    // خبر كل يوم من آخر ١٤ يوماً — استعلامات عدّ متوازية على عمود مفهرس
    Promise.all(
      Array.from({ length: DAYS }, (_, i) => {
        const offset = DAYS - 1 - i
        return countBetween(dayStart(offset), dayStart(offset - 1))
      }),
    ),
    payload.count({
      collection: 'posts',
      where: { _status: { equals: 'draft' } },
      overrideAccess: false,
      user,
    }),
    payload.count({
      collection: 'posts',
      where: { _status: { equals: 'published' } },
      overrideAccess: false,
      user,
    }),
    payload.find({
      collection: 'posts',
      where: { _status: { equals: 'published' } },
      sort: '-publishedAt',
      limit: 6,
      depth: 0,
      select: { title: true, slug: true, wpId: true, publishedAt: true },
      overrideAccess: false,
      user,
    }),
  ])

  const fmtDay = new Intl.DateTimeFormat('ar', { day: 'numeric', month: 'numeric' })
  const chartData: DayPoint[] = series.map((r, i) => ({
    label: fmtDay.format(dayStart(DAYS - 1 - i)),
    count: r.totalDocs,
  }))

  const today = series[DAYS - 1].totalDocs
  const yesterday = series[DAYS - 2].totalDocs
  const week = series.slice(-7).reduce((a, r) => a + r.totalDocs, 0)
  const delta = today - yesterday

  const ar = (n: number) => n.toLocaleString('ar-EG')
  const name = (user && 'name' in user && user.name) || 'بك'
  const siteURL = process.env.NEXT_PUBLIC_SERVER_URL || '/'

  const fmtTime = new Intl.DateTimeFormat('ar', { hour: 'numeric', minute: '2-digit' })

  return (
    <div className="ah-welcome">
      <h2 className="ah-welcome__title">أهلاً {String(name)} 👋</h2>

      {/* ===== إجراءات سريعة ===== */}
      <div className="ah-welcome__actions">
        <a
          href="/admin/collections/posts/create"
          className="ah-welcome__action ah-welcome__action--primary"
        >
          <span className="ah-welcome__action-icon">＋</span>
          <span>
            <strong>خبر جديد</strong>
            <small>اكتب وانشر مباشرة</small>
          </span>
        </a>
        <a href="/admin/collections/posts?where[_status][equals]=draft" className="ah-welcome__action">
          <span className="ah-welcome__action-icon">📝</span>
          <span>
            <strong>المسودّات</strong>
            <small>{ar(drafts.totalDocs)} مسودّة بانتظار الإكمال</small>
          </span>
        </a>
        <a href="/admin/collections/media" className="ah-welcome__action">
          <span className="ah-welcome__action-icon">🖼</span>
          <span>
            <strong>الوسائط</strong>
            <small>رفع الصور وإدارتها</small>
          </span>
        </a>
        <a href={siteURL} target="_blank" rel="noopener" className="ah-welcome__action">
          <span className="ah-welcome__action-icon">🌐</span>
          <span>
            <strong>عرض الموقع</strong>
            <small>كما يراه القارئ الآن</small>
          </span>
        </a>
      </div>

      {/* ===== أرقام اليوم ===== */}
      <div className="ah-stats">
        <div className="ah-stat">
          <span className="ah-stat__label">نُشر اليوم</span>
          <strong className="ah-stat__value">{ar(today)}</strong>
          {delta !== 0 && (
            <span className={`ah-stat__delta ${delta > 0 ? 'is-up' : 'is-down'}`}>
              {delta > 0 ? '▲' : '▼'} {ar(Math.abs(delta))} عن الأمس
            </span>
          )}
        </div>
        <div className="ah-stat">
          <span className="ah-stat__label">آخر ٧ أيام</span>
          <strong className="ah-stat__value">{ar(week)}</strong>
        </div>
        <div className="ah-stat">
          <span className="ah-stat__label">مسودّات</span>
          <strong className="ah-stat__value">{ar(drafts.totalDocs)}</strong>
        </div>
        <div className="ah-stat">
          <span className="ah-stat__label">الأرشيف المنشور</span>
          <strong className="ah-stat__value">{ar(total.totalDocs)}</strong>
        </div>
      </div>

      {/* ===== المخطط + آخر المنشور ===== */}
      <div className="ah-dash">
        <section className="ah-card">
          <h3 className="ah-card__title">إيقاع النشر — آخر ١٤ يوماً</h3>
          <PublishChart data={chartData} />
        </section>

        <section className="ah-card">
          <h3 className="ah-card__title">آخر ما نُشر</h3>
          <ul className="ah-latest">
            {(latest.docs as Post[]).map((p) => (
              <li key={p.id} className="ah-latest__row">
                <a href={`/admin/collections/posts/${p.id}`} className="ah-latest__title">
                  {p.title}
                </a>
                <span className="ah-latest__meta">
                  {p.publishedAt ? fmtTime.format(new Date(p.publishedAt)) : ''}
                  {' · '}
                  <a
                    href={`${siteURL}${encodeURI(postHref(p))}`}
                    target="_blank"
                    rel="noopener"
                    className="ah-latest__view"
                  >
                    عرض
                  </a>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
