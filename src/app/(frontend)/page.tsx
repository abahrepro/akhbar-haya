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
  breakingUntil: true,
  heroSlot: true,
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
  { slug: 'palestine', limit: 5 },
  { slug: 'economy', limit: 4 },
  { slug: 'world', limit: 4 },
  { slug: 'photo', limit: 4 },
  { slug: 'technology', limit: 5 },
  { slug: 'sports', limit: 4 },
  { slug: 'opinion', limit: 8 },
  { slug: 'women', limit: 4 },
] as const

/** مواضع السلايدر: بطاقة كبيرة وأربع جانبية */
const HERO_SLOTS = 5

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
    // المثبّتون يُجلبون مستقلّين كي يظهروا في السلايدر ولو لم يكونوا ضمن الأحدث
    payload.find({
      collection: 'posts',
      where: {
        and: [{ _status: { equals: 'published' } }, { heroSlot: { exists: true } }],
      },
      limit: HERO_SLOTS,
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

  /** المثبّتون مفهرسون برقم الموضع */
  const pinned = new Map<number, NewsItem>()
  for (const doc of featuredRes.docs as Post[]) {
    const slot = Number(doc.heroSlot)
    if (slot >= 1 && slot <= HERO_SLOTS) pinned.set(slot, toNewsItem(doc))
  }

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
          href="/tahrir/collections/posts/create"
          className="rounded-full bg-brand px-6 py-3 font-bold text-white transition hover:bg-brand-deep"
        >
          إضافة خبر جديد
        </a>
      </main>
    )
  }

  const breaking = all.find((p) => p.breaking)

  /**
   * السلايدر خمسة مواضع: المثبّت يأخذ موضعه وما بقي يُملأ بالأحدث.
   * التثبيت جزئي بطبعه — يثبّت المحرّر ما يهمّه ويترك الباقي يتجدّد وحده.
   */
  const pinnedIds = new Set([...pinned.values()].map((p) => p.id))
  const fillers = all.filter((p) => !pinnedIds.has(p.id))
  let next = 0
  const hero: NewsItem[] = []
  for (let slot = 1; slot <= HERO_SLOTS; slot++) {
    const item = pinned.get(slot) ?? fillers[next++]
    if (item) hero.push(item)
  }

  const lead = hero[0]
  const heroSide = hero.slice(1)
  const used = new Set<NewsItem['id']>(hero.map((h) => h.id))

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
  const women = section('women')
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

      <AdSlot placement="leaderboard" className="mb-10" />

      <div className="flex min-w-0 flex-col gap-10 lg:grid lg:items-start lg:grid-cols-[minmax(0,1fr)_320px]">
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

          {/* اقتصاد — شبكة */}
          {economy.length > 0 && (
            <section className="mb-10">
              <SectionHead
                title={catBySlug('economy')?.title ?? 'اقتصاد'}
                href="/category/economy"
                color={catBySlug('economy')?.color}
              />
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {economy.slice(0, 4).map((item) => (
                  <NewsCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          <NativeAd className="mb-10" />

          {/* فلسطين — مميّز + قائمة */}
          {palestine.length > 0 && (
            <section className="mb-10">
              <SectionHead
                title={catBySlug('palestine')?.title ?? 'فلسطين'}
                href="/category/palestine"
                color={catBySlug('palestine')?.color}
              />
              <div className="grid gap-5 sm:grid-cols-[1.15fr_1fr]">
                <FeatureCard item={palestine[0]} />
                <div className="flex flex-col">
                  {palestine.slice(1, 5).map((item, i, arr) => (
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

          <AdSlot placement="billboard" className="mb-10" />

          {/* مقالات */}
          {opinion.length > 0 && (
            <section className="mb-10">
              <SectionHead
                title={catBySlug('opinion')?.title ?? 'مقالات'}
                href="/category/opinion"
                color={catBySlug('opinion')?.color}
                moreLabel="كل المقالات"
              />
              {/*
                عمودان صريحان لا شبكة تملأ صفّاً صفّاً: الشبكة توزّع
                ١ و٢ في الصفّ الأول فيقرأ العمود اليمين ١ ثم ٣ ثم ٥. هنا
                يأخذ اليمين الأربعة الأولى بترتيبها كما يتوقّع القارئ.
                وعلى الهاتف يهبط العمودان تحت بعضهما فتصير قائمة واحدة —
                عمودان على شاشة ضيّقة يجعلان الصورة خمسين بكسلاً لا تُفهم.
              */}
              <div className="grid gap-x-8 rounded-[14px] border border-border bg-card px-5 shadow-sm sm:grid-cols-2">
                {[opinion.slice(0, 4), opinion.slice(4, 8)].map((col, ci) => (
                  <div key={ci} className="flex flex-col">
                    {col.map((item, i, arr) => (
                      <OpinionRow key={item.id} item={item} last={i === arr.length - 1} />
                    ))}
                  </div>
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

          {/* بيت حواء — شبكة */}
          {women.length > 0 && (
            <section className="mb-10">
              <SectionHead
                title={catBySlug('women')?.title ?? 'بيت حواء'}
                href="/category/women"
                color={catBySlug('women')?.color}
              />
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {women.slice(0, 4).map((item) => (
                  <NewsCard key={item.id} item={item} />
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
