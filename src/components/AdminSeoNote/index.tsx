'use client'

import { useFormFields } from '@payloadcms/ui'
import React from 'react'

/**
 * معاينة ما يصل محرّكات البحث ومنصّات التواصل — عرضٌ فقط.
 *
 * لا حقول إدخال هنا عمداً: العنوان والوصف والصورة تُشتقّ لحظة عرض الصفحة
 * من الخبر نفسه، فأي تعديل على العنوان أو المتن ينعكس فوراً. نسخُها إلى
 * خانات يجمّدها عند لحظة الحفظ، ويطلب من المحرّر عملاً لا لزوم له.
 *
 * يقرأ من النموذج المفتوح مباشرة، فيتحدّث أثناء الكتابة لا بعد الحفظ.
 */

const SITE = 'أخبار حياة'
/** نتائج البحث تقتطع الوصف عند هذا الحدّ */
const DESC_LIMIT = 160

export const AdminSeoNote: React.FC = () => {
  const [rawTitle, rawExcerpt, rawHero] = useFormFields(([fields]) => [
    fields?.title?.value,
    fields?.excerpt?.value,
    fields?.heroImage?.value,
  ])

  const title = typeof rawTitle === 'string' ? rawTitle : ''
  const excerpt = typeof rawExcerpt === 'string' ? rawExcerpt : ''
  // الصورة تصل كائناً كاملاً بعد الاختيار، ومعرّفاً بعد إعادة تحميل النموذج
  const hero = rawHero as { url?: string; filename?: string } | number | string | undefined

  const shownTitle = title ? `${title} | ${SITE}` : `${SITE} | مصداقية الخبر`

  const rawDesc = excerpt.trim()
  const shownDesc =
    rawDesc.length > DESC_LIMIT ? rawDesc.slice(0, DESC_LIMIT - 3).trimEnd() + '…' : rawDesc

  const imgUrl =
    hero && typeof hero === 'object'
      ? (hero.url ?? (hero.filename ? `/api/media/file/${hero.filename}` : undefined))
      : undefined

  return (
    <div className="ah-seo">
      <p className="ah-seo__lead">
        هذه معاينة لما يصل <b>جوجل</b> و<b>واتساب</b> — تُكتب تلقائياً من الخبر، ولا تحتاج منك
        شيئاً.
      </p>

      <div className="ah-seo__card">
        <div className="ah-seo__img">
          {imgUrl ? (
            // صورة معاينة داخل لوحة التحكّم — لا داعي لمُحسِّن الصور هنا
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgUrl} alt="" />
          ) : (
            <span className="ah-seo__img-empty">لم تُضف صورة رئيسية بعد</span>
          )}
        </div>

        <div className="ah-seo__body">
          <span className="ah-seo__label">العنوان</span>
          <p className="ah-seo__title">{shownTitle}</p>

          <span className="ah-seo__label">الوصف</span>
          {shownDesc ? (
            <p className="ah-seo__desc">{shownDesc}</p>
          ) : (
            <p className="ah-seo__desc ah-seo__desc--empty">
              يُكتب تلقائياً من مطلع الخبر عند الحفظ.
            </p>
          )}
        </div>
      </div>

      <p className="ah-seo__foot">
        تريد نصاً مختلفاً في جوجل؟ عدّل <b>عنوان الخبر</b> أو <b>المقتطف</b> في تبويب المحتوى.
      </p>
    </div>
  )
}
