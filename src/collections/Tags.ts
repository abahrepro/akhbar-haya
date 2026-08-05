import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { canManageTaxonomy } from '../access/roles'
import { slugField } from 'payload'
import { revalidateTag, revalidateTagDelete } from './hooks/revalidateTaxonomy'

export const Tags: CollectionConfig = {
  slug: 'tags',
  access: {
    create: canManageTaxonomy,
    delete: canManageTaxonomy,
    read: anyone,
    update: canManageTaxonomy,
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
  hooks: {
    afterChange: [revalidateTag],
    afterDelete: [revalidateTagDelete],
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
