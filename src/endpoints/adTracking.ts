/**
 * قياس الإعلانات: الظهور والنقر.
 *
 * العدّ يجري بجملة SQL واحدة تزيد العمود مباشرة، لا بقراءة القيمة ثم كتابتها
 * — فزيارتان متزامنتان لا تلغي إحداهما الأخرى. ولا يمرّ عبر خطّافات Payload
 * كي لا يُفرَّغ تخزين الصفحات مع كل ظهور.
 */

import type { Endpoint } from 'payload'

import { getServerSideURL } from '../utilities/getURL'

const bump = async (
  req: { payload: { db: { pool: { query: (q: string, v: unknown[]) => Promise<unknown> } } } },
  id: number,
  column: 'impressions' | 'clicks',
) => {
  await req.payload.db.pool.query(
    `UPDATE ads SET ${column} = COALESCE(${column}, 0) + 1 WHERE id = $1`,
    [id],
  )
}

export const adView: Endpoint = {
  path: '/ad-view',
  method: 'post',
  handler: async (req) => {
    let id = 0
    try {
      const body = (await req.json?.()) as { id?: number | string } | undefined
      id = Number(body?.id)
    } catch {
      /* جسم غير صالح */
    }
    if (!Number.isInteger(id) || id <= 0) return new Response(null, { status: 204 })

    try {
      await bump(req, id, 'impressions')
    } catch {
      /* القياس ليس سبباً لإظهار خطأ للقارئ */
    }
    return new Response(null, { status: 204 })
  },
}

export const adClick: Endpoint = {
  path: '/ad-click',
  method: 'get',
  handler: async (req) => {
    // Response.redirect يرفض المسار النسبي، فأي رجوع للرئيسية يكون مطلقاً
    const home = getServerSideURL() || 'https://new.akhbarhayat.com'
    const id = Number(new URL(req.url ?? '', 'http://x').searchParams.get('id'))
    if (!Number.isInteger(id) || id <= 0) return Response.redirect(home, 302)

    const doc = await req.payload
      .findByID({ collection: 'ads', id, depth: 0 })
      .catch(() => null)

    const target = typeof doc?.url === 'string' ? doc.url : null
    // وجهة خارجية فقط — لا نسمح للرابط أن يصير أداة تحويل داخلية
    const safe = target && /^https?:\/\//i.test(target) ? target : null
    if (!safe) return Response.redirect(home, 302)

    try {
      await bump(req, id, 'clicks')
    } catch {
      /* لا نمنع القارئ من الوصول لأجل عدّاد */
    }
    return Response.redirect(safe, 302)
  },
}
