import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  UploadFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { slugField } from 'payload'

import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { isAdmin } from '../../access/roles'
import { populatePublishedAt } from '../../hooks/populatePublishedAt'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { revalidateDelete, revalidatePage } from './hooks/revalidatePage'

/**
 * الصفحات الثابتة — للمدير وحده.
 *
 * كانت مبنية على «الكتل»: نظامٌ يركّب الصفحة من مكوّنات تسويقية (بطل،
 * أعمدة، دعوة لإجراء، أرشيف). صفحة «من نحن» نصٌّ لا تركيب، والنظام بقي
 * فارغاً منذ بدء المشروع ولم تُنشأ به صفحة واحدة. محرّرٌ واحد — نفس محرّر
 * الخبر — يكفيها ويعرفه صاحب الموقع من أوّل لحظة بلا تدريب.
 *
 * والقسم مخفيّ عن المحرّرين كما تُخفى «المستخدمون»: الصفحات ليست عملهم.
 */
export const Pages: CollectionConfig<'pages'> = {
  slug: 'pages',
  labels: {
    singular: 'صفحة',
    plural: 'الصفحات',
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: authenticatedOrPublished,
    update: isAdmin,
  },
  defaultPopulate: {
    title: true,
    slug: true,
  },
  admin: {
    group: 'المحتوى',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    useAsTitle: 'title',
    description: 'صفحات ثابتة مثل «من نحن» و«اتصل بنا». تظهر على رابطها مباشرة.',
    hidden: ({ user }) => (user as { role?: string } | null)?.role !== 'admin',
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({ slug: data?.slug, collection: 'pages', req }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({ slug: data?.slug as string, collection: 'pages', req }),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'عنوان الصفحة',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      label: 'محتوى الصفحة',
      required: true,
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          ...rootFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
          UploadFeature({
            collections: {
              media: {
                fields: [{ name: 'caption', type: 'text', label: 'تعليق الصورة (اختياري)' }],
              },
            },
          }),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
          HorizontalRuleFeature(),
        ],
      }),
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'تاريخ النشر',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
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
    }),
  ],
  hooks: {
    afterChange: [revalidatePage],
    beforeChange: [populatePublishedAt],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: { autosave: { interval: 100 }, schedulePublish: true },
    maxPerDoc: 20,
  },
}
