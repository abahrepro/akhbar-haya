import configPromise from '@payload-config'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import type { Post } from '@/payload-types'
import { NewsImage, TimeStamp } from '@/components/News/Bits'
import { Sidebar } from '@/components/News/Sidebar'
import { toNewsItem, type NewsItem } from '@/components/News/types'
import { SearchField } from './SearchField'

type Args = { searchParams: Promise<{ q?: string }> }

const POPULAR = ['الملكية العقارية', 'مجلس النواب', 'أسعار الذهب', 'غزة', 'الطقس', 'كأس آسيا']

export default async function SearchPage({ searchParams }: Args) {
  const { q = '' } = await searchParams
  const query = q.trim()
  const payload = await getPayload({ config: configPromise })

  // الاستعلامان متوازيان — تنفيذهما تتابعاً كان يضاعف زمن الصفحة
  const [searchRes, mostReadRes] = await Promise.all([
    query
      ? payload.find({
          collection: 'posts',
          where: {
            and: [
              { _status: { equals: 'published' } },
              {
                or: [
                  { title: { like: query } },
                  { excerpt: { like: query } },
                  { 'meta.description': { like: query } },
                ],
              },
            ],
          },
          sort: '-publishedAt',
          limit: 24,
          depth: 1,
        })
      : Promise.resolve(null),
    payload.find({
      collection: 'posts',
      where: { _status: { equals: 'published' } },
      sort: '-publishedAt',
      limit: 5,
      depth: 1,
    }),
  ])

  const results: NewsItem[] = searchRes ? (searchRes.docs as Post[]).map(toNewsItem) : []
  const total = searchRes?.totalDocs ?? 0
  const mostRead = (mostReadRes.docs as Post[]).map(toNewsItem)

  return (
    <main className="container py-8">
      <div className="mb-7 text-center">
        <h1 className="font-serif text-[clamp(26px,4vw,38px)] font-black">نتائج البحث</h1>
        <SearchField initial={query} />
        {query && (
          <p className="mt-4 text-sm font-semibold text-muted-foreground">
            نتائج البحث عن «{query}» — {total} خبراً
          </p>
        )}
      </div>

      {!query ? (
        <div className="mx-auto max-w-[640px] text-center">
          <p className="mb-4 text-ink-soft">اكتب كلمة للبحث في أرشيف أخبار حياة.</p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {POPULAR.map((p) => (
              <Link
                key={p}
                href={`/search?q=${encodeURIComponent(p)}`}
                className="rounded-full border border-border bg-secondary px-4 py-2 text-[13.5px] font-bold text-ink-soft transition hover:border-brand hover:text-brand"
              >
                {p}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            {results.length === 0 ? (
              <div className="py-14 text-center">
                <p className="mb-2 text-lg font-bold">لا توجد نتائج مطابقة</p>
                <p className="text-ink-soft">جرّب كلمات أخرى أو تصفّح الأقسام.</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {results.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="group grid grid-cols-[110px_1fr] gap-4 border-b border-border py-4 sm:grid-cols-[180px_1fr]"
                  >
                    <div className="relative aspect-16/10 overflow-hidden rounded-[9px]">
                      <NewsImage item={item} size="small" />
                    </div>
                    <div className="flex min-w-0 flex-col gap-2">
                      {item.category && (
                        <span
                          className="text-xs font-extrabold"
                          style={{ color: item.category.color || 'var(--brand)' }}
                        >
                          {item.category.title}
                        </span>
                      )}
                      <h3 className="text-balance font-serif text-[clamp(17px,2.4vw,21px)] font-bold leading-[1.4] transition group-hover:text-brand">
                        {item.title}
                      </h3>
                      {item.excerpt && (
                        <p className="line-clamp-2 text-sm leading-[1.7] text-ink-soft">
                          {item.excerpt}
                        </p>
                      )}
                      <TimeStamp date={item.publishedAt} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Sidebar mostRead={mostRead} />
        </div>
      )}
    </main>
  )
}

export const metadata: Metadata = {
  title: 'البحث — أخبار حياة',
  description: 'ابحث في أرشيف أخبار حياة.',
}
