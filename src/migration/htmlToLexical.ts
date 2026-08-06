/**
 * محوّل HTML (ووردبريس) → Lexical (محرّر Payload)
 *
 * يغطّي ما يظهر فعلياً في محتوى أخبار حياة:
 * فقرات، أسطر جديدة، غامق/مائل، روابط، عناوين، قوائم، اقتباسات، صور.
 */

type LexNode = Record<string, unknown>

const FORMAT = { bold: 1, italic: 2, underline: 8 } as const

/** فكّ ترميز كيانات HTML الشائعة */
const decode = (s: string): string =>
  s
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8230;/g, '…')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))

const textNode = (text: string, format = 0): LexNode => ({
  type: 'text',
  detail: 0,
  format,
  mode: 'normal',
  style: '',
  text,
  version: 1,
})

const paragraph = (children: LexNode[]): LexNode => ({
  type: 'paragraph',
  format: '',
  indent: 0,
  version: 1,
  direction: 'rtl',
  textFormat: 0,
  children: children.length ? children : [textNode('')],
})

const heading = (children: LexNode[], tag: string): LexNode => ({
  type: 'heading',
  tag,
  format: '',
  indent: 0,
  version: 1,
  direction: 'rtl',
  children,
})

const quote = (children: LexNode[]): LexNode => ({
  type: 'quote',
  format: '',
  indent: 0,
  version: 1,
  direction: 'rtl',
  children,
})

const linkNode = (children: LexNode[], url: string, newTab: boolean): LexNode => ({
  type: 'link',
  format: '',
  indent: 0,
  version: 3,
  direction: 'rtl',
  fields: { linkType: 'custom', newTab, url },
  children,
})

const listNode = (items: LexNode[], ordered: boolean): LexNode => ({
  type: 'list',
  listType: ordered ? 'number' : 'bullet',
  start: 1,
  tag: ordered ? 'ol' : 'ul',
  format: '',
  indent: 0,
  version: 1,
  direction: 'rtl',
  children: items,
})

const listItem = (children: LexNode[], value: number): LexNode => ({
  type: 'listitem',
  value,
  checked: undefined,
  format: '',
  indent: 0,
  version: 1,
  direction: 'rtl',
  children,
})

/**
 * يحوّل HTML سطري (داخل فقرة) إلى عقد نصّية مع التنسيق.
 * يدعم: <strong>/<b>, <em>/<i>, <u>, <a>, <br>
 */
