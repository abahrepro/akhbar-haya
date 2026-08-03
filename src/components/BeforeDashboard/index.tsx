import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import type { Media, Post } from '@/payload-types'
import { formatRelative } from '@/utilities/formatArabicDate'
import { Badge, StatusBadge, TypeBadge } from '@/components/AdminUI/Badge'
import { Card, CardHeader } from '@/components/AdminUI/Card'
import { Stat } from '@/components/AdminUI/Stat'
import { AdminButton } from '@/components/AdminUI/AdminButton'
import { IconTile, ACCENT, type Accent } from '@/components/AdminUI/IconTile'
import { AreaChart, MiniBars, RadialStat } from '@/components/AdminUI/Charts'

/* ===== أيقونات ===== */
const I = {
  doc: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
      <path d="M6 2h8l4 4v16H6V2zm7 1.5V7h3.5L13 3.5zM8 11h8v1.6H8V11zm0 3.4h8V16H8v-1.6z" />
    </svg>
  ),
  draft: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
      <path d="M3 17.3V21h3.7L17.6 10.1l-3.7-3.7L3 17.3zM20.7 7a1 1 0 0 0 0-1.4l-2.3-2.3a1 1 0 0 0-1.4 0l-1.8 1.8 3.7 3.7L20.7 7z" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 10V6h-2v7h6v-2h-4z" />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  ),
  photo: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4.5">
      <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm2 3a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm-1 9h14l-4.5-6-3.5 4.5-2.5-3z" />
    </svg>
  ),
  tag: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4.5">
      <path d="M12.4 2H21v8.6L10.6 21 3 13.4 12.4 2zm4.6 3.4a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2z" />
    </svg>
  ),
  folder: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4.5">
      <path d="M3 5h6l2 2h10v12H3V5z" />
    </svg>
  ),
}

const startOfDayISO = (offsetDays = 0): string => {
  const d = new Date()
  d.setDate(d.getDate() - offsetDays)
  const s = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Amman',
  }).format(d)
  return `${s}T00:00:00.000Z`
}

const dayLabel = (offsetDays: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - offsetDays)
  return new Intl.DateTimeFormat('ar-JO', { day: 'numeric', timeZone: 'Asia/Amman' }).format(d)
}

const thumbUrl = (post: Post): string | null => {
  const img = (typeof post.heroImage === 'object' ? post.heroImage : null) as Media | null
  return img?.sizes?.thumbnail?.url ?? img?.url ?? null
}

