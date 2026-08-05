/**
 * ترحيل الأخبار من نسخة ووردبريس المستوردة في MySQL/MariaDB المحلي.
 *
 * الاستخدام:
 *   pnpm exec tsx --env-file=.env src/migration/importFromSql.ts --limit=200
 *   pnpm exec tsx --env-file=.env src/migration/importFromSql.ts            # الكل
 *   pnpm exec tsx --env-file=.env src/migration/importFromSql.ts --tags-only
 *
 * الخصائص:
 *  - قابل للاستئناف عبر wpId
 *  - يرحّل الوسوم المستخدمة مرتين فأكثر فقط
 *  - يرحّل عدّاد المشاهدات (tie_views)
 *  - يولّد المقتطف من المحتوى (حقل post_excerpt فارغ في 99.8% من الأخبار)
 */

import fs from 'fs'
import mysql from 'mysql2/promise'
import { getPayload } from 'payload'
import config from '@payload-config'

import { htmlToLexical } from './htmlToLexical'

const DB = process.env.WP_DB || 'akhbarhayat_wp'
const PREFIX = 'EzeDJuKb_'
const REPORT = '/tmp/sql-migration.txt'
const CHUNK = 500
/** الحدّ الأدنى لاستخدام الوسم كي يُرحَّل */
const MIN_TAG_USES = 2

const arg = (name: string, fallback?: string): string | undefined => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.split('=')[1] : process.argv.includes(`--${name}`) ? 'true' : fallback
}

const LIMIT = Number(arg('limit', '0'))
const TAGS_ONLY = arg('tags-only') === 'true'
const SINCE = arg('since') // مثال: 2024-01-01

/** خريطة أقسام ووردبريس → أقسامنا */
const CATEGORY_MAP: Record<string, string | null> = {
  محليات: 'أخبار الأردن',
  محافظات: 'أخبار الأردن',
  برلمانيات: 'أخبار الأردن',
  'شباب وجامعات': 'أخبار الأردن',
  وفيات: 'أخبار الأردن',
  الرئيسية: null,
  'أخبار ساخنة': null,
  'غير مصنف': null,
  عاجل: null,
}

const decodeEntities = (s: string): string =>
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
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))

/** نفس تطبيع Payload للرابط — يجب أن يطابق دالة slugify في مجموعة الأخبار */
const normalizeSlug = (s: string): string =>
  s
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

const decodeSlug = (slug: string): string => {
  try {
    return decodeURIComponent(slug)
  } catch {
    return slug
  }
}

type Row = {
  ID: number
  post_title: string
  post_content: string
  post_excerpt: string
  post_name: string
  post_date_gmt: Date | string
  post_modified_gmt: Date | string
}

