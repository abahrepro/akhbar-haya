import configPromise from '@payload-config'
import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { permanentRedirect } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from 'payload'
import React, { cache } from 'react'

import type { Category, Media as MediaType, Post, Tag } from '@/payload-types'
import { AdSlot } from '@/components/Ads'
import { IconClock } from '@/components/Brand/icons'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { Media } from '@/components/Media'
import { NewsCard } from '@/components/News/Cards'
import { ReaderTools, ReadingProgress } from '@/components/News/ReaderTools'
import { ShareButtons } from '@/components/News/ShareButtons'
import { Sidebar } from '@/components/News/Sidebar'
import { toNewsItem } from '@/components/News/types'
import { ViewPing } from '@/components/News/ViewPing'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import RichText from '@/components/RichText'
import { formatGregorian, formatTime } from '@/utilities/formatArabicDate'
import { generateMeta } from '@/utilities/generateMeta'
import { getServerSideURL } from '@/utilities/getURL'
import { postHref, postNumber } from '@/utilities/postUrl'

/**
 * نولّد مسبقاً أحدث الأخبار فقط.
 * الأرشيف كامل (أكثر من ١٤٥ ألف خبر) يُبنى عند أول طلب ثم يُخزَّن،
 * فبناء كل شيء مسبقاً يستغرق ساعات بلا فائدة تُذكر.
 */
export const dynamicParams = true

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const posts = await payload.find({
    collection: 'posts',
    draft: false,
    limit: 500,
    sort: '-publishedAt',
    overrideAccess: false,
    select: { slug: true, wpId: true },
  })
  return posts.docs
    .filter((p) => p.slug)
    .map((p) => ({ id: String(postNumber(p)), slug: p.slug as string }))
}

type Args = { params: Promise<{ id?: string; slug?: string }> }

/** تقدير وقت القراءة من محتوى Lexical */
const readingMinutes = (content: Post['content']): number => {
  const text = JSON.stringify(content ?? {})
  const words = text.split(/\s+/).length
  return Math.max(1, Math.round(words / 220))
}

