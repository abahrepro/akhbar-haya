import configPromise from '@payload-config'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React, { cache } from 'react'

import type { Category, Post } from '@/payload-types'
import { AdSlot, NativeAd } from '@/components/Ads'
import { FeatureCard, NewsCard } from '@/components/News/Cards'
import { Sidebar } from '@/components/News/Sidebar'
import { toNewsItem } from '@/components/News/types'

export const revalidate = 60

type Args = { params: Promise<{ slug?: string }> }

const queryCategory = cache(async (slug: string) => {
  const payload = await getPayload({ config: configPromise })
  const res = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  return (res.docs?.[0] as Category | undefined) ?? null
})

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const cats = await payload.find({
    collection: 'categories',
    limit: 50,
    pagination: false,
    select: { slug: true },
  })
  return cats.docs.filter((c) => c.slug).map(({ slug }) => ({ slug: slug as string }))
}

export default async function CategoryPage({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  const decoded = decodeURIComponent(slug)
  const category = await queryCategory(decoded)
  if (!category) notFound()

  const payload = await getPayload({ config: configPromise })

  const [postsRes, mostReadRes] = await Promise.all([
    payload.find({
      collection: 'posts',
      where: {
        and: [{ _status: { equals: 'published' } }, { categories: { in: [category.id] } }],
      },
      sort: '-publishedAt',
      limit: 24,
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

  const items = (postsRes.docs as Post[]).map(toNewsItem)
  const mostRead = (mostReadRes.docs as Post[]).map(toNewsItem)
  const [lead, ...rest] = items
  const firstBatch = rest.slice(0, 6)
  const secondBatch = rest.slice(6, 15)
  const color = category.color || 'var(--brand)'

  return (
    <main className="container py-6">
      {/* مسار التنقّل */}
      <nav className="mb-4 flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
        <Link href="/" className="transition hover:text-brand">
          الرئيسية
        </Link>
        <span className="opacity-50">›</span>
        <span className="text-ink-soft">{category.title}</span>
      </nav>

      {/* ترويسة القسم */}
      <div
        className="relative mb-6 overflow-hidden rounded-[14px] px-7 py-8 text-white"
        style={{ background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 62%, #000))` }}
      >
        <div className="relative z-2">
          <span className="mb-3.5 inline-block rounded-full bg-white/15 px-3 py-1 text-[12.5px] font-extrabold tracking-wide">
            قسم
          </span>
          <h1 className="font-serif text-[clamp(30px,4.6vw,48px)] font-black leading-[1.2]">
            {category.title}
          </h1>
          {category.description && (
            <p className="mt-3 max-w-[62ch] text-[clamp(15px,2vw,17.5px)] leading-relaxed opacity-90">
              {category.description}
            </p>
          )}
          <span className="mt-4 inline-block rounded-full border border-white/30 px-3.5 py-1 text-[13px] font-bold opacity-90">
            {postsRes.totalDocs} خبراً · يُحدَّث باستمرار
          </span>
        </div>
      </div>

      <AdSlot source="google" size="970×90" name="Leaderboard" className="mb-7 h-[104px]" />

      {items.length === 0 ? (
        <p className="py-16 text-center text-ink-soft">لا توجد أخبار في هذا القسم حالياً.</p>
      ) : (
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
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
          </div>

          <Sidebar mostRead={mostRead} />
        </div>
      )}
    </main>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const category = await queryCategory(decodeURIComponent(slug))
  if (!category) return { title: 'قسم غير موجود — أخبار حياة' }
  return {
    title: `${category.title} — أخبار حياة`,
    description: category.description || `آخر أخبار ${category.title} على أخبار حياة.`,
  }
}
