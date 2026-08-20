/**
 * حدّ معدّل بسيط في الذاكرة.
 *
 * نقاط قياس الإعلانات مفتوحة بالضرورة — القارئ ليس مسجّلاً — فيستطيع أي
 * سطر واحد أن ينفخ عدّاد الظهور مليون مرّة. والرقم المنفوخ يصير تقريراً
 * كاذباً نعطيه للمعلن ونحن لا ندري، وكل استدعاء كتابةٌ على قاعدة البيانات
 * نفسها التي تخدم القرّاء.
 *
 * الذاكرة تكفي هنا: التطبيق عملية واحدة، وفقدان العدّادات عند إعادة
 * التشغيل لا يضرّ — أسوأ ما يحدث أن يُحتسب ظهور زائد بعد كل نشر.
 */

/** المفتاح ← لحظة انتهاء منعه */
const seen = new Map<string, number>()

/** سقف يمنع نموّ الخريطة بلا حدّ تحت هجوم يبدّل المفاتيح */
const MAX_KEYS = 100_000

const sweep = (now: number) => {
  for (const [key, expires] of seen) if (expires <= now) seen.delete(key)
}

/** هل يُسمح بهذا المفتاح الآن؟ الاستدعاء الأول نعم، وما تكرّر داخل النافذة لا */
export const allowOnce = (key: string, windowMs: number): boolean => {
  const now = Date.now()
  const expires = seen.get(key)
  if (expires && expires > now) return false

  if (seen.size >= MAX_KEYS) {
    sweep(now)
    // الكنس لم يحرّر شيئاً: هجوم يبدّل المفاتيح — نرفض بدل أن نستهلك الذاكرة
    if (seen.size >= MAX_KEYS) return false
  }

  seen.set(key, now + windowMs)
  return true
}

/**
 * عنوان الزائر الحقيقي.
 * الطلب يمرّ بوسيطين: Cloudflare ثم Apache. أوّل عنوان في السلسلة هو
 * الزائر، وما بعده وسطاء — وأخذ آخرها يجعل كل الزوّار عنواناً واحداً.
 */
export const clientIp = (headers: Headers): string =>
  headers.get('cf-connecting-ip') ||
  headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
  headers.get('x-real-ip') ||
  'unknown'
