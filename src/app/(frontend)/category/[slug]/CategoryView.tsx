import configPromise from '@payload-config'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React, { cache } from 'react'

import type { Category, Post } from '@/payload-types'
import { AdSlot, NativeAd } from '@/components/Ads'
import { ArchivePagination } from '@/components/News/ArchivePagination'
import { FeatureCard, NewsCard } from '@/components/News/Cards'
import { Sidebar } from '@/components/News/Sidebar'
import { toNewsItem } from '@/components/News/types'

/** أخبار لكل صفحة */
export const PAGE_SIZE = 24

export const queryCategory = cache(async (slug: string) => {
  const payload = await getPayload({ config: configPromise })
  const res = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  return (res.docs?.[0] as Category | undefined) ?? null
})

export const CategoryView: React.FC<{ slug: string; page: number }> = async ({ slug, page }) => {
  const category = await queryCategory(slug)
  if (!category) notFound()

  const payload = await getPayload({ config: configPromise })

  const [postsRes, mostReadRes] = await Promise.all([
    payload.find({
      collection: 'posts',
      where: {
        and: [{ _status: { equals: 'published' } }, { categories: { in: [category.id] } }],
      },
      sort: '-publishedAt',
      limit: PAGE_SIZE,
      page,
      depth: 1,
    }),
    payload.find({
      collection: 'posts',
      where: { _status: { equals: 'published' } },
      sort: '-publishedAt',
      limit: 5,
      depth: 1,
    }),
  ])

  // رقم صفحة أبعد من الأرشيف ليس صفحة فارغة — بل غير موجود
  if (page > 1 && postsRes.docs.length === 0) notFound()

  const items = (postsRes.docs as Post[]).map(toNewsItem)
  const mostRead = (mostReadRes.docs as Post[]).map(toNewsItem)

  // البطاقة الكبيرة تتصدّر الصفحة الأولى فقط — الصفحات التالية شبكة متجانسة
  const lead = page === 1 ? items[0] : undefined
  const rest = page === 1 ? items.slice(1) : items
  const firstBatch = rest.slice(0, 6)
  const secondBatch = rest.slice(6)

  const basePath = `/category/${slug}`
  const color = category.color || 'var(--brand)'

  return (
    <main className="container py-6">
      {/* مسار التنقّل */}
      <nav className="mb-4 flex items-center gap-2 text-[14px] font-medium text-muted-foreground">
        <Link href="/" className="transition hover:text-brand">
          الرئيسية
        </Link>
        <span className="opacity-50">›</span>
        {page === 1 ? (
          <span className="text-ink-soft">{category.title}</span>
        ) : (
          <>
            <Link href={basePath} className="transition hover:text-brand">
              {category.title}
            </Link>
            <span className="opacity-50">›</span>
            <span className="text-ink-soft">صفحة {page.toLocaleString('ar-EG')}</span>
          </>
        )}
      </nav>

      {/* ترويسة القسم */}
      <div
        className="relative mb-6 overflow-hidden rounded-[14px] px-7 py-8 text-white"
        style={{
          background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 62%, #000))`,
        }}
      >
        <div className="relative z-2">
          <span className="mb-3.5 inline-block rounded-full bg-white/15 px-3 py-1 text-[13.5px] font-extrabold tracking-wide">
            قسم
          </span>
          <h1 className="font-serif text-[clamp(30px,4.6vw,48px)] font-black leading-[1.2]">
            {category.title}
            {page > 1 && (
              <span className="text-[0.5em] font-bold opacity-80">
                {' '}
                — صفحة {page.toLocaleString('ar-EG')}
              </span>
            )}
          </h1>
          {category.description && page === 1 && (
            <p className="mt-3 max-w-[62ch] text-[clamp(15px,2vw,17.5px)] leading-relaxed opacity-90">
              {category.description}
            </p>
          )}
          <span className="mt-4 inline-block rounded-full border border-white/30 px-3.5 py-1 text-[14px] font-bold opacity-90">
            {postsRes.totalDocs.toLocaleString('ar-EG')} خبراً · يُحدَّث باستمرار
          </span>
        </div>
      </div>

      <AdSlot source="google" size="970×90" name="Leaderboard" className="mb-7 h-[104px]" />

      {items.length === 0 ? (
        <p className="py-16 text-center text-ink-soft">لا توجد أخبار في هذا القسم حالياً.</p>
      ) : (
        <div className="flex min-w-0 flex-col gap-10 lg:grid lg:items-start lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            {lead && (
              <div className="mb-6">
                <FeatureCard item={lead} />
              </div>
            )}

            {firstBatch.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {firstBatch.map((item) => (
                  <NewsCard key={item.id} item={item} showExcerpt />
                ))}
              </div>
            )}

            {secondBatch.length > 0 && (
              <>
                <NativeAd
                  title="HP EliteBook 8 G1 — إنتاجية مكثّفة تتكيّف مع كل مناسبة"
                  sponsor="MID Teks Inc — الشرق الأوسط لتقنية الحاسب الآلي"
                  className="my-7"
                />
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {secondBatch.map((item) => (
                    <NewsCard key={item.id} item={item} showExcerpt />
                  ))}
                </div>
              </>
            )}

            <ArchivePagination
              page={postsRes.page ?? page}
              totalPages={postsRes.totalPages}
              basePath={basePath}
            />
          </div>

          <Sidebar mostRead={mostRead} />
        </div>
      )}
    </main>
  )
}
