import type { Metadata } from 'next'
import React from 'react'

import { TagView, queryTag } from './TagView'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

export const revalidate = 60

type Args = { params: Promise<{ slug?: string }> }

export default async function TagPage({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  return <TagView slug={decodeURIComponent(slug)} page={1} />
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const tag = await queryTag(decodeURIComponent(slug))
  if (!tag) return { title: 'وسم غير موجود — أخبار حياة' }
  const title = `${tag.title} — أخبار حياة`
  const description = `كل ما نُشر تحت وسم ${tag.title} على أخبار حياة.`
  return { title, description, openGraph: mergeOpenGraph({ title, description }) }
}
