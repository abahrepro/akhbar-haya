import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { CategoryView, queryCategory } from '../../CategoryView'

export const revalidate = 60

/**
 * صفحات الأرشيف العميقة تُبنى عند الطلب.
 * أكبر قسم يتجاوز ألفي صفحة، فبناؤها كلها مسبقاً بلا فائدة.
 */
export const dynamicParams = true
export const generateStaticParams = async () => []

type Args = { params: Promise<{ slug?: string; pageNumber?: string }> }

const parsePage = (raw?: string): number => {
  const n = Number(raw)
  // نرفض غير الأعداد، والكسور، والصفر فما دون — و«1» لأنها مسار القسم نفسه
  if (!Number.isInteger(n) || n < 2) notFound()
  return n
}

export default async function CategoryPaginatedPage({ params: paramsPromise }: Args) {
  const { slug = '', pageNumber } = await paramsPromise
  return <CategoryView slug={decodeURIComponent(slug)} page={parsePage(pageNumber)} />
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '', pageNumber } = await paramsPromise
  const category = await queryCategory(decodeURIComponent(slug))
  if (!category) return { title: 'قسم غير موجود — أخبار حياة' }
  const page = Number(pageNumber)
  return {
    title: `${category.title} — صفحة ${page} — أخبار حياة`,
    description: `أرشيف أخبار ${category.title} — صفحة ${page}.`,
    // صفحات الأرشيف العميقة تُتابَع روابطها لكن لا تُفهرس، تفادياً للمحتوى الضعيف
    robots: { index: false, follow: true },
  }
}
