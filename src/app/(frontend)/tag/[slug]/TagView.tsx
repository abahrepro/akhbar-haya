import configPromise from '@payload-config'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React, { cache } from 'react'

import type { Post, Tag } from '@/payload-types'
import { ArchivePagination } from '@/components/News/ArchivePagination'
import { NewsCard } from '@/components/News/Cards'
import { Sidebar } from '@/components/News/Sidebar'
import { toNewsItem } from '@/components/News/types'

/** أخبار لكل صفحة */
export const PAGE_SIZE = 24

export const queryTag = cache(async (slug: string) => {
  const payload = await getPayload({ config: configPromise })
  const res = await payload.find({
    collection: 'tags',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  return (res.docs?.[0] as Tag | undefined) ?? null
})

export const TagView: React.FC<{ slug: string; page: number }> = async ({ slug, page }) => {
  const tag = await queryTag(slug)
  if (!tag) notFound()

  const payload = await getPayload({ config: configPromise })
  const [postsRes, mostReadRes] = await Promise.all([
    payload.find({
      collection: 'posts',
      where: { and: [{ _status: { equals: 'published' } }, { tags: { in: [tag.id] } }] },
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
  const basePath = `/tag/${slug}`

  return (
    <main className="container py-6">
      <nav className="mb-4 flex items-center gap-2 text-[14px] font-medium text-muted-foreground">
        <Link href="/" className="transition hover:text-brand">
          الرئيسية
        </Link>
        <span className="opacity-50">›</span>
        {page === 1 ? (
          <span className="text-ink-soft">وسم: {tag.title}</span>
        ) : (
          <>
            <Link href={basePath} className="transition hover:text-brand">
              وسم: {tag.title}
            </Link>
            <span className="opacity-50">›</span>
            <span className="text-ink-soft">صفحة {page.toLocaleString('ar-EG')}</span>
          </>
        )}
      </nav>

      <div className="mb-7 border-b border-border pb-5">
        <span className="text-[14px] font-bold text-muted-foreground">الوسم</span>
        <h1 className="mt-1 font-serif text-[clamp(26px,4vw,40px)] font-black">
          # {tag.title}
          {page > 1 && (
            <span className="text-[0.5em] font-bold text-muted-foreground">
              {' '}
              — صفحة {page.toLocaleString('ar-EG')}
            </span>
          )}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {postsRes.totalDocs.toLocaleString('ar-EG')} خبراً بهذا الوسم
        </p>
      </div>

      <div className="flex min-w-0 flex-col gap-10 lg:grid lg:items-start lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {items.length === 0 ? (
            <p className="py-16 text-center text-ink-soft">لا توجد أخبار بهذا الوسم حالياً.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
                {items.map((item) => (
                  <NewsCard key={item.id} item={item} showExcerpt />
                ))}
              </div>
              <ArchivePagination
                page={postsRes.page ?? page}
                totalPages={postsRes.totalPages}
                basePath={basePath}
              />
            </>
          )}
        </div>
        <Sidebar mostRead={mostRead} />
      </div>
    </main>
  )
}
