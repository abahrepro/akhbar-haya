import configPromise from '@payload-config'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import React from 'react'

import { CategoryView, queryCategory } from './CategoryView'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getServerSideURL } from '@/utilities/getURL'

export const revalidate = 60

type Args = { params: Promise<{ slug?: string }> }

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
  return <CategoryView slug={decodeURIComponent(slug)} page={1} />
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const category = await queryCategory(decodeURIComponent(slug))
  if (!category) return { title: 'قسم غير موجود — أخبار حياة' }
  const title = `${category.title} — أخبار حياة`
  const description = category.description || `آخر أخبار ${category.title} على أخبار حياة.`
  // صورة الهوية — القسم يمثّل الموقع لا خبراً بعينه
  return {
    title,
    description,
    openGraph: mergeOpenGraph({ title, description }),
    alternates: { canonical: `${getServerSideURL()}/category/${encodeURIComponent(category.slug ?? '')}` },
  }
}
