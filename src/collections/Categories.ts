import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { slugField } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'order', 'showInNav', 'slug'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'اسم القسم',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'وصف القسم',
    },
    {
      name: 'color',
      type: 'text',
      label: 'لون القسم (Hex)',
      admin: {
        description: 'لون مميّز للقسم، مثال: #0f7c3e',
        placeholder: '#0f7c3e',
      },
    },
    {
      name: 'order',
      type: 'number',
      label: 'الترتيب',
      defaultValue: 0,
      admin: {
        description: 'ترتيب ظهور القسم في القائمة (الأصغر أولاً).',
      },
    },
    {
      name: 'showInNav',
      type: 'checkbox',
      label: 'إظهار في القائمة الرئيسية',
      defaultValue: true,
    },
    slugField({
      position: undefined,
    }),
  ],
}
