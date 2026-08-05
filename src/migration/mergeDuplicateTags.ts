/**
 * دمج الوسوم المكرّرة إملائياً.
 *
 * ٤٠٢ مجموعة وسوم تعني الشيء نفسه وتختلف في شكل الهمزة أو التاء المربوطة:
 * «الأردن» (٢٬٩٣١ خبراً) و«الاردن» (١٬٤٦٤) وسمان منفصلان لهما صفحتان
 * منفصلتان — أي ٤٬٣٩٥ خبراً مفرّقة على أرشيفين ضعيفين بدل أرشيف واحد قويّ.
 *
 * الشكل الباقي يُختار بالإملاء لا بالشيوع: همزة الوصل تُكتب ألفاً مجرّدة
 * (الاحتلال، الاجتماعي، الاصطناعي) وهمزة القطع تُكتب بهمزة (الأردن، الأمن،
 * إيران). القاعدتان تختلفان في ٩٩ حالة، والشيوع وحده كان سيكتب «الامن»
 * و«اربد»، والهمزة وحدها كانت ستكتب «الإحتلال».
 *
 * الروابط القديمة لا تُكسر: صفحة الوسم تبحث بالشكل الموحّد حين لا تجد
 * الرابط حرفياً، فتحوّل «الاردن» إلى «الأردن» تحويلاً دائماً.
 *
 * الاستخدام:
 *   pnpm exec tsx --env-file=.env src/migration/mergeDuplicateTags.ts          # عرض فقط
 *   pnpm exec tsx --env-file=.env src/migration/mergeDuplicateTags.ts --apply  # تنفيذ
 */

import configPromise from '@payload-config'
import { getPayload } from 'payload'

const APPLY = process.argv.includes('--apply')

type Row = { id: number; title: string; n: number }

/** الشرطة السفلية صيغة وسم اجتماعي لا حرفاً: «أسعار_الذهب» هو «أسعار الذهب» */
const norm = (s: string) =>
  s.replace(/_/g, ' ').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
/** يزيل أل التعريف وحروف الجرّ والعطف للوصول إلى جذع الكلمة */
const stem = (w: string) => w.replace(/^(?:[وفبكل]?ال|لل|[وفبك])/, '')

/** أوزان همزة الوصل: افتعال وانفعال واستفعال ومشتقّاتها */
const WASL = [
  /^است.{3,}/, // استقلال، استثمار، استقبال
  /^ا.ت.{3,}/, // احتلال، اجتماع، انتخاب، اقتصاد — ستّة أحرف فصاعداً
  /^اصط/, // اصطناعي — تاء افتعل قُلبت طاءً
  /^اضط/, // اضطراب
  /^ازد/, // ازدهار
  /^اتح/, // اتحاد
  /^اتص/, // اتصالات
  /^اتفا/, // اتفاقية
  /^ان.{4,}/, // انفجار، انسحاب — وزن انفعال ستّة أحرف، بينما إنزال
  //             وإنتاج على وزن إفعال بخمسة فهمزتهما قطع
]

/**
 * الوزن الصرفي لا ينطبق على الأعجميّ وأسماء العَلَم: «إنترنت» و«أندرويد»
 * و«إندونيسيا» تبدأ بألف ونون كوزن انفعال وليست منه في شيء.
 */
const FORCE_QAT = new Set([
  'انباء', 'انشطه', 'انظمه', 'انسان', 'انسانيه', 'انتاج', 'انتاجيه', 'انجاز',
  'اندونيسيا', 'اندرويد', 'انجليزي', 'انجليزيه', 'انفلونزا', 'انترنت',
  'انستغرام', 'انستقرام', 'استرليني', 'اندبندنت', 'انذار', 'انقاذ',
])
/** أوزان افتعال التي لا يلتقطها النمط: اطّلاع من اطّلع */
const FORCE_WASL = new Set(['اطلاع'])

const isWasl = (word: string): boolean | null => {
  const s = stem(norm(word))
  if (!s.startsWith('ا')) return null // لا خلاف على همزة هذه الكلمة
  if (FORCE_QAT.has(s)) return false
  if (FORCE_WASL.has(s)) return true
  return WASL.some((re) => re.test(s))
}

/** يختار الشكل الصحيح لكلمة واحدة من الأشكال الملاحَظة في الأرشيف */
const pickWord = (variants: Map<string, number>): string => {
  const list = [...variants.entries()].sort((a, b) => b[1] - a[1])
  if (list.length === 1) return list[0][0]

  const wasl = isWasl(list[0][0])
  if (wasl === true) {
    const plain = list.filter(([w]) => !/^[وفبكل]?ال?[أإآ]|^[أإآ]/.test(w))
    if (plain.length) return plain[0][0]
  }
  if (wasl === false) {
    const hamza = list.filter(([w]) => /[أإآ]/.test(w))
    if (hamza.length) return hamza[0][0]
  }

  // التاء المربوطة أصحّ من الهاء في أواخر الأسماء
  const withTa = list.filter(([w]) => /ة/.test(w))
  if (withTa.length && list.some(([w]) => !/ة/.test(w) && norm(w) === norm(withTa[0][0])))
    return withTa[0][0]

  return list[0][0]
}

