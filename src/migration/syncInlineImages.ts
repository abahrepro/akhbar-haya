/**
 * إعادة صور المتن إلى الأخبار المرحّلة.
 *
 * ١١٬٣٤٢ خبراً في ووردبريس تحمل صوراً داخل نصّها، ولم تصل منها ولا واحدة:
 * المحوّل كان ينزع الصور من التدفّق ويجمعها في قائمة جانبية لا يقرؤها
 * المستورد. المتن وصل بلا صوره، والقارئ يرى نصّاً أعرج.
 *
 * الربط بالمعرّف لا بالاسم: رابط الصورة في ووردبريس يقابل مرفقاً له
 * `term_id`، ووسائطنا تحمل `wpMediaId` من الترحيل — فالمطابقة قطعية.
 * والاسم وحده لا يكفي: الترحيل أضاف لاحقة رقمية للأسماء المتكرّرة وقصّر
 * الأسماء الطويلة، فصور كثيرة لم يعد اسمها مطابقاً للأصل.
 *
 * الصور الخارجية (من مواقع إخبارية أخرى) لا تُنقل افتراضياً — تُترك للقرار
 * بـ`--external=link` الذي يبقيها روابط كما كانت.
 *
 * الاستخدام:
 *   pnpm exec tsx --env-file=.env src/migration/syncInlineImages.ts --limit=20      # تجربة
 *   pnpm exec tsx --env-file=.env src/migration/syncInlineImages.ts --apply
 *   pnpm exec tsx --env-file=.env src/migration/syncInlineImages.ts --apply --external=link
 */

import configPromise from '@payload-config'
import mysql from 'mysql2/promise'
import { getPayload } from 'payload'

import { htmlToLexical, imageMarkIndex, type ExtractedImage } from './htmlToLexical'

const PREFIX = 'EzeDJuKb_'
const CHUNK = 200

const arg = (name: string): string | undefined => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.split('=')[1] : process.argv.includes(`--${name}`) ? 'true' : undefined
}

const APPLY = arg('apply') === 'true'
const LIMIT = Number(arg('limit') ?? 0)
/** skip = تُحذف الصورة الخارجية | link = تبقى رابطاً خارجياً */
const EXTERNAL = (arg('external') ?? 'skip') as 'skip' | 'link'

type LexNode = { type: string; [k: string]: unknown }

/**
 * مسار الملف داخل مكتبة ووردبريس من رابط الصورة.
 * ووردبريس يولّد نسخاً بمقاسات مختلفة بلاحقة `-800x600`، وكلّها تعود
 * للمرفق نفسه، فنزيلها للوصول إلى الأصل.
 */
const uploadPath = (src: string): string | null => {
  const m = /\/wp-content\/uploads\/(.+)$/.exec(src.split('?')[0])
  if (!m) return null
  return m[1].replace(/-\d{2,4}x\d{2,4}(?=\.[a-z]{3,4}$)/i, '')
}

const isOurs = (src: string) => /akhbarhayat\.com/i.test(src) || src.startsWith('/')

