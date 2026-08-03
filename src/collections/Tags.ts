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
      position: undefined,
    }),
  ],
}