const main = async () => {
  const payload = await getPayload({ config: configPromise })

  const { rows } = await payload.db.pool.query<Row>(
    `SELECT t.id, t.title, count(r.parent_id)::int AS n
     FROM tags t
     LEFT JOIN posts_rels r ON r.tags_id = t.id AND r.path = 'tags'
     GROUP BY t.id, t.title`,
  )

  const groups = new Map<string, Row[]>()
  for (const row of rows) {
    const key = norm(row.title).trim().replace(/\s+/g, ' ')
    if (!key) continue
    const bucket = groups.get(key)
    if (bucket) bucket.push(row)
    else groups.set(key, [row])
  }
  const dupes = [...groups.values()].filter((g) => g.length > 1)

  // قاموس الشكل الصحيح لكل كلمة، مبنيّ من الأشكال الواردة في المكرّرات وحدها
  const wordVariants = new Map<string, Map<string, number>>()
  for (const group of dupes) {
    for (const form of group) {
      for (const w of form.title.split(/[\s_]+/)) {
        const k = norm(w)
        if (!wordVariants.has(k)) wordVariants.set(k, new Map())
        const m = wordVariants.get(k)!
        m.set(w, (m.get(w) ?? 0) + form.n)
      }
    }
  }
  const correctWord = new Map<string, string>()
  for (const [k, v] of wordVariants) correctWord.set(k, pickWord(v))

  const plan = dupes
    .map((group) => {
      const forms = [...group].sort((a, b) => b.n - a.n)
      /**
       * الاسم الباقي يُكتب بمسافات دائماً. الشرطة السفلية أثر من صيغة
       * الوسم الاجتماعي، وظهورها في عنوان صفحة الأرشيف يبدو خللاً.
       */
      const ideal = forms[0].title
        .split(/[\s_]+/)
        .map((w) => correctWord.get(norm(w)) ?? w)
        .join(' ')
      const winner = forms.find((f) => f.title === ideal) ?? forms[0]
      return {
        winner,
        ideal,
        losers: forms.filter((f) => f.id !== winner.id),
        moved: forms.reduce((s, f) => s + f.n, 0) - winner.n,
      }
    })
    .sort((a, b) => b.moved - a.moved)

  const removed = plan.reduce((s, p) => s + p.losers.length, 0)
  const moved = plan.reduce((s, p) => s + p.moved, 0)
  const renames = plan.filter((p) => p.winner.title !== p.ideal)

  console.log(`\nمجموعات مكرّرة: ${plan.length}`)
  console.log(`وسوم ستُدمج: ${removed}`)
  console.log(`روابط أخبار ستنتقل: ${moved}`)
  console.log(`إعادة تسمية لازمة: ${renames.length}\n`)
  console.log('أكبر الحالات أثراً:')
  for (const p of plan.slice(0, 12)) {
    console.log(`  ${p.ideal}  ⟵  ${p.losers.map((l) => `${l.title} (${l.n})`).join(' · ')}`)
  }

  if (!APPLY) {
    console.log('\nعرض فقط. أضف --apply للتنفيذ.')
    return
  }

  console.log('\nجارٍ التنفيذ…')
  let done = 0
  for (const { winner, ideal, losers } of plan) {
    const loserIds = losers.map((l) => l.id)

    /**
     * خبر موسوم بالشكلين معاً سيحمل الوسم الفائز مرّتين بعد النقل،
     * فنزيل ازدواجه أوّلاً ثم ننقل ما تبقّى.
     */
    await payload.db.pool.query(
      `DELETE FROM posts_rels
       WHERE path = 'tags' AND tags_id = ANY($1::int[])
         AND parent_id IN (
           SELECT parent_id FROM posts_rels WHERE path = 'tags' AND tags_id = $2)`,
      [loserIds, winner.id],
    )
    await payload.db.pool.query(
      `UPDATE posts_rels SET tags_id = $1
       WHERE path = 'tags' AND tags_id = ANY($2::int[])`,
      [winner.id, loserIds],
    )

    // الفائز قد يحمل إملاءً خاطئاً حين لا يوجد الشكل الصحيح بين الأشكال
    if (winner.title !== ideal) {
      await payload.update({
        collection: 'tags',
        id: winner.id,
        data: { title: ideal },
        overrideAccess: true,
      })
    }

    // الحذف عبر Payload ليعمل خطّاف تفريغ ذاكرة الصفحات
    for (const id of loserIds) {
      await payload.delete({ collection: 'tags', id, overrideAccess: true })
    }

    if (++done % 50 === 0) console.log(`  ${done}/${plan.length}`)
  }

  console.log(`\nتمّ. دُمج ${removed} وسماً ونُقل ${moved} رابطاً.`)
}

void main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
