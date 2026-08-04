import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { getServerSideURL } from '@/utilities/getURL'
import { postHref } from '@/utilities/postUrl'

/**
 * خريطة Google News.
 *
 * تختلف عن خريطة الموقع العادية: تقتصر على ما نُشر خلال آخر ٤٨ ساعة،
 * وبحد أقصى ألف رابط — هذان شرطا جوجل، وتجاوزهما يُبطل الخريطة كلها
 * لا الزائد منها فقط.
 */
export const revalidate = 300

const WINDOW_HOURS = 48
const MAX_URLS = 1000

/** يهرب المحارف التي تكسر XML */
const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

export async function GET() {
  const payload = await getPayload({ config: configPromise })
  const base = getServerSideURL()
  const since = new Date(Date.now() - WINDOW_HOURS * 3600_000).toISOString()

  const res = await payload.find({
    collection: 'posts',
    where: {
      and: [{ _status: { equals: 'published' } }, { publishedAt: { greater_than: since } }],
    },
    sort: '-publishedAt',
    limit: MAX_URLS,
    pagination: false,
    depth: 0,
    overrideAccess: false,
    select: { title: true, slug: true, wpId: true, publishedAt: true },
  })

  const items = res.docs
    .filter((p) => p.slug && p.publishedAt)
    .map(
      (p) => `  <url>
    <loc>${esc(base + encodeURI(postHref(p)))}</loc>
    <news:news>
      <news:publication>
        <news:name>أخبار حياة</news:name>
        <news:language>ar</news:language>
      </news:publication>
      <news:publication_date>${new Date(p.publishedAt as string).toISOString()}</news:publication_date>
      <news:title>${esc(p.title)}</news:title>
    </news:news>
  </url>`,
    )
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items}
</urlset>
`

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=300',
    },
  })
}
