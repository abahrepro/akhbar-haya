import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { anyone } from '../access/anyone'
import { canDelete, isStaff } from '../access/roles'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'ملف وسائط',
    plural: 'الوسائط',
  },
  folders: true,
  admin: {
    group: 'المحتوى',
  },
  access: {
    create: isStaff,
    delete: canDelete,
    read: anyone,
    update: isStaff,
  },
  fields: [
    {
      name: 'alt',
      label: 'النص البديل (للوصولية)',
      type: 'text',
      //required: true,
    },
    {
      name: 'wpMediaId',
      type: 'number',
      label: 'معرّف وسائط ووردبريس',
      index: true,
      unique: true,
      admin: {
        readOnly: true,
        condition: (data) => Boolean(data?.wpMediaId),
        description: 'مُرحَّل من الموقع القديم.',
      },
    },
    {
      name: 'caption',
      label: 'تعليق الصورة',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
  ],
  upload: {
    // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload
    staticDir: path.resolve(dirname, '../../public/media'),
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    // تحويل كل الصور إلى WebP — أصغر بنحو ٣٠٪ ومدعوم في كل المتصفّحات الحديثة
    formatOptions: { format: 'webp', options: { quality: 82 } },
    imageSizes: [
      /**
       * أربعة أحجام فقط.
       * ٩٧٪ من صور الأرشيف بين ٧٠٠ و١٠٠٠ بكسل، فالأحجام الأكبر كانت
       * تنتج نسخاً متطابقة تضاعف التخزين بلا أي مكسب بصري.
       * withoutEnlargement يمنع تضخيم ما هو أصغر من المقاس المطلوب.
       */
      {
        name: 'thumbnail',
        width: 300,
        withoutEnlargement: true,
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      {
        name: 'small',
        width: 600,
        withoutEnlargement: true,
        formatOptions: { format: 'webp', options: { quality: 82 } },
      },
      {
        name: 'medium',
        width: 1000,
        withoutEnlargement: true,
        formatOptions: { format: 'webp', options: { quality: 82 } },
      },
      // للمشاركة على وسائل التواصل — نسبة ثابتة تتطلب قصّاً
      {
        name: 'og',
        width: 1200,
        height: 630,
        crop: 'center',
        withoutEnlargement: true,
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
    ],
  },
}
