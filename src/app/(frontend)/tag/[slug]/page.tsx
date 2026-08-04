import type { Metadata } from 'next'
import React from 'react'

import { TagView, queryTag } from './TagView'

export const revalidate = 60

type Args = { params: Promise<{ slug?: string }> }

export default async function TagPage({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  return <TagView slug={decodeURIComponent(slug)} page={1} />
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const tag = await queryTag(decodeURIComponent(slug))
  return { title: tag ? `${tag.title} — أخبار حياة` : 'وسم غير موجود — أخبار حياة' }
}
