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
  // يبني الرابط المطابق لووردبريس — بدونه تعود الروابط لمعرّف Payload
  wpId: true,
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
/**
 * أقسام الصفحة الرئيسية وعدد الأخبار المطلوب لكل منها.
 * نجلب أكثر من الحاجة (`+5`) لأن بعض الأخبار الأحدث تُستهلك في واجهة الصفحة،
 * فيبقى للقسم عدد كافٍ بعد استبعادها.
 */
const SECTIONS = [
  { slug: 'jordan', limit: 5 },
  { slug: 'palestine', limit: 4 },
  { slug: 'economy', limit: 5 },
  { slug: 'world', limit: 4 },
  { slug: 'photo', limit: 4 },
  { slug: 'technology', limit: 5 },
  { slug: 'sports', limit: 4 },
  { slug: 'opinion', limit: 4 },
] as const

/** هامش إضافي يُجلب ثم يُقصّ بعد استبعاد أخبار الواجهة */
const SECTION_BUFFER = 5

export default async function HomePage() {
  const payload = await getPayload({ config: configPromise })

  const categoriesRes = await payload.find({
    collection: 'categories',
    sort: 'order',
    limit: 20,
    depth: 0,
    select: { title: true, slug: true, color: true },
  })
  const cats = categoriesRes.docs as Category[]
  const catBySlug = (slug: string) => cats.find((c) => c.slug === slug)

  /**
   * كل قسم يُجلب باستعلام مستقل.
   * الاستعلام الواحد المشترك كان يترك الأقسام الصغيرة فارغة لأن
   * الأخبار الأحدث تتركّز في قسمين أو ثلاثة.
   */
  const [heroRes, featuredRes, ...sectionResults] = await Promise.all([
    payload.find({
      collection: 'posts',
      where: { _status: { equals: 'published' } },
      sort: '-publishedAt',
      limit: 12,
      depth: 1,
      select: POST_SELECT,
    }),
    // الخبر المميّز يُجلب مستقلاً كي يظهر في الهيرو ولو لم يكن ضمن الأحدث
    payload.find({
      collection: 'posts',
      where: {
        and: [{ _status: { equals: 'published' } }, { featured: { equals: true } }],
      },
      limit: 1,
      depth: 1,
      select: POST_SELECT,
    }),
    ...SECTIONS.map(({ slug, limit }) => {
      const cat = cats.find((c) => c.slug === slug)
      if (!cat) return Promise.resolve(null)
      return payload.find({
        collection: 'posts',
        where: {
          and: [{ _status: { equals: 'published' } }, { categories: { in: [cat.id] } }],
        },
        sort: '-publishedAt',
        limit: limit + SECTION_BUFFER,
        depth: 1,
        select: POST_SELECT,
      })
    }),
  ])

  const heroDocs = heroRes.docs as Post[]
  const all: NewsItem[] = heroDocs.map((p) => toNewsItem(p))

  /** الخبر المُعلَّم «مميّز» — واحد فقط، ويحلّ محلّ الأحدث في مكان الهيرو */
  const featuredDoc = (featuredRes.docs as Post[])[0]
  const featuredItem = featuredDoc ? toNewsItem(featuredDoc) : null

  /** نتائج الأقسام مفهرسة بالـ slug */
  const bySection = new Map<string, NewsItem[]>()
  SECTIONS.forEach(({ slug }, i) => {
    const res = sectionResults[i]
    bySection.set(slug, res ? (res.docs as Post[]).map(toNewsItem) : [])
  })

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

  /**
   * مكان الهيرو الكبير: الخبر المميّز إن وُجد، وإلا الأحدث.
   * البطاقات الأربع بجانبه: الأحدث بعده.
   */
  const lead = featuredItem ?? all[0]
  const heroSide = all.filter((p) => p.id !== lead?.id).slice(0, 4)
  const used = new Set<NewsItem['id']>([lead?.id, ...heroSide.map((h) => h.id)])

  /** أخبار القسم بعد استبعاد ما ظهر في الواجهة، مقصوصة للعدد المطلوب */
  const section = (slug: string) => {
    const want = SECTIONS.find((s) => s.slug === slug)?.limit ?? 4
    return (bySection.get(slug) ?? []).filter((p) => !used.has(p.id)).slice(0, want)
  }

  const jordan = section('jordan')
  const palestine = section('palestine')
  const economy = section('economy')
  const world = section('world')
  const photo = section('photo')
  const tech = section('technology')
  const sports = section('sports')
  const opinion = section('opinion')
  const mostRead = all.slice(0, 5)

  return (
    <main className="container py-6">
      {breaking && <BreakingToast id={breaking.id} title={breaking.title} href={breaking.href} />}

      {/* ===== الهيرو ===== */}
      {lead && (
        <section className="mb-10 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <LeadCard item={lead} />
          {heroSide.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:gap-3.5 lg:grid-rows-2">
              {heroSide.map((item) => (
                <HeroSideCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>
      )}

      <AdSlot source="google" size="970×90" name="Leaderboard" className="mb-10 h-[104px]" />

      <div className="grid min-w-0 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
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
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
              <div className="grid auto-rows-[192px] grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
