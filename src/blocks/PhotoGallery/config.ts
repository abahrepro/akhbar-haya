import type { Block } from 'payload'

/**
 * ألبوم صور داخل المتن.
 *
 * حقل رفع متعدّد (`hasMany`) لا مصفوفة صفوف: المحرّر يسحب عشر صور دفعةً
 * واحدة بدل أن يضيف صفّاً ويرفع ويكرّر عشر مرات. الشرح لكل صورة اختياري
 * ويُضاف بعد الرفع لمن أرادها.
 */
export const PhotoGallery: Block = {
  slug: 'photoGallery',
  labels: { singular: 'ألبوم صور', plural: 'ألبومات صور' },
  imageAltText: 'مجموعة صور داخل الخبر',
  fields: [
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      required: true,
      label: 'الصور',
      admin: {
        description: 'اسحب الصور كلّها دفعة واحدة — ورتّبها بالسحب.',
      },
    },
    {
      name: 'layout',
      type: 'select',
      label: 'طريقة العرض',
      defaultValue: 'grid',
      options: [
        { label: 'شبكة', value: 'grid' },
        { label: 'شريط أفقي (تمرير)', value: 'carousel' },
      ],
    },
    {
      name: 'caption',
      type: 'text',
      label: 'تعليق على الألبوم (اختياري)',
    },
  ],
}
