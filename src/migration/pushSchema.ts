/**
 * مزامنة مخطّط قاعدة البيانات مع الإعداد.
 *
 * هذا المشروع لا يستعمل ملفات الترحيل — جدول `payload_migrations` يحمل سجلّاً
 * واحداً باسم `dev`، أي أنّ المخطّط أُنشئ ويُحدَّث بدفع Payload المباشر.
 * والدفع لا يعمل إلا خارج وضع الإنتاج، لذا نجبر البيئة هنا.
 *
 * ⚠️ الدفع يوائم القاعدة مع الإعداد في الاتجاهين: أي عمود لم يعد الإعداد
 * يصرّح به قد يُحذف. راجع الفروق وخذ نسخة احتياطية قبل التشغيل على الإنتاج.
 *
 * الاستخدام:
 *   NODE_ENV=development pnpm exec tsx --env-file=.env src/migration/pushSchema.ts
 */

process.env.NODE_ENV = 'development'
process.env.PAYLOAD_DROP_DATABASE = 'false'

const main = async () => {
  const { getPayload } = await import('payload')
  const { default: config } = await import('@payload-config')

  console.log('مزامنة المخطّط…')
  const payload = await getPayload({ config })

  const { rows } = await payload.db.pool.query<{ n: string }>(
    `SELECT count(*)::text AS n FROM information_schema.tables WHERE table_schema='public'`,
  )
  console.log(`تمّت المزامنة. عدد الجداول الآن: ${rows[0]?.n}`)
}

void main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
