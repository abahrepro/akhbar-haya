/**
 * ترحيل الصور البارزة من ووردبريس وربطها بالأخبار المُرحَّلة.
 *
 * الاستخدام:
 *   pnpm exec tsx --env-file=.env src/migration/importMedia.ts
 *   pnpm exec tsx --env-file=.env src/migration/importMedia.ts --limit=50
 *
 * الخصائص:
 *  - قابل للاستئناف: يتخطّى ما رُبط سابقاً وما نُزّل سابقاً (عبر wpMediaId)
 *  - يجلب بيانات الصور على دفعات (100 لكل طلب) بدل طلب لكل خبر
 *  - يتخطّى الأخبار التي لا صورة لها دون توقّف
 */

import fs from 'fs'
import { getPayload } from 'payload'
import config from '@payload-config'

const WP = 'https://akhbarhayat.com/wp-json/wp/v2'
const REPORT = '/tmp/media-report.txt'
const BATCH = 100
/** أقصى حجم مقبول للملف الواحد — حماية من ملفات شاذّة */
const MAX_BYTES = 12 * 1024 * 1024

const arg = (name: string, fallback?: string): string | undefined => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.split('=')[1] : process.argv.includes(`--${name}`) ? 'true' : fallback
}

const LIMIT = Number(arg('limit', '0'))

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

type WpMedia = {
  id: number
  source_url: string
  alt_text?: string
  caption?: { rendered?: string }
  mime_type?: string
}

const chunk = <T,>(arr: T[], size: number): T[][] => {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
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

  log('═'.repeat(56))
  log('ترحيل الصور البارزة')
  log('═'.repeat(56))

  /* --- 1) الأخبار المُرحَّلة بلا صورة --- */
  const pending = await payload.find({
    collection: 'posts',
    where: { and: [{ wpId: { exists: true } }, { heroImage: { exists: false } }] },
    limit: LIMIT || 10000,
    depth: 0,
    select: { wpId: true, title: true },
  })

  log(`أخبار تنتظر صورة: ${pending.docs.length}`)
  if (pending.docs.length === 0) {
    log('لا شيء للترحيل.')
    return
  }

  /* --- 2) جلب featured_media لكل خبر (دفعات) --- */
  const wpIds = pending.docs.map((p) => (p as { wpId: number }).wpId).filter(Boolean)
  const featuredByPost = new Map<number, number>()

  for (const group of chunk(wpIds, BATCH)) {
    try {
      const res = await fetch(
        `${WP}/posts?include=${group.join(',')}&per_page=${BATCH}&_fields=id,featured_media`,
        { headers: { 'User-Agent': 'akhbar-hayat-migration' } },
      )
      const arr = (await res.json()) as { id: number; featured_media: number }[]
      arr.forEach((p) => {
        if (p.featured_media) featuredByPost.set(p.id, p.featured_media)
      })
    } catch (err) {
      log(`✗ فشل جلب دفعة أخبار: ${String(err).slice(0, 80)}`)
    }
  }
  log(`منها لها صورة بارزة: ${featuredByPost.size}`)

  /* --- 3) جلب بيانات الصور (دفعات) --- */
  const mediaIds = [...new Set(featuredByPost.values())]
  const mediaById = new Map<number, WpMedia>()

  for (const group of chunk(mediaIds, BATCH)) {
    try {
      const res = await fetch(
        `${WP}/media?include=${group.join(',')}&per_page=${BATCH}&_fields=id,source_url,alt_text,caption,mime_type`,
        { headers: { 'User-Agent': 'akhbar-hayat-migration' } },
      )
      const arr = (await res.json()) as WpMedia[]
      arr.forEach((m) => mediaById.set(m.id, m))
    } catch (err) {
      log(`✗ فشل جلب دفعة وسائط: ${String(err).slice(0, 80)}`)
    }
  }
  log(`بيانات صور مُستلمة: ${mediaById.size}`)

  /* --- 4) تنزيل ورفع وربط --- */
  const stats = { uploaded: 0, reused: 0, linked: 0, skipped: 0, failed: 0 }
  const failures: string[] = []
  /** wpMediaId → معرّف الوسائط عندنا */
  const uploadedCache = new Map<number, number | string>()

  let done = 0
  for (const post of pending.docs) {
    const wpId = (post as { wpId: number }).wpId
    const mediaId = featuredByPost.get(wpId)
    done++

    if (!mediaId) {
      stats.skipped++
      continue
    }

    try {
      let ourMediaId = uploadedCache.get(mediaId)

      // مرحّلة سابقاً؟
      if (!ourMediaId) {
        const existing = await payload.find({
          collection: 'media',
          where: { wpMediaId: { equals: mediaId } },
          limit: 1,
          depth: 0,
        })
        if (existing.docs.length) {
          ourMediaId = existing.docs[0].id
          uploadedCache.set(mediaId, ourMediaId)
          stats.reused++
        }
      }

      // تنزيل ورفع
      if (!ourMediaId) {
        const meta = mediaById.get(mediaId)
        if (!meta?.source_url) {
          stats.skipped++
          continue
        }

        const res = await fetch(meta.source_url, {
          headers: { 'User-Agent': 'akhbar-hayat-migration' },
        })
        if (!res.ok) throw new Error(`تنزيل HTTP ${res.status}`)

        const buf = Buffer.from(await res.arrayBuffer())
        if (buf.byteLength === 0) throw new Error('ملف فارغ')
        if (buf.byteLength > MAX_BYTES) throw new Error('ملف كبير جداً')

        const name = decodeURIComponent(meta.source_url.split('/').pop() || `wp-${mediaId}.jpg`)
        const alt =
          decodeEntities(meta.alt_text || '').trim() ||
          String((post as { title?: string }).title || '').slice(0, 120)
        const caption = decodeEntities((meta.caption?.rendered || '').replace(/<[^>]+>/g, '')).trim()

        const created = await payload.create({
          collection: 'media',
          data: { alt, wpMediaId: mediaId, ...(caption ? { caption } : {}) } as never,
          file: {
            data: buf,
            name,
            mimetype: meta.mime_type || 'image/jpeg',
            size: buf.byteLength,
          },
          overrideAccess: true,
          context: { disableRevalidate: true },
        })
        ourMediaId = created.id
        uploadedCache.set(mediaId, ourMediaId)
        stats.uploaded++
      }

      // الربط بالخبر
      await payload.update({
        collection: 'posts',
        id: post.id,
        data: { heroImage: ourMediaId } as never,
        overrideAccess: true,
        context: { disableRevalidate: true },
      })
      stats.linked++
    } catch (err) {
      stats.failed++
      if (failures.length < 12) failures.push(`#${wpId}: ${String(err).slice(0, 90)}`)
    }

    if (done % 100 === 0) {
      log(
        `${done}/${pending.docs.length} — رُفع ${stats.uploaded} | رُبط ${stats.linked} | فشل ${stats.failed}`,
      )
    }
  }

  log('═'.repeat(56))
  log(`رُفع:      ${stats.uploaded}`)
  log(`أُعيد استخدام: ${stats.reused}`)
  log(`رُبط بخبر:  ${stats.linked}`)
  log(`تُخطّي:     ${stats.skipped}  (بلا صورة بارزة)`)
  log(`فشل:      ${stats.failed}`)
  if (failures.length) {
    log('\nحالات فشل:')
    failures.forEach((f) => log(`  ${f}`))
  }
  log('═'.repeat(56))
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('خطأ عام:', err)
    process.exit(1)
  })
