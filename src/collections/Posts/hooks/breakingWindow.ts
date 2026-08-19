import type { CollectionBeforeChangeHook } from 'payload'

import type { Post } from '@/payload-types'

/** المدّة حين يتركها المحرّر فارغة */
export const DEFAULT_BREAKING_MINUTES = 60

/**
 * يحسب لحظة انتهاء العاجل عند كل حفظ.
 *
 * الموقع يقارن بهذه اللحظة بدل انتظار مهمّة مجدولة تفكّ التأشير: المقارنة
 * دقيقة إلى الدقيقة، والمهمّة المجدولة تتأخّر بقدر فترتها ولا تعمل إن
 * تعطّلت. وحين يُرفع التأشير تُمسح اللحظة فلا تبقى قيمة تضلّل الحالة.
 */
export const breakingWindow: CollectionBeforeChangeHook<Post> = ({ data, originalDoc }) => {
  if (!data.breaking) {
    data.breakingUntil = null
    return data
  }

  const minutes = Number(data.breakingMinutes) || DEFAULT_BREAKING_MINUTES

  /**
   * لا نمدّد العمر مع كل تعديل: تصحيح خطأ مطبعي بعد نصف ساعة كان سيعيد
   * العدّاد إلى أوّله. نعيد الحساب فقط عند بدء العاجل أو تغيير مدّته.
   */
  const justFlagged = !originalDoc?.breaking
  const minutesChanged = originalDoc?.breakingMinutes !== data.breakingMinutes

  if (justFlagged || minutesChanged || !originalDoc?.breakingUntil) {
    data.breakingUntil = new Date(Date.now() + minutes * 60_000).toISOString()
  }

  return data
}
