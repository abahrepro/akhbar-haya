import configPromise from '@payload-config'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import React from 'react'

import type { Category, Post } from '@/payload-types'
import { AdSlot, NativeAd } from '@/components/Ads'
import { BreakingToast } from '@/components/News/BreakingToast'
import { SectionHead } from '@/components/News/Bits'
import {
  BentoCard,
  FeatureCard,
  HeroSideCard,
  LeadCard,
  ListRow,
  NewsCard,
  OpinionRow,
  PhotoCard,
} from '@/components/News/Cards'
import { Sidebar } from '@/components/News/Sidebar'
import { toNewsItem, type NewsItem } from '@/components/News/types'

export const revalidate = 60

const POST_SELECT = {
  title: true,
  slug: true,
  excerpt: true,
  heroImage: true,
  categories: true,
  publishedAt: true,
  type: true,
  breaking: true,
  featured: true,
  videoDuration: true,
  meta: true,
} as const

/** أخبار قسم معيّن حسب الـ slug */
const bySlug = (posts: NewsItem[], slug: string) => posts.filter((p) => p.category?.slug === slug)

export default async function HomePage() {
  const payload = await getPayload({ config: configPromise })

  const [postsRes, categoriesRes] = await Promise.all([
    payload.find({
      collection: 'posts',
      where: { _status: { equals: 'published' } },
      sort: '-publishedAt',
      limit: 60,
      depth: 1,
      select: POST_SELECT,
    }),
    payload.find({
      collection: 'categories',
      sort: 'order',
      limit: 12,
      depth: 0,
      select: { title: true, slug: true, color: true },
    }),
  ])

  const docs = postsRes.docs as Post[]
  const all: NewsItem[] = docs.map((p) => toNewsItem(p))
  const featuredIds = new Set(docs.filter((p) => p.featured).map((p) => p.id))
  const cats = categoriesRes.docs as Category[]
  const catBySlug = (slug: string) => cats.find((c) => c.slug === slug)

  // حالة الموقع الجديد: لا أخبار منشورة بعد
  if (all.length === 0) {
    return (
      <main className="container flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
        <h1 className="font-serif text-3xl font-black">أخبار حياة</h1>
        <p className="max-w-[46ch] text-ink-soft">
          لا توجد أخبار منشورة بعد. أضف أول خبر من لوحة التحكّم لتظهر الصفحة الرئيسية بمحتواها.
        </p>
        <a
          href="/admin/collections/posts/create"
          className="rounded-full bg-brand px-6 py-3 font-bold text-white transition hover:bg-brand-deep"
        >
          إضافة خبر جديد
        </a>
      </main>
    )
  }

  const breaking = all.find((p) => p.breaking)
  const featured = all.filter((p) => featuredIds.has(p.id as number))
  const heroPool = featured.length >= 5 ? featured : all
  const lead = heroPool[0]
  const heroSide = heroPool.slice(1, 5)
  const used = new Set<NewsItem['id']>([lead?.id, ...heroSide.map((h) => h.id)])
  const rest = all.filter((p) => !used.has(p.id))

  const jordan = bySlug(rest, 'jordan')
  const palestine = bySlug(rest, 'palestine')
  const economy = bySlug(rest, 'economy')
  const world = bySlug(rest, 'world')
  const photo = bySlug(rest, 'photo')
  const tech = bySlug(rest, 'technology')
  const sports = bySlug(rest, 'sports')
  const opinion = bySlug(rest, 'opinion')
  const mostRead = all.slice(0, 5)

  return (
    <main className="container py-6">
      {breaking && <BreakingToast id={breaking.id} title={breaking.title} href={breaking.href} />}

      {/* ===== الهيرو ===== */}
      {lead && (
        <section className="mb-10 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <LeadCard item={lead} />
          {heroSide.length > 0 && (
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-rows-2">
              {heroSide.map((item) => (
                <HeroSideCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>
      )}

      <AdSlot source="google" size="970×90" name="Leaderboard" className="mb-10 h-[104px]" />

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {/* أخبار الأردن — مميّز + قائمة */}
          {jordan.length > 0 && (
            <section className="mb-10">
              <SectionHead
                title={catBySlug('jordan')?.title ?? 'أخبار الأردن'}
                href="/category/jordan"
                color={catBySlug('jordan')?.color}
              />
              <div className="grid gap-5 sm:grid-cols-[1.15fr_1fr]">
                <FeatureCard item={jordan[0]} />
                <div className="flex flex-col">
                  {jordan.slice(1, 5).map((item, i, arr) => (
                    <ListRow key={item.id} item={item} last={i === arr.length - 1} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* فلسطين — شبكة */}
          {palestine.length > 0 && (
            <section className="mb-10">
              <SectionHead
                title={catBySlug('palestine')?.title ?? 'فلسطين'}
                href="/category/palestine"
                color={catBySlug('palestine')?.color}
              />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {palestine.slice(0, 4).map((item) => (
                  <NewsCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          <NativeAd
            title="HP EliteBook 8 G1 — إنتاجية مكثّفة تتكيّف مع كل مناسبة"
            sponsor="MID Teks Inc — الشرق الأوسط لتقنية الحاسب الآلي"
            className="mb-10"
          />

          {/* اقتصاد — مميّز + قائمة */}
          {economy.length > 0 && (
            <section className="mb-10">
              <SectionHead
                title={catBySlug('economy')?.title ?? 'اقتصاد'}
                href="/category/economy"
                color={catBySlug('economy')?.color}
              />
              <div className="grid gap-5 sm:grid-cols-[1.15fr_1fr]">
                <FeatureCard item={economy[0]} />
                <div className="flex flex-col">
                  {economy.slice(1, 5).map((item, i, arr) => (
                    <ListRow key={item.id} item={item} last={i === arr.length - 1} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* عربي ودولي — شبكة */}
          {world.length > 0 && (
            <section className="mb-10">
              <SectionHead
                title={catBySlug('world')?.title ?? 'عربي ودولي'}
                href="/category/world"
                color={catBySlug('world')?.color}
              />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {world.slice(0, 4).map((item) => (
                  <NewsCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          <AdSlot
            source="house"
            size="970×250"
            name="Billboard · تُباع عبر أخبار حياة مباشرة"
            className="mb-10 min-h-[250px]"
          />

          {/* صورة وخبر — صور بارزة */}
          {photo.length > 0 && (
            <section className="mb-10">
              <SectionHead
                title={catBySlug('photo')?.title ?? 'صورة وخبر'}
                href="/category/photo"
                color={catBySlug('photo')?.color}
                moreLabel="المزيد"
              />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {photo.slice(0, 4).map((item) => (
                  <PhotoCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {/* تكنولوجيا — بنتو */}
          {tech.length > 0 && (
            <section className="mb-10">
              <SectionHead
                title={catBySlug('technology')?.title ?? 'تكنولوجيا'}
                href="/category/technology"
                color={catBySlug('technology')?.color}
              />
              <div className="grid auto-rows-[192px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {tech.slice(0, 5).map((item, i) => (
                  <BentoCard key={item.id} item={item} large={i === 0} />
                ))}
              </div>
            </section>
          )}

          {/* رياضة — شبكة */}
          {sports.length > 0 && (
            <section className="mb-10">
              <SectionHead
                title={catBySlug('sports')?.title ?? 'رياضة'}
                href="/category/sports"
                color={catBySlug('sports')?.color}
              />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {sports.slice(0, 4).map((item) => (
                  <NewsCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {/* مقالات */}
          {opinion.length > 0 && (
            <section className="mb-10">
              <SectionHead
                title={catBySlug('opinion')?.title ?? 'مقالات'}
                href="/category/opinion"
                color={catBySlug('opinion')?.color}
                moreLabel="كل المقالات"
              />
              <div className="rounded-[14px] border border-border bg-card px-5 shadow-sm">
                {opinion.slice(0, 4).map((item, i, arr) => (
                  <OpinionRow key={item.id} item={item} last={i === arr.length - 1} />
                ))}
              </div>
            </section>
          )}
        </div>

        <Sidebar mostRead={mostRead} />
      </div>
    </main>
  )
}

export const metadata: Metadata = {
  title: 'أخبار حياة | مصداقية الخبر',
  description:
    'الموقع الإخباري لمجموعة حياة الإعلامية — أخبار محلية وعالمية، اقتصاد، رياضة، وتكنولوجيا، على مدار الساعة.',
}
