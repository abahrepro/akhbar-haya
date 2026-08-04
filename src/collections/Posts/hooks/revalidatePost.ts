import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, Payload } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Category, Post, Tag } from '../../../payload-types'
import { postHref } from '@/utilities/postUrl'

/**
 * تحديث كل الصفحات المتأثّرة بعد تعديل خبر.
 *
 * تحديث صفحة الخبر وحدها لا يكفي: الخبر يظهر أيضاً في الرئيسية وصفحات
 * قسمه ووسومه. تركُها لمدّة إعادة التحقّق يعني تأخّر الخبر العاجل دقيقة
 * أو أكثر عن الواجهة — وقت طويل في موقع أخبار.
 */

/** يستخرج المعرّفات سواء أتت أرقاماً أو مستندات كاملة */
const idsOf = (v: unknown): (number | string)[] => {
  if (!Array.isArray(v)) return []
  return v
    .map((x) => (typeof x === 'object' && x !== null ? (x as { id?: number | string }).id : x))
    .filter((x): x is number | string => x !== undefined && x !== null)
}

/** يجلب الأسماء اللطيفة لمجموعة معرّفات باستعلام واحد */
const slugsFor = async (
  payload: Payload,
  collection: 'categories' | 'tags',
  ids: (number | string)[],
): Promise<string[]> => {
  if (ids.length === 0) return []
  const res = await payload.find({
    collection,
    where: { id: { in: ids } },
    limit: ids.length,
    depth: 0,
    select: { slug: true },
    overrideAccess: true,
  })
  return (res.docs as (Category | Tag)[]).map((d) => d.slug).filter((s): s is string => Boolean(s))
}

const revalidateAll = async (
  payload: Payload,
  doc: Post | null,
  previousDoc: Post | null,
): Promise<void> => {
  const paths = new Set<string>(['/'])

  if (doc?._status === 'published') paths.add(postHref(doc))
  // تغيّر الاسم اللطيف أو إلغاء النشر يترك الرابط القديم معلّقاً
  if (previousDoc?._status === 'published') paths.add(postHref(previousDoc))

  // الأقسام والوسوم — الحالية والسابقة معاً، فقد تكون تغيّرت
  const catIds = [...idsOf(doc?.categories), ...idsOf(previousDoc?.categories)]
  const tagIds = [...idsOf(doc?.tags), ...idsOf(previousDoc?.tags)]

  const [cats, tags] = await Promise.all([
    slugsFor(payload, 'categories', [...new Set(catIds)]),
    slugsFor(payload, 'tags', [...new Set(tagIds)]),
  ])

  cats.forEach((s) => paths.add(`/category/${s}`))
  tags.forEach((s) => paths.add(`/tag/${s}`))

  // صفحة البثّ المباشر تعرض العاجل
  if (doc?.breaking || previousDoc?.breaking) paths.add('/live')

  for (const p of paths) {
    try {
      revalidatePath(p)
    } catch {
      // خارج سياق طلب Next — يحدث في سكربتات الترحيل
    }
  }

  try {
    revalidateTag('posts-sitemap', 'max')
  } catch {
    /* كما أعلاه */
  }

  payload.logger.info(`تحديث ${paths.size} مسار: ${[...paths].slice(0, 5).join(' ، ')}`)
}

export const revalidatePost: CollectionAfterChangeHook<Post> = async ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) await revalidateAll(payload, doc, previousDoc ?? null)
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Post> = async ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) await revalidateAll(payload, null, doc ?? null)
  return doc
}
