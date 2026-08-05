/**
 * ترحيل الصور البارزة من مجلد ووردبريس المحلي.
 *
 * الاستخدام:
 *   pnpm exec tsx --env-file=.env src/migration/importMediaFromDisk.ts --limit=200
 *   pnpm exec tsx --env-file=.env src/migration/importMediaFromDisk.ts
 *
 * الخصائص:
 *  - يقرأ من القرص مباشرة (لا شبكة)
 *  - قابل للاستئناف: يتخطّى ما رُبط سابقاً عبر wpMediaId
 *  - يبدأ بالأحدث فالأقدم
 *  - يحوّل إلى WebP ويولّد الأحجام حسب إعداد المجموعة
 */

import fs from 'fs'
import path from 'path'
import mysql from 'mysql2/promise'
import { getPayload } from 'payload'
import config from '@payload-config'

const WP_DB = process.env.WP_DB || 'akhbarhayat_wp'
const PREFIX = 'EzeDJuKb_'
const MEDIA_DIR = process.env.WP_MEDIA_DIR || path.resolve(process.cwd(), 'wp-media')
const REPORT = '/tmp/media-disk-report.txt'
const BATCH = 500
/** عدد الصور المُعالَجة في آنٍ واحد — معالجة الصور تستهلك المعالج بشدّة */
const CONCURRENCY = Number(process.env.IMPORT_CONCURRENCY ?? 1)
/** حد أقصى للملف الواحد — حماية من ملفات شاذّة */
const MAX_BYTES = 20 * 1024 * 1024

const arg = (n: string, d?: string) => {
  const h = process.argv.find((a) => a.startsWith(`--${n}=`))
  return h ? h.split('=')[1] : process.argv.includes(`--${n}`) ? 'true' : d
}
const LIMIT = Number(arg('limit', '0'))
const SINCE = arg('since') // مثال: 2024-01-01

const lines: string[] = []
const log = (...a: unknown[]) => {
  const l = a.map(String).join(' ')
  lines.push(l)
  console.log(l)
  try {
    fs.writeFileSync(REPORT, lines.join('\n'))
  } catch {
    /* التقرير اختياري */
  }
}

const decodeEntities = (s: string): string =>
  s
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))

const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  jpe: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  bmp: 'image/bmp',
  avif: 'image/avif',
}

type Row = {
  post_id: number
  media_id: number
  file_path: string
  alt: string | null
  title: string
}

