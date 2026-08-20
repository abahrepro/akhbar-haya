import type { CollectionConfig } from 'payload'
import { revalidatePath } from 'next/cache'

import { anyone } from '../access/anyone'
import { canDelete, canManageTaxonomy } from '../access/roles'

/** المساحات الإعلانية المتاحة في الموقع */
export const PLACEMENTS = [
  { label: 'أعلى الصفحة (٩٧٠×٩٠)', value: 'leaderboard' },
  { label: 'مساحة عريضة وسط الرئيسية (٩٧٠×٢٥٠)', value: 'billboard' },
  { label: 'العمود الجانبي — مربّع (٣٠٠×٢٥٠)', value: 'sidebar-rect' },
  { label: 'العمود الجانبي — طويل (٣٠٠×٦٠٠)', value: 'sidebar-half' },
  { label: 'بين الأخبار — إعلان مدعوم', value: 'in-feed' },
] as const

/**
 * تفريغ ذاكرة الصفحات لا يعمل خارج سياق طلب Next: أي سكربت يعدّل إعلاناً
 * كان ينهار عند هذا السطر. الفشل هنا يعني صفحة قديمة لدقيقة، لا سبباً
 * لإسقاط العملية.
 */
const purge = () => {
  try {
    revalidatePath('/', 'layout')
  } catch {
    /* خارج سياق الطلب — الصفحات تتجدّد بدورتها المعتادة */
  }
}

export const Ads: CollectionConfig = {
  slug: 'ads',
  labels: { singular: 'إعلان', plural: 'الإعلانات' },
  access: {
    // تجاري لا تحريري — يُدار على مستوى الإدارة لا المحرّرين
    create: canManageTaxonomy,
    delete: canDelete,
    read: anyone,
    update: canManageTaxonomy,
  },
  admin: {
    group: 'الإعلانات',
    useAsTitle: 'name',
    defaultColumns: ['name', 'placement', 'active', 'endsAt', 'impressions', 'clicks'],
    description: 'إعلاناتك المباعة مباشرة. تظهر قبل إعلانات جوجل في المساحة نفسها.',
  },
  hooks: {
    // الصفحات مخزّنة مسبقاً، فتغيير الإعلان لا يظهر حتى تُفرَّغ ذاكرتها
    afterChange: [purge],
    afterDelete: [purge],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'اسم الإعلان',
      required: true,
      admin: { description: 'للتنظيم الداخلي فقط — لا يظهر للقارئ.' },
    },
    {
      name: 'placement',
      type: 'select',
      label: 'المكان',
      required: true,
      index: true,
      options: [...PLACEMENTS],
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'الصورة',
      required: true,
      admin: { description: 'ارفع الصورة بمقاس المساحة تماماً لأفضل وضوح.' },
    },
    {
      name: 'imageMobile',
      type: 'upload',
      relationTo: 'media',
      label: 'صورة الهاتف (اختياري)',
      admin: {
        description: 'إن تُركت فارغة تُستخدم الصورة الأساسية. مفيدة للمساحات العريضة.',
        condition: (data) => data?.placement !== 'in-feed',
      },
    },
    {
      name: 'url',
      type: 'text',
      label: 'رابط الإعلان',
      required: true,
      admin: { description: 'إلى أين يذهب القارئ عند الضغط.' },
    },
    /* ---------- حقول الإعلان المدعوم ---------- */
    {
      name: 'headline',
      type: 'text',
      label: 'عنوان الإعلان',
      admin: {
        description: 'يظهر بشكل بطاقة خبر مع وسم «محتوى مدعوم».',
        condition: (data) => data?.placement === 'in-feed',
      },
    },
    {
      name: 'sponsor',
      type: 'text',
      label: 'اسم المعلن',
      admin: { condition: (data) => data?.placement === 'in-feed' },
    },
    {
      name: 'cta',
      type: 'text',
      label: 'نصّ الزرّ',
      defaultValue: 'اكتشف العرض',
      admin: { condition: (data) => data?.placement === 'in-feed' },
    },
    /* ---------- الاستهداف والجدولة ---------- */
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      label: 'الأقسام',
      admin: {
        position: 'sidebar',
        description: 'اتركه فارغاً ليظهر في كل الموقع، أو اختر أقساماً بعينها.',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      label: 'مفعّل',
      defaultValue: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'startsAt',
      type: 'date',
      label: 'يبدأ في',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
        description: 'اتركه فارغاً ليبدأ فوراً.',
      },
    },
    {
      name: 'endsAt',
      type: 'date',
      label: 'ينتهي في',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
        description: 'اتركه فارغاً ليستمرّ بلا نهاية. تتوقّف الحملة تلقائياً عند هذا التاريخ.',
      },
    },
    {
      name: 'priority',
      type: 'number',
      label: 'الأولوية',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'الأعلى رقماً يظهر أوّلاً عند تزاحم أكثر من إعلان على المساحة نفسها.',
      },
    },
    /* ---------- القياس ---------- */
    {
      name: 'impressions',
      type: 'number',
      label: 'مرّات الظهور',
      defaultValue: 0,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'clicks',
      type: 'number',
      label: 'النقرات',
      defaultValue: 0,
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
}
