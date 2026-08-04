import { headers } from 'next/headers'

import { getServerSideURL } from '@/utilities/getURL'

/**
 * robots.txt يعرف على أي نطاق يعمل.
 *
 * نسخة الاختبار تعمل على نطاق فرعي بالمحتوى نفسه — ١٤٥ ألف صفحة.
 * لو زحفها محرّك بحث لصارت نسخة مكرّرة تنافس الموقع الأصلي في النتائج،
 * فأي مضيف غير المضيف المعتمد يُمنع بالكامل.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  const canonical = new URL(getServerSideURL()).host
  const host = (await headers()).get('host')?.split(':')[0] ?? ''

  // نسمح للمضيف المعتمد وحده؛ ما عداه بيئة اختبار
  if (host && host !== canonical && host !== `www.${canonical}`) {
    return new Response(
      ['# بيئة اختبار — غير مخصّصة للفهرسة', 'User-agent: *', 'Disallow: /', ''].join('\n'),
      { headers: { 'content-type': 'text/plain; charset=utf-8', 'x-robots-tag': 'noindex' } },
    )
  }

  const base = getServerSideURL()
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api/',
    'Disallow: /next/',
    'Disallow: /search',
    '',
    `Sitemap: ${base}/sitemap.xml`,
    `Sitemap: ${base}/posts-sitemap.xml`,
    `Sitemap: ${base}/pages-sitemap.xml`,
    `Sitemap: ${base}/news-sitemap.xml`,
    '',
  ].join('\n')

  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
