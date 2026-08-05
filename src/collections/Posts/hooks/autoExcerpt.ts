import type { CollectionBeforeChangeHook } from 'payload'

import type { Post } from '@/payload-types'

/**
 * يشتقّ المقتطف من مطلع الخبر حين يتركه المحرّر فارغاً.
 *
 * المقتطف يغذّي ثلاثة مواضع: وصف جوجل، ومعاينة المشاركة، ونصّ البطاقة في
 * الصفحات. تركه فارغاً يُفقدها جميعاً، وملؤه يدوياً في كل خبر عبء يتكرّر
 * مئة مرة يومياً — ومطلع الخبر الصحفي هو الملخّص أصلاً.
 */

/** يجمع النصّ من شجرة Lexical مهما تعمّقت */
const collectText = (node: unknown, out: string[], budget = { left: 900 }): void => {
  if (budget.left <= 0 || !node || typeof node !== 'object') return
  const n = node as { type?: string; text?: string; children?: unknown[] }

  // العناوين والاقتباسات ليست مطلعاً للخبر
  if (n.type === 'heading' || n.type === 'quote') return

  if (typeof n.text === 'string' && n.text.trim()) {
    out.push(n.text)
    budget.left -= n.text.length
  }
  if (Array.isArray(n.children)) for (const c of n.children) collectText(c, out, budget)
}

/** يقصّ عند نهاية جملة كي لا ينتهي المقتطف ببتر */
const trimToSentence = (text: string, max = 180): string => {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const stop = Math.max(cut.lastIndexOf('.'), cut.lastIndexOf('؟'), cut.lastIndexOf('!'))
  // نقبل الجملة إن قاربت الحدّ، وإلا نقصّ عند آخر مسافة
  if (stop > max * 0.55) return cut.slice(0, stop + 1)
  const space = cut.lastIndexOf(' ')
  return (space > 0 ? cut.slice(0, space) : cut).trimEnd() + '…'
}

export const autoExcerpt: CollectionBeforeChangeHook<Post> = ({ data }) => {
  if (data.excerpt && data.excerpt.trim()) return data
  if (!data.content) return data

  const parts: string[] = []
  collectText((data.content as { root?: unknown }).root, parts)

  const text = parts
    .join(' ')
    .replace(/\s+/g, ' ')
    // مطلع الخبر في الأرشيف يبدأ باسم الموقع — لا معنى لتكراره في الوصف
    .replace(/^أخبار حياة\s*[–—-]\s*/, '')
    .trim()

  if (text) data.excerpt = trimToSentence(text)
  return data
}