export default async function PostPage({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { id = '', slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const post = await queryPostBySlug({ slug: decodedSlug })

  if (!post) return <PayloadRedirects url={`/${id}/${decodedSlug}`} />

  // الاسم اللطيف هو المُعرّف الحقيقي؛ الرقم للتوافق مع روابط ووردبريس.
  // أي رقم آخر يعني نسخة ثانية من الصفحة نفسها — نحوّلها للرابط المعتمد.
  const url = postHref(post)
  // ترويسة Location تقبل ASCII فقط، والعناوين عربية — فنرمّزها
  if (id !== String(postNumber(post))) permanentRedirect(encodeURI(url))

  const payload = await getPayload({ config: configPromise })
  const category = (post.categories?.[0] as Category | undefined) ?? undefined
  const tags = (post.tags ?? []).filter((t): t is Tag => typeof t === 'object')
  const hero = typeof post.heroImage === 'object' ? (post.heroImage as MediaType) : null
  const fullUrl = `${getServerSideURL()}${url}`
  const minutes = readingMinutes(post.content)

  // مقالات ذات صلة: يدوية أو من نفس القسم
  let related = (post.relatedPosts ?? []).filter((p): p is Post => typeof p === 'object')
  if (related.length === 0 && category?.id) {
    const res = await payload.find({
      collection: 'posts',
      where: {
        and: [
          { _status: { equals: 'published' } },
          { categories: { in: [category.id] } },
          { id: { not_equals: post.id } },
        ],
      },
      sort: '-publishedAt',
      limit: 4,
      depth: 1,
    })
    related = res.docs as Post[]
  }

  const mostReadRes = await payload.find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
    sort: '-publishedAt',
    limit: 5,
    depth: 1,
  })
  const mostRead = (mostReadRes.docs as Post[]).map(toNewsItem)

  // بيانات Schema المهيكلة لمحركات البحث
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    description: post.excerpt ?? post.meta?.description ?? undefined,
    image: hero?.url ? [`${getServerSideURL()}${hero.url}`] : undefined,
    datePublished: post.publishedAt ?? post.createdAt,
    dateModified: post.updatedAt,
    inLanguage: 'ar',
    articleSection: category?.title,
    mainEntityOfPage: { '@type': 'WebPage', '@id': fullUrl },
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: 'أخبار حياة',
      url: getServerSideURL(),
    },
  }

  return (
    <>
      <ReadingProgress />
      <ViewPing id={post.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PayloadRedirects disableNotFound url={url} />
      {draft && <LivePreviewListener />}

      <main className="container py-6">
        <div className="flex min-w-0 flex-col gap-11 lg:grid lg:items-start lg:grid-cols-[minmax(0,1fr)_320px]">
          <article className="min-w-0">
            {/* مسار التنقّل */}
            <nav className="ah-hide-in-reading mb-5 flex flex-wrap items-center gap-2 text-[14px] font-medium text-muted-foreground">
              <Link href="/" className="transition hover:text-brand">
                الرئيسية
              </Link>
              <span className="opacity-50">›</span>
              {category && (
                <>
                  <Link href={`/category/${category.slug}`} className="transition hover:text-brand">
                    {category.title}
                  </Link>
                  <span className="opacity-50">›</span>
                </>
              )}
              <span className="min-w-0 break-words text-ink-soft">{post.title}</span>
            </nav>

            {category && (
              <span
                className="mb-4 inline-block rounded-full px-3.5 py-1.5 text-[14px] font-extrabold text-white"
                style={{ backgroundColor: category.color || 'var(--brand)' }}
              >
                {category.title}
              </span>
            )}

            <h1 className="text-pretty font-serif text-[clamp(30px,4.6vw,52px)] font-black leading-[1.24]">
              {post.title}
            </h1>

            {/* التاريخ والمشاركة — بدون اسم الكاتب */}
            <div className="mt-5 flex flex-wrap items-center gap-4 border-y border-border py-3.5">
              <span className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-muted-foreground">
                <IconClock className="size-3 opacity-80" />
                {post.publishedAt && (
                  <>
                    {formatGregorian(post.publishedAt)} · {formatTime(post.publishedAt)}
                  </>
                )}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-muted-foreground">
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-3" aria-hidden="true">
                  <path d="M13 3a9 9 0 1 0 8 8h-2a7 7 0 1 1-6-7V3z" />
                  <path d="M12 8v5l4 2 .8-1.6L13.5 12V8z" />
                </svg>
                {minutes} دقائق قراءة
              </span>
              <ShareButtons url={fullUrl} title={post.title} className="ms-auto" />
            </div>

            <ReaderTools />

            {/* الصورة الرئيسية */}
            {hero && (
              <figure className="my-6">
                <div className="relative aspect-16/9 overflow-hidden rounded-[14px] shadow-sm">
                  <Media resource={hero} size="medium" fill imgClassName="object-cover" />
                </div>
                {post.heroCaption && (
                  <figcaption className="ah-hide-in-reading mt-2.5 border-s-[3px] border-border ps-2.5 text-[14px] text-muted-foreground">
                    {post.heroCaption}
                  </figcaption>
                )}
              </figure>
            )}

            {/* المحتوى */}
            <div
              id="article-body"
              className="prose prose-lg dark:prose-invert max-w-none text-[18px] leading-[1.9] sm:text-[20px] lg:text-[21px] lg:leading-[2] prose-headings:font-serif prose-a:text-brand"
            >
              <RichText data={post.content} enableGutter={false} enableProse={false} />
            </div>

            {/* معرض الصور */}
            {post.type === 'photo' && post.gallery && post.gallery.length > 0 && (
              <div className="mt-8 flex flex-col gap-6">
                {post.gallery.map((g, i) => {
                  const img = typeof g.image === 'object' ? (g.image as MediaType) : null
                  if (!img) return null
                  return (
                    <figure key={g.id ?? i}>
                      <div className="relative aspect-16/9 overflow-hidden rounded-[14px] shadow-sm">
                        <Media resource={img} size="medium" fill imgClassName="object-cover" />
                      </div>
                      <figcaption className="mt-2 flex items-center justify-between gap-3 border-s-[3px] border-brand ps-2.5 text-[14.5px] text-muted-foreground">
                        <span>{g.caption}</span>
                        <span className="shrink-0 text-[13.5px] font-extrabold text-brand">
                          {i + 1} / {post.gallery!.length}
                        </span>
                      </figcaption>
                    </figure>
                  )
                })}
              </div>
            )}

            {/* الوسوم */}
            {tags.length > 0 && (
              <div className="ah-hide-in-reading mt-8 flex flex-wrap items-center gap-2.5 border-t border-border pt-5">
                <span className="text-sm font-extrabold text-ink-soft">وسوم:</span>
                {tags.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tag/${t.slug}`}
                    className="rounded-full border border-border bg-secondary px-3.5 py-1.5 text-[14.5px] font-medium text-ink-soft transition hover:border-brand hover:text-brand"
                  >
                    {t.title}
                  </Link>
                ))}
              </div>
            )}

            {/* مشاركة سفلية */}
            <div className="ah-hide-in-reading mt-6 flex flex-wrap items-center justify-between gap-3.5 rounded-[14px] bg-brand-tint px-5 py-4">
              <b className="text-[16.5px] font-extrabold text-brand-deep">شارك هذا الخبر</b>
              <ShareButtons url={fullUrl} title={post.title} />
            </div>
          </article>

          <div className="ah-hide-in-reading">
            <Sidebar mostRead={mostRead} />
          </div>
        </div>

        {/* ذات صلة */}
        {related.length > 0 && (
          <section className="ah-hide-in-reading mt-10">
            <AdSlot source="google" size="970×90" name="Leaderboard" className="mb-8 h-[104px]" />
            <div className="mb-4 flex items-center gap-3.5">
              <h2 className="relative ps-3.5 font-serif text-[22px] font-extrabold">
                <span className="absolute start-0 top-1/2 h-[22px] w-[5px] -translate-y-1/2 rounded bg-brand" />
                اقرأ أيضاً
              </h2>
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {related.slice(0, 4).map((p) => (
                <NewsCard key={p.id} item={toNewsItem(p)} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const post = await queryPostBySlug({ slug: decodeURIComponent(slug) })
  return generateMeta({ doc: post })
}

const queryPostBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'posts',
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    depth: 2,
    where: { slug: { equals: slug } },
  })
  return (result.docs?.[0] as Post | undefined) || null
})
