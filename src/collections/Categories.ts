import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { canManageTaxonomy } from '../access/roles'
import { slugField } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: 'قسم',
    plural: 'الأقسام',
  },
  access: {
    create: canManageTaxonomy,
    delete: canManageTaxonomy,
    read: anyone,
    update: canManageTaxonomy,
  },
  admin: {
    group: 'التصنيفات',
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
        description: 'لون مميّز للقسم، مثال: #026938',
        placeholder: '#026938',
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
      // الافتراضي يمسح الحروف العربية؛ هذه النسخة تُبقيها
      slugify: ({ valueToSlugify }) =>
        String(valueToSlugify ?? '')
          .trim()
          .replace(/[\s_]+/g, '-')
          .replace(/[^\p{L}\p{N}-]+/gu, '')
          .replace(/-{2,}/g, '-')
          .replace(/^-+|-+$/g, '')
          .toLowerCase(),
      position: undefined,
    }),
  ],
}