const parseInline = (html: string): LexNode[] => {
  const out: LexNode[] = []

  // نقسّم على الوسوم السطرية المدعومة مع الحفاظ عليها
  const re = /<(strong|b|em|i|u|a)\b([^>]*)>([\s\S]*?)<\/\1>|<br\s*\/?>/gi
  let last = 0
  let m: RegExpExecArray | null

  const pushText = (raw: string, format = 0) => {
    const t = decode(raw.replace(/<[^>]+>/g, ''))
    if (t) out.push(textNode(t, format))
  }

  while ((m = re.exec(html)) !== null) {
    if (m.index > last) pushText(html.slice(last, m.index))

    if (m[0].toLowerCase().startsWith('<br')) {
      out.push({ type: 'linebreak', version: 1 })
    } else {
      const tag = m[1].toLowerCase()
      const attrs = m[2] || ''
      const inner = m[3] || ''

      if (tag === 'a') {
        const href = /href=["']([^"']+)["']/i.exec(attrs)?.[1] ?? ''
        const newTab = /target=["']_blank["']/i.test(attrs)
        const kids = parseInline(inner)
        if (href && kids.length) out.push(linkNode(kids, decode(href), newTab))
        else pushText(inner)
      } else {
        const fmt =
          tag === 'strong' || tag === 'b'
            ? FORMAT.bold
            : tag === 'em' || tag === 'i'
              ? FORMAT.italic
              : FORMAT.underline
        // نمرّر التنسيق للأبناء (يدعم التداخل البسيط)
        parseInline(inner).forEach((n) => {
          if (n.type === 'text') out.push({ ...n, format: ((n.format as number) || 0) | fmt })
          else out.push(n)
        })
      }
    }
    last = re.lastIndex
  }

  if (last < html.length) pushText(html.slice(last))
  return out
}

export type ExtractedImage = { src: string; alt: string; caption: string }

/**
 * علامة موضع الصورة داخل النصّ قبل ربطها بالوسائط.
 * سلسلة لا ترد في نصّ صحفي، فلا تلتبس بمحتوى حقيقي.
 */
export const IMG_MARK = '\u241E'

/** فقرة تحمل علامة صورة فقط ← رقم الصورة، وإلا null */
export const imageMarkIndex = (text: string): number | null => {
  const m = new RegExp(`^${IMG_MARK}(\\d+)${IMG_MARK}$`).exec(text.trim())
  return m ? Number(m[1]) : null
}

export type ConversionResult = {
  /** جذر Lexical جاهز للحفظ في حقل richText */
  root: { root: LexNode }
  /** الصور المضمّنة في النص — تُرحَّل لاحقاً */
  images: ExtractedImage[]
  /** نص عادي (لتوليد المقتطف عند غيابه) */
  plainText: string
}

/** يحوّل محتوى ووردبريس إلى بنية Lexical */
export const htmlToLexical = (html: string): ConversionResult => {
  const images: ExtractedImage[] = []
  const children: LexNode[] = []

  /**
   * الصورة تُستبدَل بعلامة موضعية لا تُحذف.
   * حذفها قبل تقطيع الكتل كان يفقد موضعها من الخبر، فتعود لاحقاً في آخر
   * النصّ أو لا تعود. العلامة تمرّ في تدفّق الكتل فتُستبدل عقدةَ صورة في
   * مكانها الأصلي بين الفقرات.
   */
  const mark = (i: number) => `<p>${IMG_MARK}${i}${IMG_MARK}</p>`

  const withoutFigures = html.replace(
    /<figure\b[^>]*>([\s\S]*?)<\/figure>/gi,
    (_, inner: string) => {
      const src = /src=["']([^"']+)["']/i.exec(inner)?.[1]
      if (!src) return ''
      images.push({
        src: decode(src),
        alt: decode(/alt=["']([^"']*)["']/i.exec(inner)?.[1] ?? ''),
        caption: decode(
          (/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i.exec(inner)?.[1] ?? '').replace(
            /<[^>]+>/g,
            '',
          ),
        ),
      })
      return mark(images.length - 1)
    },
  )

  // صور خارج figure
  const cleaned = withoutFigures.replace(/<img\b([^>]*)>/gi, (_, attrs: string) => {
    const src = /src=["']([^"']+)["']/i.exec(attrs)?.[1]
    if (!src) return ''
    images.push({
      src: decode(src),
      alt: decode(/alt=["']([^"']*)["']/i.exec(attrs)?.[1] ?? ''),
      caption: '',
    })
    return mark(images.length - 1)
  })

  // نمرّ على الكتل بالترتيب
  const blockRe =
    /<(h[1-6]|p|blockquote|ul|ol)\b[^>]*>([\s\S]*?)<\/\1>|<hr\s*\/?>/gi
  let m: RegExpExecArray | null

  while ((m = blockRe.exec(cleaned)) !== null) {
    if (m[0].toLowerCase().startsWith('<hr')) {
      children.push({ type: 'horizontalrule', version: 1 })
      continue
    }

    const tag = m[1].toLowerCase()
    const inner = m[2] ?? ''

    if (tag === 'p') {
      const kids = parseInline(inner)
      // نتخطّى الفقرات الفارغة تماماً
      const hasText = kids.some((k) => k.type === 'text' && String(k.text).trim())
      if (hasText) children.push(paragraph(kids))
    } else if (/^h[1-6]$/.test(tag)) {
      // نخفض h1 إلى h2 (h1 محجوز لعنوان الصفحة)
      const level = Math.min(4, Math.max(2, Number(tag[1])))
      const kids = parseInline(inner)
      if (kids.length) children.push(heading(kids, `h${level}`))
    } else if (tag === 'blockquote') {
      const kids = parseInline(inner.replace(/<\/?p[^>]*>/gi, ' '))
      if (kids.length) children.push(quote(kids))
    } else if (tag === 'ul' || tag === 'ol') {
      const items: LexNode[] = []
      const liRe = /<li\b[^>]*>([\s\S]*?)<\/li>/gi
      let li: RegExpExecArray | null
      let i = 1
      while ((li = liRe.exec(inner)) !== null) {
        const kids = parseInline(li[1])
        if (kids.length) items.push(listItem(kids, i++))
      }
      if (items.length) children.push(listNode(items, tag === 'ol'))
    }
  }

  // احتياط: لو ما التقطنا أي كتلة، نضع النص كفقرة واحدة
  if (children.length === 0) {
    const kids = parseInline(cleaned)
    if (kids.length) children.push(paragraph(kids))
  }

  const plainText = decode(cleaned.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()

  return {
    root: {
      root: {
        type: 'root',
        format: '',
        indent: 0,
        version: 1,
        direction: 'rtl',
        children: children.length ? children : [paragraph([])],
      },
    },
    images,
    plainText,
  }
}
