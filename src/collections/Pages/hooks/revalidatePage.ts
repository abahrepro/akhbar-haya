import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Page } from '../../../payload-types'

/**
 * تفريغ ذاكرة مسار الصفحة.
 *
 * `revalidatePath` يرمي خارج سياق طلب Next، وأي سكربت صيانة يعدّل صفحة
 * كان ينهار عند هذا السطر بعد أن تُكتب الصفحة فعلاً — فيبدو الفشل وكأنّ
 * الحفظ لم يتمّ. الفشل هنا يعني صفحة قديمة حتى انتهاء مدّة تخزينها، لا
 * سبباً لإسقاط العملية.
 */
const purge = (path: string) => {
  try {
    revalidatePath(path)
    revalidateTag('pages-sitemap', 'max')
  } catch {
    /* خارج سياق الطلب — الصفحة تتجدّد بدورتها المعتادة */
  }
}

const pathOf = (slug?: string | null) => (slug === 'home' ? '/' : `/${slug ?? ''}`)

export const revalidatePage: CollectionAfterChangeHook<Page> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return doc

  if (doc._status === 'published') {
    payload.logger.info(`تفريغ ذاكرة الصفحة: ${pathOf(doc.slug)}`)
    purge(pathOf(doc.slug))
  }

  // الصفحة التي سُحبت من النشر يجب أن يُفرَّغ مسارها القديم أيضاً
  if (previousDoc?._status === 'published' && doc._status !== 'published') {
    purge(pathOf(previousDoc.slug))
  }

  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Page> = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) purge(pathOf(doc?.slug))
  return doc
}
