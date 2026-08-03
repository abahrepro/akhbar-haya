import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { slugField } from 'payload'

export const Tags: CollectionConfig = {
  slug: 'tags',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    group: 'التصنيفات',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug'],
  },
  labels: {
    singular: 'وسم',
    plural: 'الوسوم',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'الوسم',
      required: true,
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
