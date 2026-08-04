import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { TagView, queryTag } from '../../TagView'

export const revalidate = 60

/** صفحات الوسوم العميقة تُبنى عند الطلب — الوسوم تتجاوز سبعة آلاف */
export const dynamicParams = true
export const generateStaticParams = async () => []

type Args = { params: Promise<{ slug?: string; pageNumber?: string }> }

const parsePage = (raw?: string): number => {
  const n = Number(raw)
  // نرفض غير الأعداد والكسور والصفر فما دون — و«١» لأنها مسار الوسم نفسه
  if (!Number.isInteger(n) || n < 2) notFound()
  return n
}

export default async function TagPaginatedPage({ params: paramsPromise }: Args) {
  const { slug = '', pageNumber } = await paramsPromise
  return <TagView slug={decodeURIComponent(slug)} page={parsePage(pageNumber)} />
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '', pageNumber } = await paramsPromise
  const tag = await queryTag(decodeURIComponent(slug))
  if (!tag) return { title: 'وسم غير موجود — أخبار حياة' }
  const page = Number(pageNumber)
  return {
    title: `${tag.title} — صفحة ${page} — أخبار حياة`,
    // صفحات الأرشيف العميقة تُتابَع روابطها لكن لا تُفهرس
    robots: { index: false, follow: true },
  }
}
