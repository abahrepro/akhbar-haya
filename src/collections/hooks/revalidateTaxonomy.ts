import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath } from 'next/cache'

/**
 * تحديث كل الصفحات بعد تعديل قسم أو وسم.
 *
 * القائمة العلوية تُبنى من الأقسام وتظهر في **كل** صفحة، فتغيير الترتيب
 * أو الاسم أو الإظهار يمسّ الموقع بأكمله لا صفحة القسم وحدها. بدون ذلك
 * تُصلح الرئيسية نفسها عند انتهاء مدّتها بينما تبقى صفحات الأخبار
 * المخزّنة تعرض القائمة القديمة إلى أجل غير مسمّى.
 *
 * `revalidatePath('/', 'layout')` يبطل الصفحات المبنية على التخطيط الجذر —
 * لا يعيد بناءها فوراً، بل يجعل كلاً منها تُبنى عند أول طلب لها.
 */
const revalidateAll = (
  slugPrefix: 'category' | 'tag',
  doc: { slug?: string | null } | null,
  previousDoc?: { slug?: string | null } | null,
): void => {
  try {
    for (const d of [doc, previousDoc]) {
      // تغيير الاسم اللطيف يترك الرابط القديم معلّقاً بمحتوى قديم
      if (d?.slug) revalidatePath(`/${slugPrefix}/${d.slug}`)
    }
    revalidatePath('/', 'layout')
  } catch {
    // خارج سياق طلب Next — يحدث في سكربتات الترحيل
  }
}

export const revalidateCategory: CollectionAfterChangeHook = ({ doc, previousDoc, req }) => {
  if (!req.context?.disableRevalidate) revalidateAll('category', doc, previousDoc)
  return doc
}

export const revalidateCategoryDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
  if (!req.context?.disableRevalidate) revalidateAll('category', doc)
  return doc
}

export const revalidateTag: CollectionAfterChangeHook = ({ doc, previousDoc, req }) => {
  if (!req.context?.disableRevalidate) revalidateAll('tag', doc, previousDoc)
  return doc
}

export const revalidateTagDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
  if (!req.context?.disableRevalidate) revalidateAll('tag', doc)
  return doc
}
