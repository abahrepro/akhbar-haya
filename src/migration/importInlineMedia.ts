/**
 * استيراد صور المتن الناقصة.
 *
 * مستورد الوسائط الأصلي جلب الصور البارزة وحدها (`_thumbnail_id`): ١٠٨٬٥٧٢
 * مرفقاً من أصل ١٣٦٬٣٧١ في ووردبريس. الفارق — نحو ٢٨ ألف ملف — هو صور
 * المتن، ولم يصل منها شيء. لذلك تعذّر ربط ٩٩٪ من صور المتن: لا لأن الربط
 * مكسور بل لأن الملفّات غير موجودة أصلاً.
 *
 * نجمع معرّفات المرفقات المذكورة داخل نصوص الأخبار، ونستورد ما ينقص منها
 * فقط — لا كل مرفقات ووردبريس، فكثير منها غير مستعمل.
 *
 * الاستخدام:
 *   pnpm exec tsx --env-file=.env src/migration/importInlineMedia.ts --limit=50
 *   pnpm exec tsx --env-file=.env src/migration/importInlineMedia.ts --apply
 */

import fs from 'fs'
import path from 'path'
import mysql from 'mysql2/promise'
import { getPayload } from 'payload'
import config from '@payload-config'

const WP_DB = process.env.WP_DB || 'akhbarhayat_wp'
const PREFIX = 'EzeDJuKb_'
const MEDIA_DIR = process.env.WP_MEDIA_DIR || path.resolve(process.cwd(), 'wp-media')
const REPORT = '/tmp/inline-media-report.txt'
const MAX_BYTES = 20 * 1024 * 1024
/**
 * كل مرفق يُعالَج مرّة واحدة (المعرّفات مجموعة لا قائمة) واسم الملف يحمل
 * معرّفه، فلا تصادم بين العمّال — وهو ما أفسد الاستيراد المتوازي أوّل مرّة.
 */
const CONCURRENCY = Number(process.env.IMPORT_CONCURRENCY ?? 4)

const arg = (n: string, d?: string) => {
  const h = process.argv.find((a) => a.startsWith(`--${n}=`))
  return h ? h.split('=')[1] : process.argv.includes(`--${n}`) ? 'true' : d
}
const LIMIT = Number(arg('limit', '0'))
const APPLY = arg('apply') === 'true'

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
  s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")

/** مسار الملف الأصلي من رابط صورة — بلا لاحقة المقاس التي يولّدها ووردبريس */
const uploadPath = (src: string): string | null => {
  const m = /\/wp-content\/uploads\/(.+)$/.exec(src.split('?')[0])
  return m ? m[1].replace(/-\d{2,4}x\d{2,4}(?=\.[a-z]{3,4}$)/i, '') : null
}

