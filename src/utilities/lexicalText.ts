/**
 * استخراج النصّ الصِّرف من شجرة Lexical.
 *
 * المحرّر يخزّن الخبر شجرةَ عُقد لا نصّاً، فأي ميزة تقرأ الخبر — اقتراح
 * الوسوم مثلاً — تحتاج تسطيحه أوّلاً.
 */

type Node = { type?: string; text?: string; children?: unknown[] }

/** يجمع نصّ العُقد مهما تعمّقت، ويقف عند حدّ يمنع نصّاً ضخماً من إبطاء المعالجة */
export const lexicalToPlainText = (content: unknown, maxChars = 12_000): string => {
  const out: string[] = []
  let left = maxChars

  const walk = (node: unknown): void => {
    if (left <= 0 || !node || typeof node !== 'object') return
    const n = node as Node
    if (typeof n.text === 'string' && n.text.trim()) {
      out.push(n.text)
      left -= n.text.length
    }
    if (Array.isArray(n.children)) for (const child of n.children) walk(child)
  }

  walk((content as { root?: unknown })?.root ?? content)
  return out.join(' ').replace(/\s+/g, ' ').trim()
}
