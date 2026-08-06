import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/roles'

/**
 * لقطة يومية لأرقام الموقع.
 *
 * عدّاد المشاهدات على الخبر رقم تراكميّ واحد: يقول كم قُرئ الخبر، ولا يقول
 * متى. فلا سبيل لرسم منحنى المشاهدات بأثر رجعيّ — البيانات غير موجودة أصلاً.
 * نأخذ مجموع المشاهدات مرّة كل يوم، والفرق بين لقطتين هو مشاهدات ذلك اليوم.
 *
 * المنحنى يبدأ فارغاً ويمتلئ يوماً بعد يوم — لذا تشغيلها مبكراً أفضل.
 */
export const DailyStats: CollectionConfig = {
  slug: 'daily-stats',
  labels: { singular: 'لقطة يومية', plural: 'اللقطات اليومية' },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: () => true,
    update: isAdmin,
  },
  admin: {
    // بنية داخلية تغذّي لوحة البداية — لا شأن للمحرّر بها
    hidden: true,
    useAsTitle: 'date',
    defaultColumns: ['date', 'views', 'published'],
  },
  fields: [
    {
      name: 'date',
      type: 'text',
      label: 'التاريخ',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'YYYY-MM-DD' },
    },
    {
      name: 'views',
      type: 'number',
      label: 'مجموع المشاهدات التراكمي',
      required: true,
    },
    {
      name: 'published',
      type: 'number',
      label: 'مجموع الأخبار المنشورة',
      required: true,
    },
  ],
}