const run = async () => {
  const payload = await getPayload({ config })
  const db = await mysql.createConnection({
    socketPath: process.env.MYSQL_SOCKET || '/tmp/mysql.sock',
    user: process.env.MYSQL_USER || process.env.USER || 'root',
    password: process.env.MYSQL_PASSWORD || undefined,
    database: WP_DB,
    charset: 'utf8mb4',
    dateStrings: true,
  })

  log('═'.repeat(58))
  log('استيراد صور المتن الناقصة')
  log('═'.repeat(58))

  /* --- ١) خريطة المسار ← معرّف المرفق --- */
  const [attRows] = await db.query<never[]>(
    `select post_id, meta_value as path from ${PREFIX}postmeta where meta_key='_wp_attached_file'`,
  )
  const idByPath = new Map<string, number>()
  const pathById = new Map<number, string>()
  for (const r of attRows as unknown as { post_id: number; path: string }[]) {
    idByPath.set(r.path, Number(r.post_id))
    pathById.set(Number(r.post_id), r.path)
  }
  log(`مرفقات ووردبريس: ${pathById.size}`)

  /* --- ٢) المعرّفات المذكورة داخل نصوص الأخبار --- */
  const wanted = new Set<number>()
  let offset = 0
  for (;;) {
    const [rows] = await db.query<never[]>(
      `select post_content from ${PREFIX}posts
        where post_type='post' and post_status='publish' and post_content regexp '<img|<figure'
        order by ID limit 500 offset ?`,
      [offset],
    )
    const batch = rows as unknown as { post_content: string }[]
    if (batch.length === 0) break

    for (const { post_content: html } of batch) {
      // المعرّف مذكور صراحةً في صنف الصورة غالباً
      for (const m of html.matchAll(/wp-image-(\d+)/g)) wanted.add(Number(m[1]))
      // وإلا نستدلّ عليه من مسار الملف
      for (const m of html.matchAll(/src=["']([^"']+wp-content\/uploads\/[^"']+)["']/gi)) {
        const p = uploadPath(m[1])
        const id = p ? idByPath.get(p) : undefined
        if (id) wanted.add(id)
      }
    }
    offset += batch.length
  }
  log(`مرفقات مذكورة في المتون: ${wanted.size}`)

  /* --- ٣) ما ينقص منها في وسائطنا --- */
  const { rows: haveRows } = await payload.db.pool.query<{ wp_media_id: string }>(
    `SELECT wp_media_id FROM media WHERE wp_media_id IS NOT NULL`,
  )
  const have = new Set(haveRows.map((r) => Number(r.wp_media_id)))
  const missing = [...wanted].filter((id) => !have.has(id) && pathById.has(id))
  log(`موجود عندنا: ${[...wanted].filter((id) => have.has(id)).length}`)
  log(`ناقص وسنستورده: ${missing.length}\n`)

  if (!APPLY) {
    log('عرض فقط. أضف --apply للتنفيذ.')
    await db.end()
    return
  }

  /* --- ٤) نصوص بديلة للمرفقات --- */
  const [altRows] = await db.query<never[]>(
    `select post_id, meta_value as alt from ${PREFIX}postmeta
      where meta_key='_wp_attachment_image_alt'`,
  )
  const altById = new Map<number, string>()
  for (const r of altRows as unknown as { post_id: number; alt: string }[]) {
    altById.set(Number(r.post_id), r.alt)
  }

  const stat = { done: 0, uploaded: 0, missingFile: 0, failed: 0 }
  const targets = LIMIT ? missing.slice(0, LIMIT) : missing

  const uploadOne = async (mediaId: number): Promise<void> => {
    const rel = pathById.get(mediaId)
    if (!rel) return
    const abs = path.join(MEDIA_DIR, rel)

    if (!fs.existsSync(abs)) {
      stat.missingFile++
      return
    }
    const buf = fs.readFileSync(abs)
    if (buf.byteLength === 0 || buf.byteLength > MAX_BYTES) {
      stat.failed++
      return
    }

    // اسم يحمل معرّف المرفق — يمنع تصادم الأسماء المتكرّرة عبر السنوات
    const raw = path.basename(rel)
    const ext = raw.split('.').pop()?.toLowerCase() ?? 'jpg'
    const stem = raw.slice(0, raw.length - ext.length - 1)

    try {
      await payload.create({
        collection: 'media',
        data: {
          alt: decodeEntities(altById.get(mediaId) || '').trim() || stem.slice(0, 120),
          wpMediaId: mediaId,
        },
        file: {
          data: buf,
          mimetype: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
          name: `${stem}-${mediaId}.${ext}`,
          size: buf.byteLength,
        },
        overrideAccess: true,
      })
      stat.uploaded++
    } catch {
      stat.failed++
    }
  }

  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    await Promise.all(targets.slice(i, i + CONCURRENCY).map(uploadOne))
    stat.done += Math.min(CONCURRENCY, targets.length - i)
    if (stat.done % 500 < CONCURRENCY) {
      log(`  ${stat.done}/${targets.length} — رُفع ${stat.uploaded} | ملف مفقود ${stat.missingFile} | فشل ${stat.failed}`)
    }
  }

  log('\n' + '═'.repeat(58))
  log(`رُفع: ${stat.uploaded}`)
  log(`ملف غير موجود على القرص: ${stat.missingFile}`)
  log(`فشل: ${stat.failed}`)
  await db.end()
}

void run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
