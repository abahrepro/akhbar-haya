/**
 * توحيد النص العربي ومطابقة العبارات.
 *
 * العربية تُكتب بأشكال متعدّدة للحرف نفسه: «الأردن» و«الاردن» و«الآردن»
 * ثلاث سلاسل مختلفة تماماً في نظر قاعدة البيانات، وهي كلمة واحدة عند القارئ.
 * هذا الملف يوحّدها ليقارَن المعنى لا الحروف — يستعمله دمج الوسوم المكرّرة
 * واقتراح الوسوم من نصّ الخبر معاً، فيبقى التوحيد واحداً في الموضعين.
 */

/** حروف العربية — لتمييز حدود الكلمة، إذ لا يعمل \b معها */
const AR_LETTER = /[ء-ي]/

/**
 * يوحّد شكل الحرف: يحذف التشكيل والتطويل، ويردّ الهمزات إلى الألف،
 * والتاء المربوطة إلى الهاء، والألف المقصورة إلى الياء.
 */
export const normalizeArabic = (input: string): string =>
  input
    .replace(/[ً-ْٰـ]/g, '')
    .replace(/[آأإٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .toLowerCase()

/** السوابق الملتصقة: «بالأردن» و«والأردن» تعنيان «الأردن» */
const PROCLITIC = /^(?:[وفبكل]?ال|لل|[وفبك])(?=[ء-ي]{3,})/

/** يجرّد أل التعريف وما يسبقها من حروف الجرّ والعطف */
export const stripProclitic = (word: string): string => word.replace(PROCLITIC, '')

/**
 * يقطّع النص إلى كلمات موحّدة.
 * الفاصل هو كل ما ليس حرفاً عربياً أو لاتينياً أو رقماً — فالترقيم
 * والأقواس والروابط لا تُنتج كلمات وهمية.
 */
export const tokenize = (text: string): string[] =>
  normalizeArabic(text)
    .split(/[^ء-يa-z0-9]+/)
    .filter(Boolean)

/** أطول عبارة نبحث عنها — «الحد الأدنى للأجور» أربع كلمات */
const MAX_NGRAM = 4

/**
 * مفاتيح البحث لعبارة ما: شكلها الموحّد، وشكلها بلا أل التعريف.
 * التخزين بالمفتاحين يجعل الوسم «الأردن» يُلتقط من «في الأردن» و«بالأردن» معاً.
 */
export const phraseKeys = (phrase: string): string[] => {
  const words = tokenize(phrase)
  if (words.length === 0) return []
  const full = words.join(' ')
  const bare = [stripProclitic(words[0]), ...words.slice(1)].join(' ')
  return bare !== full ? [full, bare] : [full]
}

/**
 * يمرّ على كل عبارات النص حتى أربع كلمات ويستدعي `visit` بمفتاحها.
 * المرور مرّة واحدة على النص أسرع بكثير من تجربة ٧٬٣٦٦ وسماً عليه.
 */
export const forEachPhrase = (
  text: string,
  visit: (key: string, words: number) => void,
): void => {
  const words = tokenize(text)
  for (let i = 0; i < words.length; i++) {
    for (let n = 1; n <= MAX_NGRAM && i + n <= words.length; n++) {
      const slice = words.slice(i, i + n)
      const full = slice.join(' ')
      visit(full, n)
      const bare = [stripProclitic(slice[0]), ...slice.slice(1)].join(' ')
      if (bare !== full) visit(bare, n)
    }
  }
}

export const hasArabicLetter = (s: string): boolean => AR_LETTER.test(s)
