/**
 * اقتراح وسوم لخبر من قاموس الوسوم القائم.
 *
 * لا يخترع وسوماً جديدة — يبحث في نصّ الخبر عن الوسوم التي بناها المحرّرون
 * فعلاً (٧٬٣٦٦ وسماً). هذا مجّاني وفوري، والأهمّ أنّه لا ينتج مكرّرات:
 * ما يُقترح موجود أصلاً فيُربط به بدل إنشاء نسخة ثانية منه. كما أنّه يقوّي
 * صفحات الوسوم القائمة بدل نثر صفحات جديدة بخبر واحد.
 */

import type { Endpoint, PayloadRequest } from 'payload'

import { forEachPhrase, phraseKeys } from '../utilities/arabicText'

type Entry = { id: number; title: string; norm: string; words: number; pop: number }

type Vocab = { byPhrase: Map<string, Entry>; builtAt: number }

let cache: Vocab | null = null
/** القاموس يتغيّر نادراً؛ خمس دقائق تكفي لتفادي بنائه مع كل ضغطة زرّ */
const TTL = 5 * 60_000

const buildVocab = async (req: PayloadRequest): Promise<Vocab> => {
  /**
   * عدد أخبار كل وسم يميّز الموضوع الحقيقي من الضجيج: «الأردن» في ٢٬٩٣١
   * خبراً موضوع، و«والده» في خبرين بقيّة عشوائية من الأرشيف القديم. بدون
   * هذا الوزن تتصدّر الاقتراحاتِ كلماتٌ عامّة صادف وجودها في القاموس.
   */
  const { rows } = await req.payload.db.pool.query<{ id: number; title: string; n: number }>(
    `SELECT t.id, t.title, count(r.parent_id)::int AS n
     FROM tags t
     LEFT JOIN posts_rels r ON r.tags_id = t.id AND r.path = 'tags'
     GROUP BY t.id, t.title`,
  )

  const byPhrase = new Map<string, Entry>()
  for (const row of rows) {
    const title = String(row.title ?? '')
    const keys = phraseKeys(title)
    if (keys.length === 0) continue
    const entry: Entry = {
      id: Number(row.id),
      title,
      norm: keys[0],
      words: keys[0].split(' ').length,
      pop: Math.log10(10 + row.n),
    }
    for (const key of keys) {
      // عند تصادم مفتاحين نُبقي الأشيع — وهو غالباً الشكل الإملائي الصحيح
      const prev = byPhrase.get(key)
      if (!prev || entry.pop > prev.pop) byPhrase.set(key, entry)
    }
  }

  return { byPhrase, builtAt: Date.now() }
}

/** العنوان أدلّ على موضوع الخبر من ورود عابر في المتن */
const TITLE_WEIGHT = 6
/** أقلّ درجة تُعرض — تحت هذا الحدّ تبدأ المصادفات */
const MIN_SCORE = 4
/** ٣ إلى ٦ وسوم هي التوصية؛ لا معنى لعرض أكثر ممّا ينبغي اختياره */
const MAX_SUGGESTIONS = 6

export const suggestTags: Endpoint = {
  path: '/suggest-tags',
  method: 'post',
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ errors: [{ message: 'غير مصرّح' }] }, { status: 403 })
    }

    let body: { title?: string; text?: string; exclude?: (number | string)[] } = {}
    try {
      body = (await req.json?.()) ?? {}
    } catch {
      // جسم فارغ أو غير صالح — يُعامل كطلب بلا نصّ
    }

    const title = String(body.title ?? '')
    const text = String(body.text ?? '')
    if (!title.trim() && !text.trim()) return Response.json({ tags: [] })

    if (!cache || Date.now() - cache.builtAt > TTL) cache = await buildVocab(req)
    const { byPhrase } = cache

    const scores = new Map<number, Entry & { score: number }>()
    const tally = (source: string, weight: number) => {
      forEachPhrase(source, (key) => {
        const hit = byPhrase.get(key)
        if (!hit) return
        // العبارة الأطول أدقّ، فتأخذ وزناً أعلى من الكلمة المفردة
        const add = weight * (1 + 0.5 * (hit.words - 1))
        const prev = scores.get(hit.id)
        if (prev) prev.score += add
        else scores.set(hit.id, { ...hit, score: add })
      })
    }

    tally(title, TITLE_WEIGHT)
    tally(text, 1)

    const exclude = new Set((body.exclude ?? []).map(Number))
    const ranked = [...scores.values()]
      .map((e) => ({ ...e, score: e.score * e.pop }))
      .filter((e) => !exclude.has(e.id) && e.score >= MIN_SCORE)
      .sort((a, b) => b.score - a.score || b.words - a.words)

    /**
     * وسوم متداخلة — «الملك» و«الملك عبدالله الثاني» و«جلالة الملك عبدالله
     * الثاني» — تصف الشيء نفسه، فاقتراحها معاً يملأ الخانة بتكرار. نُبقي
     * الأعلى درجةً من كل سلسلة متداخلة مهما كان طولها.
     */
    const kept: typeof ranked = []
    const overlaps = (a: string, b: string) =>
      ` ${a} `.includes(` ${b} `) || ` ${b} `.includes(` ${a} `)
    for (const entry of ranked) {
      if (!kept.some((k) => overlaps(k.norm, entry.norm))) kept.push(entry)
      if (kept.length === MAX_SUGGESTIONS) break
    }

    return Response.json({ tags: kept.map((e) => ({ id: e.id, title: e.title })) })
  },
}
