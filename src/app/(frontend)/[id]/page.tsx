import type { Metadata } from 'next'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import React, { cache } from 'react'

import type { Page } from '@/payload-types'
import RichText from '@/components/RichText'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { generateMeta } from '@/utilities/generateMeta'

/**
 * الصفحات الثابتة.
 *
 * كانت تُركّب من «الكتل»؛ صارت نصّاً واحداً يكتبه صاحب الموقع في محرّر
 * يعرفه. والمسار يبقى `/الرابط` بلا بادئة كي لا تتغيّر روابط منشورة.
 */

export const revalidate = 300
export const dynamicParams = true

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const pages = await payload.find({
    collection: 'pages',
    draft: false,
    limit: 200,
    pagination: false,
    overrideAccess: false,
    select: { slug: true },
  })

  return pages.docs
    .filter((doc) => doc.slug && doc.slug !== 'home')
    .map(({ slug }) => ({ id: slug as string }))
}

const queryPage = cache(async (slug: string) => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })
  const res = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    draft,
    limit: 1,
    pagination: false,
    overrideAccess: draft,
  })
  return (res.docs?.[0] as Page | undefined) ?? null
})

type Args = { params: Promise<{ id?: string }> }

export default async function StaticPage({ params: paramsPromise }: Args) {
  const { id = '' } = await paramsPromise
  const slug = decodeURIComponent(id)
  const page = await queryPage(slug)
  if (!page) notFound()

  const { isEnabled: draft } = await draftMode()

  return (
    <main className="container py-8">
      {draft && <LivePreviewListener />}
      <article className="mx-auto max-w-[760px]">
        <h1 className="mb-6 border-b border-border pb-4 font-serif text-[clamp(26px,4vw,38px)] font-black">
          {page.title}
        </h1>
        <div className="ah-static">
          {page.content && <RichText data={page.content} enableGutter={false} enableProse={false} />}
        </div>
      </article>
    </main>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { id = '' } = await paramsPromise
  const page = await queryPage(decodeURIComponent(id))
  if (!page) return { title: 'صفحة غير موجودة — أخبار حياة' }
  return generateMeta({ doc: page })
}
