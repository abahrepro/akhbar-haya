import type { NextRequest } from 'next/server'
import { Pool } from 'pg'

/**
 * عدّاد قراءات الخبر.
 *
 * تحديث مباشر في قاعدة البيانات عمداً — تمريره عبر Payload يشغّل الهوكات
 * ويكتب نسخة أرشيفية جديدة مع كل قراءة، فتتضخّم القاعدة بلا معنى.
 * زيادة العدّاد لا تستحق أكثر من UPDATE واحد.
 */

let pool: Pool | undefined
const getPool = () => (pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 2 }))

export async function POST(req: NextRequest) {
  try {
    const ua = req.headers.get('user-agent') ?? ''
    // الزواحف تضخّم الأرقام بلا قرّاء حقيقيين
    if (/bot|crawl|spider|slurp|preview|facebookexternal/i.test(ua)) {
      return new Response(null, { status: 204 })
    }

    const { id } = (await req.json()) as { id?: unknown }
    const n = Number(id)
    if (!Number.isInteger(n) || n <= 0) return new Response(null, { status: 204 })

    await getPool().query('update posts set views = coalesce(views, 0) + 1 where id = $1', [n])
  } catch {
    // العدّاد لا يستحق إسقاط أي طلب
  }
  return new Response(null, { status: 204 })
}
