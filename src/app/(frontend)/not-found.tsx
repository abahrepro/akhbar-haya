import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import { SearchField } from './search/SearchField'

export default async function NotFound() {
  let cats: { title: string; slug?: string | null }[] = []
  try {
    const payload = await getPayload({ config: configPromise })
    const res = await payload.find({
      collection: 'categories',
      where: { showInNav: { equals: true } },
      sort: 'order',
      limit: 5,
      depth: 0,
      select: { title: true, slug: true },
    })
    cats = res.docs
  } catch {
    /* الصفحة تعمل حتى لو تعذّر جلب الأقسام */
  }

  return (
    <main className="container py-16">
      <div className="mx-auto max-w-[640px] text-center">
        <div className="bg-linear-135 from-brand to-gold bg-clip-text font-serif text-[clamp(90px,20vw,150px)] font-black leading-none text-transparent">
          404
        </div>
        <h1 className="mt-1.5 font-serif text-[clamp(22px,3.4vw,30px)] font-extrabold">
          عذراً، الصفحة غير موجودة
        </h1>
        <p className="mx-auto mt-3 mb-5 max-w-[52ch] text-base leading-[1.8] text-ink-soft">
          ربما حُذف الخبر أو تغيّر رابطه. جرّب البحث، أو تصفّح أحد الأقسام أدناه، أو عُد إلى الصفحة
          الرئيسية.
        </p>

        <SearchField />

        {cats.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            {cats.map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className="rounded-full border border-border bg-secondary px-4 py-2 text-[13.5px] font-bold text-ink-soft transition hover:border-brand hover:text-brand"
              >
                {c.title}
              </Link>
            ))}
          </div>
        )}

        <Link
          href="/"
          className="mt-7 inline-block rounded-full bg-brand px-7 py-3 font-bold text-white transition hover:bg-brand-deep"
        >
          العودة إلى الرئيسية
        </Link>
      </div>
    </main>
  )
}