const run = async () => {
  const payload = await getPayload({ config })
  const lines: string[] = []
  const log = (...a: unknown[]) => {
    const l = a.map(String).join(' ')
    lines.push(l)
    console.log(l)
    try {
      fs.writeFileSync(REPORT, lines.join('\n'))
    } catch {
      /* اختياري */
    }
  }

  // الاتصال عبر مقبس يونكس — الحساب المحلي مُصادَق عليه بدون كلمة مرور
  const db = await mysql.createConnection({
    socketPath: process.env.MYSQL_SOCKET || '/tmp/mysql.sock',
    user: process.env.MYSQL_USER || process.env.USER || 'root',
    password: process.env.MYSQL_PASSWORD || undefined,
    database: DB,
    charset: 'utf8mb4',
    dateStrings: true,
  })

  log('═'.repeat(58))
  log('ترحيل من نسخة MySQL' + (LIMIT ? `  [حد: ${LIMIT}]` : ''))
  log('═'.repeat(58))

  /* ---------- 1) الوسوم (المستخدمة MIN_TAG_USES مرة فأكثر) ---------- */
  const [tagRows] = await db.query<never[]>(
    `select t.term_id, t.name, tt.count
       from ${PREFIX}terms t
       join ${PREFIX}term_taxonomy tt on tt.term_id = t.term_id
      where tt.taxonomy = 'post_tag' and tt.count >= ?
      order by tt.count desc`,
    [MIN_TAG_USES],
  )
  const wpTags = tagRows as unknown as { term_id: number; name: string; count: number }[]
  log(`وسوم مؤهّلة (${MIN_TAG_USES}+ استخدام): ${wpTags.length}`)

  const existingTags = await payload.find({ collection: 'tags', limit: 50000, depth: 0 })
  const tagByTitle = new Map(existingTags.docs.map((t) => [t.title.trim(), t.id]))
  /** wp term_id → معرّفنا */
  const tagMap = new Map<number, number | string>()
  let tagsCreated = 0

  for (const wt of wpTags) {
    const name = decodeEntities(wt.name).trim()
    if (!name) continue
    let id = tagByTitle.get(name)
    if (!id) {
      try {
        const created = await payload.create({
          collection: 'tags',
          data: { title: name },
          overrideAccess: true,
        })
        id = created.id
        tagByTitle.set(name, id)
        tagsCreated++
        if (tagsCreated % 500 === 0) log(`  وسوم أُنشئت: ${tagsCreated}`)
      } catch {
        continue // اسم مكرر بعد التطبيع
      }
    }
    tagMap.set(wt.term_id, id)
  }
  log(`وسوم أُنشئت: ${tagsCreated} | مربوطة: ${tagMap.size}`)

  if (TAGS_ONLY) {
    await db.end()
    log('اكتفينا بالوسوم (--tags-only).')
    return
  }

  /* ---------- 2) الأقسام ---------- */
  const [catRows] = await db.query<never[]>(
    `select t.term_id, t.name
       from ${PREFIX}terms t
       join ${PREFIX}term_taxonomy tt on tt.term_id = t.term_id
      where tt.taxonomy = 'category'`,
  )
  const ourCats = await payload.find({ collection: 'categories', limit: 100, depth: 0 })
  const catByTitle = new Map(ourCats.docs.map((c) => [c.title.trim(), c.id]))
  const catMap = new Map<number, number | string>()

  for (const wc of catRows as unknown as { term_id: number; name: string }[]) {
    const name = decodeEntities(wc.name).trim()
    const target = name in CATEGORY_MAP ? CATEGORY_MAP[name] : name
    if (target === null) continue
    const id = catByTitle.get(target)
    if (id !== undefined) catMap.set(wc.term_id, id)
  }
  log(`أقسام مربوطة: ${catMap.size}`)

  /* ---------- 3) الأخبار ---------- */
  const where = [`p.post_type='post'`, `p.post_status='publish'`, `p.post_title <> ''`, `p.post_content <> ''`]
  if (SINCE) where.push(`p.post_date_gmt >= '${SINCE}'`)

  const [[{ total }]] = (await db.query(
    `select count(*) as total from ${PREFIX}posts p where ${where.join(' and ')}`,
  )) as unknown as [[{ total: number }]]
  log(`أخبار مؤهّلة: ${total}`)

  const stats = { read: 0, created: 0, skipped: 0, failed: 0 }
  const failures: string[] = []
  let offset = 0

  while (offset < total) {
    if (LIMIT && stats.created >= LIMIT) break

    const [rows] = await db.query<never[]>(
      `select p.ID, p.post_title, p.post_content, p.post_excerpt, p.post_name,
              p.post_date_gmt, p.post_modified_gmt
         from ${PREFIX}posts p
        where ${where.join(' and ')}
        order by p.ID
        limit ? offset ?`,
      [CHUNK, offset],
    )
    const batch = rows as unknown as Row[]
    if (batch.length === 0) break
    offset += batch.length
    stats.read += batch.length

    const ids = batch.map((r) => r.ID)
    const inList = ids.join(',')

    // الوسوم والأقسام لهذه الدفعة
    const [relRows] = await db.query<never[]>(
      `select tr.object_id, tt.term_id, tt.taxonomy
         from ${PREFIX}term_relationships tr
         join ${PREFIX}term_taxonomy tt on tt.term_taxonomy_id = tr.term_taxonomy_id
        where tr.object_id in (${inList}) and tt.taxonomy in ('category','post_tag')`,
    )
    const relByPost = new Map<number, { cats: number[]; tags: number[] }>()
    for (const r of relRows as unknown as {
      object_id: number
      term_id: number
      taxonomy: string
    }[]) {
      const e = relByPost.get(r.object_id) ?? { cats: [], tags: [] }
      if (r.taxonomy === 'category') e.cats.push(r.term_id)
      else e.tags.push(r.term_id)
      relByPost.set(r.object_id, e)
    }

    // المشاهدات
    const [viewRows] = await db.query<never[]>(
      `select post_id, meta_value from ${PREFIX}postmeta
        where meta_key='tie_views' and post_id in (${inList})`,
    )
    const viewsByPost = new Map<number, number>()
    for (const v of viewRows as unknown as { post_id: number; meta_value: string }[]) {
      const n = Number(v.meta_value)
      if (Number.isFinite(n) && n > 0) viewsByPost.set(v.post_id, n)
    }

    // الموجود سابقاً
    const already = await payload.find({
      collection: 'posts',
      where: { wpId: { in: ids } },
      limit: CHUNK,
      depth: 0,
      select: { wpId: true },
    })
    const seen = new Set(already.docs.map((d) => (d as { wpId: number }).wpId))

    for (const row of batch) {
      if (LIMIT && stats.created >= LIMIT) break
      if (seen.has(row.ID)) {
        stats.skipped++
        continue
      }

      try {
        const { root, plainText } = htmlToLexical(row.post_content)
        const title = decodeEntities(row.post_title).trim()
        if (!title || !plainText) {
          stats.skipped++
          continue
        }

        const rel = relByPost.get(row.ID) ?? { cats: [], tags: [] }
        const categories = rel.cats.map((c) => catMap.get(c)).filter(Boolean) as (number | string)[]
        const tags = rel.tags
          .map((t) => tagMap.get(t))
          .filter(Boolean)
          .slice(0, 8) as (number | string)[]

        const excerpt =
          (decodeEntities(row.post_excerpt || '').replace(/<[^>]+>/g, '').trim() || plainText).slice(
            0,
            300,
          )

        const date =
          row.post_date_gmt instanceof Date
            ? row.post_date_gmt.toISOString()
            : `${String(row.post_date_gmt).replace(' ', 'T')}Z`

        // الروابط فريدة عندنا؛ نفحص بالشكل المُطبَّع نفسه الذي يحفظه Payload
        const baseSlug = normalizeSlug(decodeSlug(row.post_name))
        const slugTaken = await payload.find({
          collection: 'posts',
          where: { slug: { equals: baseSlug } },
          limit: 1,
          depth: 0,
        })
        const slug = slugTaken.docs.length > 0 ? `${baseSlug}-${row.ID}` : baseSlug

        await payload.create({
          collection: 'posts',
          data: {
            title,
            slug,
            wpId: row.ID,
            excerpt,
            content: root as never,
            categories: categories.length ? categories : undefined,
            tags: tags.length ? tags : undefined,
            publishedAt: date,
            views: viewsByPost.get(row.ID) ?? 0,
            type: 'news',
            _status: 'published',
          } as never,
          overrideAccess: true,
          context: { disableRevalidate: true },
        })
        stats.created++
      } catch (err) {
        stats.failed++
        if (failures.length < 15) failures.push(`#${row.ID}: ${String(err).slice(0, 90)}`)
      }
    }

    log(
      `${offset}/${total} — أُنشئ ${stats.created} | تُخطّي ${stats.skipped} | فشل ${stats.failed}`,
    )
  }

  await db.end()

  log('═'.repeat(58))
  log(`قُرئ:   ${stats.read}`)
  log(`أُنشئ:  ${stats.created}`)
  log(`تُخطّي:  ${stats.skipped}`)
  log(`فشل:   ${stats.failed}`)
  if (failures.length) {
    log('\nحالات فشل:')
    failures.forEach((f) => log(`  ${f}`))
  }
  log('═'.repeat(58))
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('خطأ عام:', err)
    process.exit(1)
  })