const main = async () => {
  const payload = await getPayload({ config: configPromise })
  const db = await mysql.createConnection({
    socketPath: process.env.MYSQL_SOCKET || '/tmp/mysql.sock',
    user: process.env.MYSQL_USER || process.env.USER || 'root',
    password: process.env.MYSQL_PASSWORD || undefined,
    database: process.env.WP_DB || 'akhbarhayat_wp',
    charset: 'utf8mb4',
    dateStrings: true,
  })

  /* ---------- ١) خريطة مسار الملف ← معرّف وسائطنا ---------- */
  console.log('بناء خريطة الوسائط…')
  const [attachRows] = await db.query<never[]>(
    `select pm.meta_value as path, pm.post_id as wp_id
       from ${PREFIX}postmeta pm
      where pm.meta_key = '_wp_attached_file'`,
  )
  const wpIdByPath = new Map<string, number>()
  for (const r of attachRows as unknown as { path: string; wp_id: number }[]) {
    wpIdByPath.set(r.path, Number(r.wp_id))
  }

  const { rows: mediaRows } = await payload.db.pool.query<{ id: number; wp_media_id: number }>(
    `SELECT id, wp_media_id FROM media WHERE wp_media_id IS NOT NULL`,
  )
  const ourIdByWpId = new Map<number, number>()
  for (const r of mediaRows) ourIdByWpId.set(Number(r.wp_media_id), Number(r.id))
  console.log(`مرفقات ووردبريس: ${wpIdByPath.size} | وسائطنا المرتبطة: ${ourIdByWpId.size}`)

  /**
   * المعرّف المصرّح به في الصنف أوثق من الرابط، فنجرّبه أوّلاً: الرابط قد
   * يشير إلى نسخة بمقاس مختلف أو مسار أعيدت كتابته فلا يطابق سجلّ المرفق.
   */
  const resolve = (img: ExtractedImage): number | null => {
    if (img.wpId) {
      const direct = ourIdByWpId.get(img.wpId)
      if (direct) return direct
    }
    const path = uploadPath(img.src)
    if (!path) return null
    const wpId = wpIdByPath.get(path)
    if (!wpId) return null
    return ourIdByWpId.get(wpId) ?? null
  }

  /* ---------- ٢) الأخبار التي تحمل صوراً ---------- */
  const [[{ total }]] = (await db.query(
    `select count(*) as total from ${PREFIX}posts
      where post_type='post' and post_status='publish' and post_content regexp '<img|<figure'`,
  )) as unknown as [[{ total: number }]]
  console.log(`أخبار فيها صور: ${total}\n`)

  const stat = {
    seen: 0,
    updated: 0,
    imagesPlaced: 0,
    unresolvedOurs: 0,
    external: 0,
    noPost: 0,
    noImages: 0,
  }
  let offset = 0

  while (offset < total) {
    if (LIMIT && stat.seen >= LIMIT) break

    const [rows] = await db.query<never[]>(
      `select ID, post_content from ${PREFIX}posts
        where post_type='post' and post_status='publish' and post_content regexp '<img|<figure'
        order by ID limit ? offset ?`,
      [CHUNK, offset],
    )
    const batch = rows as unknown as { ID: number; post_content: string }[]
    if (batch.length === 0) break

    for (const row of batch) {
      if (LIMIT && stat.seen >= LIMIT) break
      stat.seen++

      const ours = await payload.find({
        collection: 'posts',
        where: { wpId: { equals: row.ID } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      const post = ours.docs[0]
      if (!post) {
        stat.noPost++
        continue
      }

      const converted = htmlToLexical(row.post_content)
      const images = converted.images as ExtractedImage[]
      if (images.length === 0) {
        stat.noImages++
        continue
      }

      // نستبدل فقرات العلامات بعقد صور، ونحذف ما تعذّر ربطه
      const root = converted.root.root as unknown as { children: LexNode[] }
      const out: LexNode[] = []
      let placed = 0

      for (const node of root.children ?? []) {
        const text = nodeText(node)
        const idx = text === null ? null : imageMarkIndex(text)
        if (idx === null) {
          out.push(node)
          continue
        }

        const img = images[idx]
        if (!img) continue

        if (!isOurs(img.src)) {
          stat.external++
          if (EXTERNAL === 'link') out.push(externalParagraph(img))
          continue
        }

        const mediaId = resolve(img)
        if (!mediaId) {
          stat.unresolvedOurs++
          continue
        }

        out.push({
          type: 'upload',
          version: 3,
          relationTo: 'media',
          value: mediaId,
          fields: img.caption ? { caption: img.caption } : null,
          format: '',
        })
        placed++
      }

      if (placed === 0) continue
      stat.imagesPlaced += placed

      if (APPLY) {
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: { content: { root: { ...root, children: out } } as never },
          overrideAccess: true,
          context: { skipRevalidate: true },
        })
      }
      stat.updated++
    }

    offset += batch.length
    console.log(
      `  ${stat.seen}/${LIMIT || total} — حُدّث ${stat.updated} | صور ${stat.imagesPlaced}`,
    )
  }

  await db.end()
  console.log('\n' + '═'.repeat(50))
  console.log(`أخبار فُحصت: ${stat.seen}`)
  console.log(`أخبار ${APPLY ? 'حُدّثت' : 'ستُحدَّث'}: ${stat.updated}`)
  console.log(`صور أُعيدت إلى مواضعها: ${stat.imagesPlaced}`)
  console.log(`صور لنا تعذّر ربطها: ${stat.unresolvedOurs}`)
  console.log(`صور خارجية (${EXTERNAL}): ${stat.external}`)
  console.log(`أخبار غير مرحّلة عندنا: ${stat.noPost}`)
  if (!APPLY) console.log('\nعرض فقط. أضف --apply للتنفيذ.')
}

/** نصّ الفقرة إن كانت فقرة نصّية بسيطة */
const nodeText = (node: LexNode): string | null => {
  if (node.type !== 'paragraph') return null
  const kids = (node.children ?? []) as { type?: string; text?: string }[]
  if (!Array.isArray(kids) || kids.length !== 1) return null
  return typeof kids[0]?.text === 'string' ? kids[0].text : null
}

/** الصورة الخارجية تبقى رابطاً — لا ننسخ ملفّاً لا نملكه */
const externalParagraph = (img: ExtractedImage): LexNode => ({
  type: 'paragraph',
  version: 1,
  format: '',
  indent: 0,
  direction: 'rtl',
  children: [
    {
      type: 'link',
      version: 3,
      format: '',
      indent: 0,
      direction: 'rtl',
      fields: { linkType: 'custom', newTab: true, url: img.src },
      children: [
        {
          type: 'text',
          version: 1,
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text: img.caption || img.alt || 'صورة',
        },
      ],
    },
  ],
})

void main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
