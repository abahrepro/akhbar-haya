import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import type { Media, Post } from '@/payload-types'
import { formatRelative } from '@/utilities/formatArabicDate'
import { Badge, StatusBadge } from '@/components/AdminUI/Badge'
import { Card, CardHeader } from '@/components/AdminUI/Card'
import { Stat } from '@/components/AdminUI/Stat'
import { AdminButton } from '@/components/AdminUI/AdminButton'

/** بداية اليوم بتوقيت عمّان بصيغة ISO */
const startOfTodayISO = (): string => {
  const d = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Amman',
  }).format(new Date())
  return `${d}T00:00:00.000Z`
}

const thumbUrl = (post: Post): string | null => {
  const img = (typeof post.heroImage === 'object' ? post.heroImage : null) as Media | null
  return img?.sizes?.thumbnail?.url ?? img?.url ?? null
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
          and: [
            { _status: { equals: 'published' } },
            { publishedAt: { greater_than_equal: today } },
          ],
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
        limit: 7,
        depth: 1,
        select: {
          title: true,
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

  return (
    <div className="ah mb-8 space-y-5" dir="rtl">
      {/* ===== الترويسة ===== */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="m-0 text-2xl font-extrabold tracking-tight text-[var(--ah-text)]">
            لوحة تحكّم أخبار حياة
          </h2>
          <p className="m-0 text-sm text-[var(--ah-muted)]">
            {breaking.totalDocs > 0 ? (
              <>
                يوجد <b className="text-[var(--ah-alert)]">{breaking.totalDocs}</b> خبر عاجل منشور
                حالياً.
              </>
            ) : (
              'لا يوجد خبر عاجل منشور حالياً.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AdminButton href="/admin/collections/posts/create" variant="alert">
            <span className="inline-block size-[7px] animate-pulse rounded-full bg-white" />
            خبر عاجل
          </AdminButton>
          <AdminButton href="/admin/collections/posts/create" variant="primary">
            خبر جديد
          </AdminButton>
          <AdminButton href="/" external>
            معاينة الموقع
          </AdminButton>
        </div>
      </div>

      {/* ===== الأرقام ===== */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat n={publishedToday.totalDocs} label="منشور اليوم" href="/admin/collections/posts" />
        <Stat
          n={drafts.totalDocs}
          label="مسودة معلّقة"
          tone={drafts.totalDocs > 0 ? 'gold' : 'default'}
          href="/admin/collections/posts?where[_status][equals]=draft"
        />
        <Stat n={scheduled.totalDocs} label="مجدول للنشر" href="/admin/collections/posts" />
        <Stat n={total.totalDocs} label="إجمالي الأخبار" href="/admin/collections/posts" />
      </div>

      {/* ===== اللوحات ===== */}
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader title="آخر ما جرى تعديله" href="/admin/collections/posts" />
          {recent.docs.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[var(--ah-muted)]">
              لا توجد أخبار بعد.
            </p>
          ) : (
            <ul className="m-0 list-none p-0">
              {recent.docs.map((p) => {
                const post = p as Post
                const thumb = thumbUrl(post)
                const status = (post as unknown as { _status?: string })._status
                return (
                  <li key={post.id} className="border-t border-[var(--ah-line)] first:border-t-0">
                    <a
                      href={`/admin/collections/posts/${post.id}`}
                      className="flex items-center gap-3 px-4 py-2.5 no-underline transition-colors hover:bg-[var(--ah-surface-3)]"
                    >
                      <span className="h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--ah-line)]">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt="" className="size-full object-cover" />
                        ) : (
                          <span className="block size-full bg-gradient-to-br from-[var(--ah-brand)] to-[var(--ah-brand-deep)] opacity-40" />
                        )}
                      </span>
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className="line-clamp-1 text-sm font-bold text-[var(--ah-text)]">
                          {post.title || '(بدون عنوان)'}
                        </span>
                        <span className="flex flex-wrap items-center gap-1.5">
                          <StatusBadge status={status} publishedAt={post.publishedAt} />
                          {post.breaking && <Badge tone="alert">عاجل</Badge>}
                          {post.featured && <Badge tone="gold">مميّز</Badge>}
                          <span className="text-[11px] text-[var(--ah-muted)]">
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
        </Card>

        <Card>
          <CardHeader
            title="مسودات تنتظر المراجعة"
            href="/admin/collections/posts?where[_status][equals]=draft"
          />
          {pendingDrafts.docs.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[var(--ah-muted)]">
              ممتاز — لا توجد مسودات معلّقة.
            </p>
          ) : (
            <ul className="m-0 list-none p-0">
              {pendingDrafts.docs.map((p) => (
                <li key={p.id} className="border-t border-[var(--ah-line)] first:border-t-0">
                  <a
                    href={`/admin/collections/posts/${p.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 no-underline transition-colors hover:bg-[var(--ah-surface-3)]"
                  >
                    <span className="line-clamp-1 text-sm font-bold text-[var(--ah-text)]">
                      {p.title || '(بدون عنوان)'}
                    </span>
                    <span className="shrink-0 text-[11px] text-[var(--ah-muted)]">
                      {p.updatedAt ? formatRelative(p.updatedAt) : ''}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

export default BeforeDashboard
