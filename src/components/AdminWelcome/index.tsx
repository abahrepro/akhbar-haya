import type { ServerProps } from 'payload'
import React from 'react'

import type { Post } from '@/payload-types'
import { postHref } from '@/utilities/postUrl'
import { getDashboard } from './data'
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

  const [dash, series, drafts, total, latest] = await Promise.all([
    getDashboard(payload),
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

  /**
   * التسمية تُبنى يدوياً لا بمولّد التواريخ العربي: المولّد يدسّ محرف
   * U+200F بين اليوم والشهر فينقلب ترتيب العرض ويظهر «27/7» بصورة «277/».
   */
  const fmtDay = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`
  const chartData: DayPoint[] = series.map((r, i) => ({
    label: fmtDay(dayStart(DAYS - 1 - i)),
    count: r.totalDocs,
  }))

  const today = series[DAYS - 1].totalDocs
  const yesterday = series[DAYS - 2].totalDocs
  const week = series.slice(-7).reduce((a, r) => a + r.totalDocs, 0)
  const delta = today - yesterday

  /** أرقام لاتينية في لوحة التحكّم — أوضح في القراءة السريعة للإحصاءات */
  const ar = (n: number) => n.toLocaleString('en-US')
  const name = (user && 'name' in user && user.name) || 'بك'
  const siteURL = process.env.NEXT_PUBLIC_SERVER_URL || '/'

  // عربية الكلمات لاتينية الأرقام
  const fmtTime = new Intl.DateTimeFormat('ar-u-nu-latn', { hour: 'numeric', minute: '2-digit' })

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
        <div className="ah-stat">
          <span className="ah-stat__label">أخبار عاجلة نشطة</span>
          <strong className="ah-stat__value">{ar(dash.breakingActive)}</strong>
        </div>
        <div className="ah-stat">
          <span className="ah-stat__label">محرّرون نشروا اليوم</span>
          <strong className="ah-stat__value">{ar(dash.editorsToday)}</strong>
        </div>
        <div className="ah-stat">
          <span className="ah-stat__label">مشاهدات أمس</span>
          <strong className="ah-stat__value">
            {dash.viewsToday === null ? '—' : ar(dash.viewsToday)}
          </strong>
          {dash.viewsDelta !== null && (
            <span className={`ah-stat__delta ${dash.viewsDelta >= 0 ? 'is-up' : 'is-down'}`}>
              {dash.viewsDelta >= 0 ? '▲' : '▼'} {ar(Math.abs(dash.viewsDelta))}٪
            </span>
          )}
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

      {/* ===== الأكثر قراءة + أداء المحرّرين ===== */}
      <div className="ah-dash">
        <section className="ah-card">
          <h3 className="ah-card__title">الأكثر قراءة في الأرشيف</h3>
          {dash.topPosts.length === 0 ? (
            <p className="ah-empty">لا توجد بيانات مشاهدات بعد.</p>
          ) : (
            <table className="ah-table">
              <thead>
                <tr>
                  <th>العنوان</th>
                  <th>القسم</th>
                  <th>المشاهدات</th>
                </tr>
              </thead>
              <tbody>
                {dash.topPosts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <a href={`/admin/collections/posts/${p.id}`}>{p.title}</a>
                    </td>
                    <td>
                      {p.category ? <span className="ah-chip">{p.category}</span> : '—'}
                    </td>
                    <td className="ah-num">{ar(p.views)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="ah-card">
          <h3 className="ah-card__title">أداء المحرّرين</h3>
          {dash.editors.length === 0 ? (
            <p className="ah-empty">لا توجد أخبار منسوبة لمحرّرين بعد.</p>
          ) : (
            <table className="ah-table">
              <thead>
                <tr>
                  <th>المحرّر</th>
                  <th>الأخبار</th>
                  <th>المشاهدات</th>
                </tr>
              </thead>
              <tbody>
                {dash.editors.map((e) => (
                  <tr key={e.name}>
                    <td>{e.name}</td>
                    <td className="ah-num">{ar(e.posts)}</td>
                    <td className="ah-num">{ar(e.views)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      {/* ===== الأقسام + التنبيهات + آخر الصور ===== */}
      <div className="ah-dash ah-dash--three">
        <section className="ah-card">
          <h3 className="ah-card__title">الأقسام الأكثر نشاطاً</h3>
          <ul className="ah-bars">
            {dash.categories.map((c) => {
              const max = dash.categories[0]?.posts || 1
              return (
                <li key={c.title} className="ah-bars__row">
                  <span className="ah-bars__label">{c.title}</span>
                  <span className="ah-bars__track">
                    <span
                      className="ah-bars__fill"
                      style={{ inlineSize: `${Math.max(4, (c.posts / max) * 100)}%` }}
                    />
                  </span>
                  <span className="ah-bars__value">{ar(c.posts)}</span>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="ah-card">
          <h3 className="ah-card__title">يحتاج انتباهاً</h3>
          <ul className="ah-alerts">
            <li>
              <a href="/admin/collections/posts?where[heroImage][exists]=false">
                أخبار منشورة بلا صورة رئيسية
              </a>
              <strong>{ar(dash.missingImage)}</strong>
            </li>
            <li>
              <a href="/admin/collections/posts?where[categories][exists]=false">
                أخبار منشورة بلا قسم
              </a>
              <strong>{ar(dash.missingCategory)}</strong>
            </li>
            <li>
              <a href="/admin/collections/posts?where[_status][equals]=draft">
                مسودّات بانتظار الإكمال
              </a>
              <strong>{ar(drafts.totalDocs)}</strong>
            </li>
          </ul>
        </section>

        <section className="ah-card">
          <h3 className="ah-card__title">آخر الصور المرفوعة</h3>
          <div className="ah-thumbs">
            {dash.latestMedia.map((m) => (
              <a key={m.id} href={`/admin/collections/media/${m.id}`} className="ah-thumbs__item">
                {m.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/media/file/${m.url}`} alt={m.alt ?? ''} loading="lazy" />
                )}
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