const BeforeDashboard: React.FC = async () => {
  const payload = await getPayload({ config: configPromise })
  const now = new Date().toISOString()

  const [publishedToday, drafts, scheduled, total, breaking, featured, recent, cats, tags, media] =
    await Promise.all([
      payload.count({
        collection: 'posts',
        where: {
          and: [
            { _status: { equals: 'published' } },
            { publishedAt: { greater_than_equal: startOfDayISO(0) } },
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
      payload.count({ collection: 'posts', where: { featured: { equals: true } } }),
      payload.find({
        collection: 'posts',
        sort: '-updatedAt',
        limit: 6,
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
      payload.count({ collection: 'categories' }),
      payload.count({ collection: 'tags' }),
      payload.count({ collection: 'media' }),
    ])

  // نشاط النشر خلال 14 يوماً — بيانات حقيقية
  const days = await Promise.all(
    Array.from({ length: 14 }, (_, k) => {
      const off = 13 - k
      return payload
        .count({
          collection: 'posts',
          where: {
            and: [
              { _status: { equals: 'published' } },
              { publishedAt: { greater_than_equal: startOfDayISO(off) } },
              { publishedAt: { less_than: startOfDayISO(off - 1) } },
            ],
          },
        })
        .then((r) => ({ label: dayLabel(off), value: r.totalDocs }))
    }),
  )

  const dist: { label: string; value: number; accent: Accent }[] = [
    { label: 'منشور', value: total.totalDocs - drafts.totalDocs, accent: 'green' },
    { label: 'مسودات', value: drafts.totalDocs, accent: 'amber' },
    { label: 'عاجل', value: breaking.totalDocs, accent: 'coral' },
    { label: 'مميّز', value: featured.totalDocs, accent: 'violet' },
  ]

  const libraries: { label: string; n: number; accent: Accent; icon: React.ReactNode; href: string }[] =
    [
      { label: 'الأقسام', n: cats.totalDocs, accent: 'blue', icon: I.folder, href: '/admin/collections/categories' },
      { label: 'الوسوم', n: tags.totalDocs, accent: 'violet', icon: I.tag, href: '/admin/collections/tags' },
      { label: 'الوسائط', n: media.totalDocs, accent: 'teal', icon: I.photo, href: '/admin/collections/media' },
    ]

  return (
    <div className="ah mb-8 space-y-4" dir="rtl">
      {/* ===== الترويسة ===== */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="m-0 text-[22px] font-extrabold tracking-tight text-[var(--ah-text)]">
            لوحة تحكّم أخبار حياة
          </h2>
          <p className="m-0 mt-1 text-[13px] text-[var(--ah-muted)]">
            {breaking.totalDocs > 0 ? (
              <>
                يوجد <b style={{ color: ACCENT.coral.fg }}>{breaking.totalDocs}</b> خبر عاجل منشور
                حالياً
              </>
            ) : (
              'لا يوجد خبر عاجل منشور حالياً'
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

      {/* ===== بطاقات الأرقام ===== */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <Stat
          n={publishedToday.totalDocs}
          label="منشور اليوم"
          accent="green"
          icon={I.doc}
          href="/admin/collections/posts"
        />
        <Stat
          n={drafts.totalDocs}
          label="مسودة معلّقة"
          accent="amber"
          icon={I.draft}
          hint={drafts.totalDocs > 0 ? 'تحتاج مراجعة' : undefined}
          href="/admin/collections/posts?where[_status][equals]=draft"
        />
        <Stat
          n={scheduled.totalDocs}
          label="مجدول للنشر"
          accent="blue"
          icon={I.clock}
          href="/admin/collections/posts"
        />
        <Stat
          n={breaking.totalDocs}
          label="خبر عاجل"
          accent="coral"
          icon={I.bolt}
          href="/admin/collections/posts?where[breaking][equals]=true"
        />
      </div>

      {/* ===== الرسم البياني + التوزيع ===== */}
      <div className="grid gap-3.5 lg:grid-cols-[1.75fr_1fr]">
        <Card>
          <CardHeader title="نشاط النشر" hint="آخر ١٤ يوماً" />
          <div className="px-4 pb-4 pt-2 text-[var(--ah-text)]">
            <AreaChart data={days} accent="violet" />
          </div>
        </Card>

        <Card>
          <CardHeader title="توزيع الأخبار" />
          <div className="px-5 pb-5 pt-3 text-[var(--ah-text)]">
            <MiniBars data={dist} />
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
              {dist.map((d) => (
                <div key={d.label} className="flex items-center gap-2">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: ACCENT[d.accent].fg }}
                  />
                  <span className="text-[12.5px] text-[var(--ah-muted)]">{d.label}</span>
                  <span className="ms-auto text-[12.5px] font-extrabold tabular-nums">
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* ===== آخر التعديلات + المكتبات ===== */}
      <div className="grid gap-3.5 lg:grid-cols-[1.75fr_1fr]">
        <Card>
          <CardHeader title="آخر ما جرى تعديله" href="/admin/collections/posts" />
          <ul className="m-0 mt-2 list-none p-0">
            {recent.docs.length === 0 ? (
              <li className="px-5 py-8 text-center text-[13px] text-[var(--ah-muted)]">
                لا توجد أخبار بعد
              </li>
            ) : (
              recent.docs.map((p) => {
                const post = p as Post
                const thumb = thumbUrl(post)
                const status = (post as unknown as { _status?: string })._status
                return (
                  <li key={post.id}>
                    <a
                      href={`/admin/collections/posts/${post.id}`}
                      className="flex items-center gap-3 px-5 py-2.5 no-underline transition-colors hover:bg-[var(--ah-surface-3)]"
                    >
                      <span className="h-10 w-14 shrink-0 overflow-hidden rounded-[10px] bg-[var(--ah-line)]">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt="" className="size-full object-cover" />
                        ) : (
                          <span
                            className="block size-full"
                            style={{ background: ACCENT.green.bg }}
                          />
                        )}
                      </span>
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className="line-clamp-1 text-[13.5px] font-bold text-[var(--ah-text)]">
                          {post.title || '(بدون عنوان)'}
                        </span>
                        <span className="flex flex-wrap items-center gap-1.5">
                          <StatusBadge status={status} publishedAt={post.publishedAt} />
                          {post.breaking && <Badge tone="alert">عاجل</Badge>}
                          {post.featured && <Badge tone="gold">مميّز</Badge>}
                          <TypeBadge type={post.type} />
                          <span className="text-[11px] text-[var(--ah-muted)]">
                            {post.updatedAt ? formatRelative(post.updatedAt) : ''}
                          </span>
                        </span>
                      </span>
                    </a>
                  </li>
                )
              })
            )}
          </ul>
        </Card>

        <div className="grid gap-3.5">
          <Card padded>
            <div className="flex items-center gap-4">
              <RadialStat
                value={total.totalDocs - drafts.totalDocs}
                total={total.totalDocs}
                accent="green"
              />
              <div>
                <div className="text-[13px] font-semibold text-[var(--ah-muted)]">نسبة المنشور</div>
                <div className="mt-0.5 text-[22px] font-extrabold tabular-nums text-[var(--ah-text)]">
                  {total.totalDocs - drafts.totalDocs}
                  <span className="text-[13px] font-semibold text-[var(--ah-muted)]">
                    {' '}
                    من {total.totalDocs}
                  </span>
                </div>
                <a
                  href="/admin/collections/posts"
                  className="mt-1 inline-block text-[12.5px] font-bold text-[var(--ah-brand)] no-underline hover:underline"
                >
                  عرض الكل
                </a>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="المكتبات" />
            <ul className="m-0 mt-1 list-none p-0 pb-2">
              {libraries.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="flex items-center gap-3 px-5 py-2.5 no-underline transition-colors hover:bg-[var(--ah-surface-3)]"
                  >
                    <IconTile accent={l.accent} size={32}>
                      {l.icon}
                    </IconTile>
                    <span className="text-[13.5px] font-bold text-[var(--ah-text)]">{l.label}</span>
                    <span className="ms-auto text-[15px] font-extrabold tabular-nums text-[var(--ah-muted)]">
                      {l.n}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default BeforeDashboard
