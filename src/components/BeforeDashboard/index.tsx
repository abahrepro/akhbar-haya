import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import type { Media, Post } from '@/payload-types'
import { formatRelative } from '@/utilities/formatArabicDate'
import './index.scss'

const baseClass = 'ah-dash'

/** بداية اليوم بتوقيت عمّان بصيغة ISO */
const startOfTodayISO = (): string => {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Amman',
  }).format(now)
  return `${parts}T00:00:00.000Z`
}

const thumbUrl = (post: Post): string | null => {
  const img = (typeof post.heroImage === 'object' ? post.heroImage : null) as Media | null
  return img?.sizes?.thumbnail?.url ?? img?.url ?? null
}

const STATUS_LABEL: Record<string, string> = {
  published: 'منشور',
  draft: 'مسودة',
}

const BeforeDashboard: React.FC = async () => {
  const payload = await getPayload({ config: configPromise })
  const today = startOfTodayISO()
  const now = new Date().toISOString()

  const [publishedToday, drafts, scheduled, total, breaking, recent, pendingDrafts] =
    await Promise.all([
      payload.count({
        collection: 'posts',
        where: {
          and: [{ _status: { equals: 'published' } }, { publishedAt: { greater_than_equal: today } }],
        },
      }),
      payload.count({ collection: 'posts', where: { _status: { equals: 'draft' } } }),
      payload.count({
        collection: 'posts',
        where: {
          and: [{ _status: { equals: 'published' } }, { publishedAt: { greater_than: now } }],
        },
      }),
      payload.count({ collection: 'posts' }),
      payload.count({
        collection: 'posts',
        where: { and: [{ breaking: { equals: true } }, { _status: { equals: 'published' } }] },
      }),
      payload.find({
        collection: 'posts',
        sort: '-updatedAt',
        limit: 8,
        depth: 1,
        select: {
          title: true,
          slug: true,
          heroImage: true,
          publishedAt: true,
          updatedAt: true,
          type: true,
          breaking: true,
          featured: true,
          _status: true,
        },
      }),
      payload.find({
        collection: 'posts',
        where: { _status: { equals: 'draft' } },
        sort: '-updatedAt',
        limit: 5,
        depth: 0,
        select: { title: true, updatedAt: true },
      }),
    ])

  const stats = [
    { n: publishedToday.totalDocs, l: 'منشور اليوم', href: '/admin/collections/posts?limit=20' },
    {
      n: drafts.totalDocs,
      l: 'مسودة معلّقة',
      href: '/admin/collections/posts?where[_status][equals]=draft',
      warn: drafts.totalDocs > 0,
    },
    { n: scheduled.totalDocs, l: 'مجدول للنشر', href: '/admin/collections/posts' },
    { n: total.totalDocs, l: 'إجمالي الأخبار', href: '/admin/collections/posts' },
  ]

  return (
    <div className={baseClass}>
      {/* ترحيب + إجراءات سريعة */}
      <div className={`${baseClass}__top`}>
        <div>
          <h2 className={`${baseClass}__hi`}>لوحة تحكّم أخبار حياة</h2>
          <p className={`${baseClass}__sub`}>
            {breaking.totalDocs > 0
              ? `يوجد ${breaking.totalDocs} خبر عاجل منشور حالياً.`
              : 'لا يوجد خبر عاجل منشور حالياً.'}
          </p>
        </div>
        <div className={`${baseClass}__actions`}>
          <a className={`${baseClass}__btn ${baseClass}__btn--breaking`} href="/admin/collections/posts/create">
            <span className={`${baseClass}__dot`} />
            خبر عاجل
          </a>
          <a className={`${baseClass}__btn ${baseClass}__btn--primary`} href="/admin/collections/posts/create">
            ✍️ خبر جديد
          </a>
          <a className={`${baseClass}__btn`} href="/" target="_blank" rel="noopener noreferrer">
            🌐 معاينة الموقع
          </a>
        </div>
      </div>

      {/* بطاقات الأرقام */}
      <div className={`${baseClass}__stats`}>
        {stats.map((s) => (
          <a
            key={s.l}
            href={s.href}
            className={`${baseClass}__stat${s.warn ? ` ${baseClass}__stat--warn` : ''}`}
          >
            <span className={`${baseClass}__stat-n`}>{s.n}</span>
            <span className={`${baseClass}__stat-l`}>{s.l}</span>
          </a>
        ))}
      </div>

      <div className={`${baseClass}__grid`}>
        {/* آخر التعديلات */}
        <section className={`${baseClass}__panel`}>
          <div className={`${baseClass}__panel-h`}>
            <h3>آخر ما جرى تعديله</h3>
            <a href="/admin/collections/posts">عرض الكل ←</a>
          </div>
          {recent.docs.length === 0 ? (
            <p className={`${baseClass}__empty`}>لا توجد أخبار بعد.</p>
          ) : (
            <ul className={`${baseClass}__list`}>
              {recent.docs.map((p) => {
                const post = p as Post
                const thumb = thumbUrl(post)
                return (
                  <li key={post.id}>
                    <a href={`/admin/collections/posts/${post.id}`}>
                      <span className={`${baseClass}__thumb`}>
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt="" />
                        ) : (
                          <span className={`${baseClass}__thumb-ph`} />
                        )}
                      </span>
                      <span className={`${baseClass}__item-body`}>
                        <span className={`${baseClass}__item-title`}>{post.title || '(بدون عنوان)'}</span>
                        <span className={`${baseClass}__meta`}>
                          <span
                            className={`${baseClass}__pill ${baseClass}__pill--${
                              (post as unknown as { _status?: string })._status === 'published'
                                ? 'ok'
                                : 'draft'
                            }`}
                          >
                            {STATUS_LABEL[(post as unknown as { _status?: string })._status ?? 'draft'] ??
                              'مسودة'}
                          </span>
                          {post.breaking && (
                            <span className={`${baseClass}__pill ${baseClass}__pill--breaking`}>عاجل</span>
                          )}
                          {post.featured && (
                            <span className={`${baseClass}__pill ${baseClass}__pill--star`}>مميّز</span>
                          )}
                          <span className={`${baseClass}__time`}>
                            {post.updatedAt ? formatRelative(post.updatedAt) : ''}
                          </span>
                        </span>
                      </span>
                    </a>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* مسودات تنتظر */}
        <section className={`${baseClass}__panel`}>
          <div className={`${baseClass}__panel-h`}>
            <h3>مسودات تنتظر المراجعة</h3>
            <a href="/admin/collections/posts?where[_status][equals]=draft">عرض الكل ←</a>
          </div>
          {pendingDrafts.docs.length === 0 ? (
            <p className={`${baseClass}__empty`}>ممتاز — لا توجد مسودات معلّقة. 🎉</p>
          ) : (
            <ul className={`${baseClass}__list ${baseClass}__list--plain`}>
              {pendingDrafts.docs.map((p) => (
                <li key={p.id}>
                  <a href={`/admin/collections/posts/${p.id}`}>
                    <span className={`${baseClass}__item-title`}>{p.title || '(بدون عنوان)'}</span>
                    <span className={`${baseClass}__time`}>
                      {p.updatedAt ? formatRelative(p.updatedAt) : ''}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

export default BeforeDashboard
