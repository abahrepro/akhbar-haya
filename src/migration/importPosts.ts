/**
 * ترحيل الأخبار من ووردبريس عبر REST API.
 *
 * الاستخدام:
 *   pnpm exec payload run src/migration/importPosts.ts -- --days=14
 *   pnpm exec payload run src/migration/importPosts.ts -- --days=14 --dry
 *
 * الخصائص:
 *  - قابل للاستئناف: يتخطّى أي خبر مُرحَّل سابقاً (عبر wpId)
 *  - يعمل على دفعات ويطبع تقريراً بعد كل دفعة
 *  - --dry يحلّل دون الكتابة في قاعدة البيانات
 */

import fs from 'fs'
import { getPayload } from 'payload'
import config from '@payload-config'

import { htmlToLexical } from './htmlToLexical'

const WP = 'https://akhbarhayat.com/wp-json/wp/v2'
const REPORT = '/tmp/migration-report.txt'
const PER_PAGE = 100

/* ---------- وسائط سطر الأوامر ---------- */
const arg = (name: string, fallback?: string): string | undefined => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.split('=')[1] : process.argv.includes(`--${name}`) ? 'true' : fallback
}

const DAYS = Number(arg('days', '14'))
const DRY = arg('dry') === 'true'
const LIMIT = Number(arg('limit', '0')) // 0 = بلا حد

/**
 * خريطة أقسام ووردبريس → أقسامنا.
 * ما لا يُذكر هنا يُطابَق بالاسم؛ وما لا يُطابَق يُهمَل (يبقى الخبر بلا قسم).
 * "الرئيسية" و"أخبار ساخنة" ليست أقساماً حقيقية بل وسوم عرض — نتجاهلها.
 */
const CATEGORY_MAP: Record<string, string | null> = {
  محليات: 'أخبار الأردن',
  محافظات: 'أخبار الأردن',
  برلمانيات: 'أخبار الأردن',
  'شباب وجامعات': 'أخبار الأردن',
  وفيات: 'أخبار الأردن',
  الرئيسية: null,
  'أخبار ساخنة': null,
  'غير مصنف': null,
}

/* ---------- أدوات ---------- */
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

const stripTags = (s: string): string => decodeEntities(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()

/** الـ slug في ووردبريس مُرمّز بـ percent-encoding — نفكّه ليصير عربياً مقروءاً */
const decodeSlug = (slug: string): string => {
  try {
    return decodeURIComponent(slug)
  } catch {
    return slug
  }
}

type WpPost = {
  id: number
  date_gmt: string
  modified_gmt: string
  slug: string
  link: string
  title: { rendered: string }
  content: { rendered: string }
  excerpt: { rendered: string }
  categories: number[]
  tags: number[]
  featured_media: number
}

const fetchJson = async <T>(url: string, tries = 3): Promise<T> => {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'akhbar-hayat-migration' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return (await res.json()) as T
    } catch (err) {
      if (i === tries - 1) throw err
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)))
    }
  }
  throw new Error('unreachable')
}

