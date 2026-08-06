/**
 * لقطة أرقام اليوم.
 *
 * تُشغَّل مرّة يومياً. الفرق بين لقطة اليوم وأمس هو مشاهدات اليوم — وهو
 * الرقم الوحيد الذي يتيح رسم منحنى، لأن عدّاد الخبر تراكميّ بلا تاريخ.
 *
 * الاستخدام:
 *   pnpm exec tsx --env-file=.env src/migration/snapshotStats.ts
 */

import configPromise from '@payload-config'
import { getPayload } from 'payload'

const main = async () => {
  const payload = await getPayload({ config: configPromise })

  const { rows } = await payload.db.pool.query<{ views: string; published: string }>(
    `SELECT COALESCE(SUM(views), 0)::bigint AS views,
            COUNT(*) FILTER (WHERE _status = 'published')::bigint AS published
     FROM posts`,
  )

  const views = Number(rows[0]?.views ?? 0)
  const published = Number(rows[0]?.published ?? 0)
  const date = new Date().toISOString().slice(0, 10)

  /**
   * لقطة واحدة لكل يوم. إعادة التشغيل في اليوم نفسه تحدّث القيمة بدل أن
   * تضيف صفّاً ثانياً يفسد حساب الفروق.
   */
  await payload.db.pool.query(
    `INSERT INTO daily_stats (date, views, published, updated_at, created_at)
     VALUES ($1, $2, $3, now(), now())
     ON CONFLICT (date) DO UPDATE SET views = EXCLUDED.views,
                                      published = EXCLUDED.published,
                                      updated_at = now()`,
    [date, views, published],
  )

  console.log(`${date} — مشاهدات تراكمية: ${views} | منشور: ${published}`)
}

void main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