const run = async () => {
  if (!fs.existsSync(MEDIA_DIR)) {
    log(`✗ مجلد الصور غير موجود: ${MEDIA_DIR}`)
    process.exit(1)
  }

  const payload = await getPayload({ config })
  const db = await mysql.createConnection({
    socketPath: process.env.MYSQL_SOCKET || '/tmp/mysql.sock',
    user: process.env.MYSQL_USER || process.env.USER || 'root',
    database: WP_DB,
    charset: 'utf8mb4',
  })

  log('═'.repeat(58))
  log(`ترحيل الصور من القرص${LIMIT ? `  [حد: ${LIMIT}]` : ''}`)
  log(`المجلد: ${MEDIA_DIR}`)
  log('═'.repeat(58))

  /* --- الأخبار التي تنتظر صورة، مرتّبة بالأحدث --- */
  const where = [
    `p.post_type='post'`,
    `p.post_status='publish'`,
    `t.meta_key='_thumbnail_id'`,
    `f.meta_key='_wp_attached_file'`,
  ]
  if (SINCE) where.push(`p.post_date_gmt >= '${SINCE}'`)

  const [rows] = await db.query<never[]>(
    `select p.ID as post_id, t.meta_value as media_id, f.meta_value as file_path,
            alt.meta_value as alt, p.post_title as title
       from ${PREFIX}posts p
       join ${PREFIX}postmeta t on t.post_id = p.ID
       join ${PREFIX}postmeta f on f.post_id = t.meta_value
       left join ${PREFIX}postmeta alt on alt.post_id = t.meta_value
            and alt.meta_key='_wp_attachment_image_alt'
      where ${where.join(' and ')}
      order by p.post_date_gmt desc`,
  )
  const all = rows as unknown as Row[]
  log(`أخبار لها صورة بارزة: ${all.length}`)

  const stats = { seen: 0, uploaded: 0, reused: 0, linked: 0, missing: 0, skipped: 0, failed: 0 }
  const failures: string[] = []
  /** wpMediaId → معرّفنا (ذاكرة داخل التشغيل) */
  const cache = new Map<number, number | string>()

  for (let i = 0; i < all.length; i += BATCH) {
    if (LIMIT && stats.linked >= LIMIT) break
    const chunk = all.slice(i, i + BATCH)

    // ما رُبط سابقاً؟
    const postIds = chunk.map((r) => r.post_id)
    // خريطة الدفعة كاملة باستعلام واحد — استعلام لكل صورة كان يشلّ الأداء
    const batchPosts = await payload.find({
      collection: 'posts',
      where: { wpId: { in: postIds } },
      limit: BATCH,
      depth: 0,
      select: { wpId: true, heroImage: true },
      overrideAccess: true,
    })
    const postByWpId = new Map<number, { id: number | string; hasImage: boolean }>()
    for (const d of batchPosts.docs) {
      const doc = d as unknown as { id: number; wpId: number; heroImage?: unknown }
      postByWpId.set(doc.wpId, { id: doc.id, hasImage: Boolean(doc.heroImage) })
    }

    /** يعالج خبراً واحداً — يُستدعى بالتوازي */
    const processOne = async (r: Row): Promise<void> => {
      stats.seen++

      const target = postByWpId.get(r.post_id)
      if (!target || target.hasImage) {
        stats.skipped++
        return
      }

      try {
        let mediaId = cache.get(r.media_id)

        // مرحّلة سابقاً في قاعدتنا؟
        if (!mediaId) {
          const existing = await payload.find({
            collection: 'media',
            where: { wpMediaId: { equals: r.media_id } },
            limit: 1,
            depth: 0,
            overrideAccess: true,
          })
          if (existing.docs.length) {
            mediaId = existing.docs[0].id
            cache.set(r.media_id, mediaId)
            stats.reused++
          }
        }

        // رفع من القرص
        if (!mediaId) {
          const abs = path.join(MEDIA_DIR, r.file_path)
          if (!fs.existsSync(abs)) {
            stats.missing++
            return
          }
          const buf = fs.readFileSync(abs)
          if (buf.byteLength === 0 || buf.byteLength > MAX_BYTES) {
            stats.failed++
            return
          }

          // اسم فريد يمنع تصادم الملفات المتطابقة الأسماء عبر السنوات
          const raw = path.basename(r.file_path)
          const ext = raw.split('.').pop()?.toLowerCase() ?? 'jpg'
          const stem = raw.slice(0, raw.length - ext.length - 1)
          const name = `${stem}-${r.media_id}.${ext}`
          const created = await payload.create({
            collection: 'media',
            data: {
              alt: decodeEntities(r.alt || '').trim() || decodeEntities(r.title).slice(0, 120),
              wpMediaId: r.media_id,
            } as never,
            file: {
              data: buf,
              name,
              mimetype: MIME[ext] ?? 'image/jpeg',
              size: buf.byteLength,
            },
            overrideAccess: true,
            context: { disableRevalidate: true },
          })
          mediaId = created.id
          cache.set(r.media_id, mediaId)
          stats.uploaded++
        }

        // الربط بالخبر (المعرّف من خريطة الدفعة)
        await payload.update({
          collection: 'posts',
          id: target.id,
          data: { heroImage: mediaId } as never,
          overrideAccess: true,
          context: { disableRevalidate: true },
        })
        stats.linked++
      } catch (err) {
        stats.failed++
        if (failures.length < 15) failures.push(`#${r.post_id}: ${String(err).slice(0, 90)}`)
      }

      if (stats.seen % 500 === 0) {
        log(
          `${stats.seen}/${all.length} — رُفع ${stats.uploaded} | رُبط ${stats.linked} | مفقود ${stats.missing} | فشل ${stats.failed}`,
        )
      }
    }

    // نشغّل الدفعة على مجموعات متوازية بحجم CONCURRENCY
    for (let j = 0; j < chunk.length; j += CONCURRENCY) {
      if (LIMIT && stats.linked >= LIMIT) break
      await Promise.all(chunk.slice(j, j + CONCURRENCY).map(processOne))
    }
  }

  await db.end()

  log('═'.repeat(58))
  log(`فُحص:       ${stats.seen}`)
  log(`رُفع:        ${stats.uploaded}`)
  log(`أُعيد استخدام: ${stats.reused}`)
  log(`رُبط بخبر:    ${stats.linked}`)
  log(`تُخطّي:       ${stats.skipped}  (مربوط سابقاً)`)
  log(`ملف مفقود:   ${stats.missing}`)
  log(`فشل:        ${stats.failed}`)
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