/* ---------- التنفيذ ---------- */
const run = async () => {
  const payload = await getPayload({ config })
  const lines: string[] = []
  const log = (...a: unknown[]) => {
    const line = a.map(String).join(' ')
    lines.push(line)
    console.log(line)
    // payload run لا يمرّر stdout دائماً — نكتب تقريراً على القرص أيضاً
    try {
      fs.writeFileSync(REPORT, lines.join('\n'))
    } catch {
      /* التقرير اختياري */
    }
  }

  const after = new Date()
  after.setDate(after.getDate() - DAYS)
  const afterISO = after.toISOString().split('.')[0]

  log('═'.repeat(56))
  log(`ترحيل أخبار آخر ${DAYS} يوماً${DRY ? '  [تجربة — بلا كتابة]' : ''}`)
  log(`من: ${afterISO}`)
  log('═'.repeat(56))

  /* --- 1) خرائط الأقسام والوسوم --- */
  const [ourCats, ourTags] = await Promise.all([
    payload.find({ collection: 'categories', limit: 100, depth: 0 }),
    payload.find({ collection: 'tags', limit: 1000, depth: 0 }),
  ])

  const catByTitle = new Map(ourCats.docs.map((c) => [c.title.trim(), c.id]))
  const tagByTitle = new Map(ourTags.docs.map((t) => [t.title.trim(), t.id]))

  const wpCats = await fetchJson<{ id: number; name: string }[]>(
    `${WP}/categories?per_page=100&_fields=id,name`,
  )
  // ووردبريس → أقسامنا: الخريطة اليدوية أولاً، ثم المطابقة بالاسم
  const catMap = new Map<number, number | string>()
  const unmapped: string[] = []
  for (const wc of wpCats) {
    const name = decodeEntities(wc.name).trim()
    const target = name in CATEGORY_MAP ? CATEGORY_MAP[name] : name
    if (target === null) continue // متجاهَل عمداً
    const id = catByTitle.get(target)
    if (id !== undefined) catMap.set(wc.id, id)
    else unmapped.push(name)
  }
  log(`الأقسام المطابَقة: ${catMap.size}/${wpCats.length}`)
  if (unmapped.length) log(`  بلا مقابل: ${unmapped.join('، ')}`)

  /* --- 2) جلب الأخبار --- */
  const stats = { fetched: 0, created: 0, skipped: 0, failed: 0, tagsCreated: 0 }
  const failures: { id: number; err: string }[] = []
  const tagCache = new Map<number, number | string>()

  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const url = `${WP}/posts?per_page=${PER_PAGE}&page=${page}&after=${afterISO}&orderby=date&order=asc&_fields=id,date_gmt,modified_gmt,slug,link,title,content,excerpt,categories,tags,featured_media`

    let batch: WpPost[]
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'akhbar-hayat-migration' } })
      totalPages = Number(res.headers.get('x-wp-totalpages') || 1)
      batch = (await res.json()) as WpPost[]
    } catch (err) {
      log(`✗ فشل جلب الصفحة ${page}: ${String(err)}`)
      break
    }

    if (!Array.isArray(batch) || batch.length === 0) break
    stats.fetched += batch.length

    for (const wp of batch) {
      if (LIMIT && stats.created >= LIMIT) break

      try {
        // موجود سابقاً؟
        const dupe = await payload.find({
          collection: 'posts',
          where: { wpId: { equals: wp.id } },
          limit: 1,
          depth: 0,
        })
        if (dupe.docs.length > 0) {
          stats.skipped++
          continue
        }

        const { root, plainText } = htmlToLexical(wp.content.rendered)
        const title = decodeEntities(wp.title.rendered).trim()
        if (!title) {
          stats.failed++
          failures.push({ id: wp.id, err: 'بدون عنوان' })
          continue
        }

        const excerpt = (stripTags(wp.excerpt.rendered) || plainText).slice(0, 300)

        // الأقسام
        const categories = wp.categories.map((c) => catMap.get(c)).filter(Boolean) as (
          | number
          | string
        )[]

        // الوسوم — تُنشأ عند الحاجة
        const tags: (number | string)[] = []
        for (const wtId of wp.tags.slice(0, 6)) {
          if (tagCache.has(wtId)) {
            tags.push(tagCache.get(wtId)!)
            continue
          }
          try {
            const [wt] = await fetchJson<{ name: string }[]>(
              `${WP}/tags?include=${wtId}&_fields=name`,
            )
            if (!wt?.name) continue
            const name = decodeEntities(wt.name).trim()
            let id = tagByTitle.get(name)
            if (!id && !DRY) {
              const created = await payload.create({ collection: 'tags', data: { title: name } })
              id = created.id
              tagByTitle.set(name, id)
              stats.tagsCreated++
            }
            if (id) {
              tagCache.set(wtId, id)
              tags.push(id)
            }
          } catch {
            /* وسم واحد فاشل لا يوقف الخبر */
          }
        }

        if (DRY) {
          stats.created++
          continue
        }

        await payload.create({
          collection: 'posts',
          data: {
            title,
            slug: decodeSlug(wp.slug),
            wpId: wp.id,
            excerpt,
            content: root as never,
            categories: categories.length ? categories : undefined,
            tags: tags.length ? tags : undefined,
            publishedAt: wp.date_gmt ? `${wp.date_gmt}Z` : undefined,
            type: 'news',
            _status: 'published',
          } as never,
          overrideAccess: true,
          // هوك revalidatePath يعمل داخل طلب Next فقط — نعطّله أثناء الترحيل
          context: { disableRevalidate: true },
        })
        stats.created++
      } catch (err) {
        stats.failed++
        failures.push({ id: wp.id, err: String(err).slice(0, 120) })
      }
    }

    log(
      `دفعة ${page}/${totalPages} — جُلب ${stats.fetched} | أُنشئ ${stats.created} | تُخطّي ${stats.skipped} | فشل ${stats.failed}`,
    )

    if (LIMIT && stats.created >= LIMIT) break
    page++
  }

  log('═'.repeat(56))
  log(`جُلب:      ${stats.fetched}`)
  log(`أُنشئ:     ${stats.created}`)
  log(`تُخطّي:     ${stats.skipped}  (مُرحَّل سابقاً)`)
  log(`فشل:      ${stats.failed}`)
  log(`وسوم جديدة: ${stats.tagsCreated}`)
  if (failures.length) {
    log('\nأول 10 حالات فشل:')
    failures.slice(0, 10).forEach((f) => log(`  #${f.id}: ${f.err}`))
  }
  log('═'.repeat(56))
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('خطأ عام:', err)
    process.exit(1)
  })
