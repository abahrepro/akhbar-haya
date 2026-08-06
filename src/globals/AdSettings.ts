import type { GlobalConfig } from 'payload'
import { revalidatePath } from 'next/cache'

import { anyone } from '../access/anyone'
import { isAdmin } from '../access/roles'

/** حقول التحكّم بوحدة جوجل الواحدة */
const slot = (name: string, label: string) => ({
  name,
  type: 'group' as const,
  label,
  fields: [
    {
      name: 'enabled',
      type: 'checkbox' as const,
      label: 'تشغيل جوجل في هذه المساحة',
      defaultValue: false,
    },
    {
      name: 'unitId',
      type: 'text' as const,
      label: 'رقم الوحدة (data-ad-slot)',
      admin: { description: 'انسخه من AdSense عند إنشاء الوحدة.' },
    },
  ],
})

/**
 * إعدادات إعلانات جوجل.
 *
 * المفتاح الرئيسي مقفول حتى التحويل. ولا تُستعمل الوحدات التلقائية ولا
 * المتجاوبة إطلاقاً: هي التي تقرّر مقاسها وقت التحميل فتزيح التصميم وتقفز
 * الصفحة تحت القارئ — وهو سبب إيقاف الإعلانات على الموقع القديم. كل وحدة
 * هنا ثابتة المقاس داخل صندوق محجوز لا تتعدّاه.
 */
export const AdSettings: GlobalConfig = {
  slug: 'ad-settings',
  label: 'إعدادات إعلانات جوجل',
  access: { read: anyone, update: isAdmin },
  admin: {
    group: 'الإعلانات',
    description:
      'إعلاناتك المباعة تظهر أوّلاً دائماً. جوجل يملأ المساحة فقط حين لا يوجد إعلان مباع لها.',
  },
  hooks: {
    afterChange: [() => void revalidatePath('/', 'layout')],
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      label: 'تشغيل إعلانات جوجل في الموقع',
      defaultValue: false,
      admin: {
        description:
          'المفتاح الرئيسي. أبقِه مغلقاً حتى نقل الموقع إلى النطاق الرئيسي — لا تُحتسب الإعلانات على نطاق تجريبي.',
      },
    },
    {
      name: 'publisherId',
      type: 'text',
      label: 'معرّف الناشر',
      admin: { description: 'يبدأ بـ ca-pub — من حساب AdSense.' },
    },
    slot('leaderboard', 'أعلى الصفحة (٩٧٠×٩٠)'),
    slot('billboard', 'مساحة عريضة وسط الرئيسية (٩٧٠×٢٥٠)'),
    slot('sidebarRect', 'العمود الجانبي — مربّع (٣٠٠×٢٥٠)'),
    slot('sidebarHalf', 'العمود الجانبي — طويل (٣٠٠×٦٠٠)'),
  ],
}
