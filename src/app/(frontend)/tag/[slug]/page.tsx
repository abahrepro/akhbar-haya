import configPromise from '@payload-config'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React, { cache } from 'react'

import type { Post, Tag } from '@/payload-types'
import { NewsCard } from '@/components/News/Cards'
import { Sidebar } from '@/components/News/Sidebar'
import { toNewsItem } from '@/components/News/types'

export const revalidate = 60

type Args = { params: Promise<{ slug?: string }> }

const queryTag = cache(async (slug: string) => {
  const payload = await getPayload({ config: configPromise })
  const res = await payload.find({
    collection: 'tags',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  return (res.docs?.[0] as Tag | undefined) ?? null
})

export default async function TagPage({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  const tag = await queryTag(decodeURIComponent(slug))
  if (!tag) notFound()

  const payload = await getPayload({ config: configPromise })
  const [postsRes, mostReadRes] = await Promise.all([
    payload.find({
      collection: 'posts',
      where: { and: [{ _status: { equals: 'published' } }, { tags: { in: [tag.id] } }] },
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

  return (
    <main className="container py-6">
      <nav className="mb-4 flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
        <Link href="/" className="transition hover:text-brand">
          الرئيسية
        </Link>
        <span className="opacity-50">›</span>
        <span className="text-ink-soft">وسم: {tag.title}</span>
      </nav>

      <div className="mb-7 border-b border-border pb-5">
        <span className="text-[13px] font-bold text-muted-foreground">الوسم</span>
        <h1 className="mt-1 font-serif text-[clamp(26px,4vw,40px)] font-black"># {tag.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{postsRes.totalDocs} خبراً بهذا الوسم</p>
      </div>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {items.length === 0 ? (
            <p className="py-16 text-center text-ink-soft">لا توجد أخبار بهذا الوسم حالياً.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <NewsCard key={item.id} item={item} showExcerpt />
              ))}
            </div>
          )}
        </div>
        <Sidebar mostRead={mostRead} />
      </div>
    </main>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const tag = await queryTag(decodeURIComponent(slug))
  return { title: tag ? `${tag.title} — أخبار حياة` : 'وسم غير موجود — أخبار حياة' }
}
