import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { canDelete, isStaff, readPosts, updatePosts } from '../../access/roles'
import { Banner } from '../../blocks/Banner/config'
import { Code } from '../../blocks/Code/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { PhotoGallery } from '../../blocks/PhotoGallery/config'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { populateAuthors } from './hooks/populateAuthors'
import { exclusiveFeatured } from './hooks/exclusiveFeatured'
import { revalidateDelete, revalidatePost } from './hooks/revalidatePost'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { slugField } from 'payload'

export const Posts: CollectionConfig<'posts'> = {
  slug: 'posts',
  labels: {
    singular: 'خبر',
    plural: 'الأخبار',
  },
  access: {
    create: isStaff,
    delete: canDelete,
    read: readPosts,
    update: updatePosts,
  },
  // This config controls what's populated by default when a post is referenced
  // https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
  // Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'posts'>
  defaultPopulate: {
    title: true,
    slug: true,
    categories: true,
    meta: {
      image: true,
      description: true,
    },
  },
  admin: {
    group: 'المحتوى',
    defaultColumns: ['title', 'categories', 'publishedAt', '_status'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'posts',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'posts',
        req,
      }),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'العنوان',
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'heroImage',
              type: 'upload',
              relationTo: 'media',
              label: 'الصورة الرئيسية',
            },
            {
              name: 'heroCaption',
              type: 'text',
              label: 'تعليق الصورة الرئيسية',
            },
            {
              name: 'excerpt',
              type: 'textarea',
              label: 'المقتطف',
              maxLength: 300,
              admin: {
                description: 'وصف مختصر يظهر في البطاقات ونتائج البحث ووصف SEO.',
              },
            },
            {
              name: 'content',
              type: 'richText',
              label: 'نص الخبر',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                    BlocksFeature({ blocks: [Banner, Code, MediaBlock, PhotoGallery] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HorizontalRuleFeature(),
                  ]
                },
              }),
              required: true,
            },
            {
              name: 'gallery',
              type: 'array',
              label: 'معرض الصور',
              admin: {
                description: 'للأخبار من نوع «صورة وخبر».',
                condition: (data) => data?.type === 'photo',
              },
              fields: [
                { name: 'image', type: 'upload', relationTo: 'media', required: true },
                { name: 'caption', type: 'text', label: 'التعليق' },
              ],
            },
            /**
             * حقلا الفيديو محذوفان من النموذج.
             * الفيديو يعمل بلصق الرابط في المتن فيتحوّل مشغّلاً مكانه —
             * وهو ما اعتاده المحرّرون. حقلٌ منفصل كرّر الوظيفة وأخفى
             * الصورة الرئيسية حين يُملأ. العمودان يبقيان في قاعدة البيانات
             * (لخبر واحد قيمة) فلا نفقد بيانات.
             */
          ],
          label: 'المحتوى',
        },
        {
          fields: [
            {
              name: 'relatedPosts',
              type: 'relationship',
              label: 'أخبار ذات صلة',
              admin: {
                position: 'sidebar',
              },
              filterOptions: ({ id }) => {
                return {
                  id: {
                    not_in: [id],
                  },
                }
              },
              hasMany: true,
              relationTo: 'posts',
            },
            {
              name: 'categories',
              type: 'relationship',
              label: 'الأقسام',
              admin: {
                position: 'sidebar',
              },
              hasMany: true,
              relationTo: 'categories',
            },
            {
              name: 'tags',
              type: 'relationship',
              label: 'الوسوم',
              admin: {
                position: 'sidebar',
              },
              hasMany: true,
              relationTo: 'tags',
            },
          ],
          label: 'التصنيف',
        },
        {
          name: 'meta',
          label: 'تحسين محركات البحث',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'تاريخ النشر',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
    // صاحب الخبر — يُضبط تلقائياً ويُستخدم لتقييد صلاحية المساهم
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      label: 'أنشأه',
      admin: { position: 'sidebar', readOnly: true },
      hooks: {
        beforeChange: [
          ({ operation, req, value }) => (operation === 'create' && req.user ? req.user.id : value),
        ],
      },
    },
    // مُعرّف الخبر في ووردبريس — مفتاح الترحيل ويحفظ الرابط القديم
    {
      name: 'wpId',
      type: 'number',
      label: 'معرّف ووردبريس',
      index: true,
      unique: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => Boolean(data?.wpId),
        description: 'مُرحَّل من الموقع القديم — يُستخدم للحفاظ على الرابط.',
      },
    },
    {
      name: 'views',
      type: 'number',
      label: 'عدد المشاهدات',
      defaultValue: 0,
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'يُحتسب تلقائياً؛ القيمة الأولية مُرحَّلة من الموقع القديم.',
      },
    },
    {
      name: 'type',
      type: 'select',
      label: 'نوع الخبر',
      defaultValue: 'news',
      options: [
        { label: 'خبر', value: 'news' },
        { label: 'فيديو (يُظهر أيقونة تشغيل على البطاقة)', value: 'video' },
        { label: 'معرض صور (يُظهر المعرض داخل الخبر)', value: 'photo' },
      ],
      admin: {
        position: 'sidebar',
        description: 'اتركه «خبر» إلا إذا كان الخبر فيديو أو معرض صور.',
        /**
         * للمدير وحده.
         * ١٤٥٬٧٤٥ خبراً كلّها من النوع «خبر» — الحقل لم يُستعمل قطّ، وخيار
         * «صورة وخبر» كان يكرّر قسماً موجوداً فيربك المحرّر بين حقلين
         * لنفس المعنى. لا نحذفه لأن `video` و`photo` يشغّلان سلوكاً فعلياً
         * في الواجهة؛ نخفيه فقط عمّن لا يحتاجه.
         */
        condition: (_data, _siblingData, { user }) =>
          (user as { role?: string } | null)?.role === 'admin',
      },
    },
    {
      name: 'breaking',
      type: 'checkbox',
      label: 'خبر عاجل',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'يظهر في شريط العاجل والتنبيه المنبثق.',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'مميّز (يظهر في الهيرو)',
      defaultValue: false,
      index: true,
      admin: {
        position: 'sidebar',
        description:
          'خبر واحد فقط يكون مميّزاً. تعليم خبر جديد يُلغي التعليم عن السابق تلقائياً. إن لم يُعلَّم أي خبر، يظهر الأحدث.',
      },
    },
    // حقل داخلي لتتبّع من كتب الخبر — لا يُعرض للجمهور
    {
      name: 'authors',
      type: 'relationship',
      label: 'الكاتب (داخلي)',
      admin: {
        position: 'sidebar',
      },
      hasMany: true,
      relationTo: 'users',
    },
    // This field is only used to populate the user data via the `populateAuthors` hook
    // This is because the `user` collection has access control locked to protect user privacy
    // GraphQL will also not return mutated user data that differs from the underlying schema
    {
      name: 'populatedAuthors',
      type: 'array',
      access: {
        update: () => false,
      },
      admin: {
        disabled: true,
        readOnly: true,
      },
      fields: [
        {
          name: 'id',
          type: 'text',
        },
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
    slugField({
      // الافتراضي يمسح كل ما ليس [A-Za-z0-9_-] فيمحو العربية بالكامل.
      // هذه النسخة تُبقي الحروف العربية واللاتينية والأرقام.
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
    afterChange: [revalidatePost, exclusiveFeatured],
    afterRead: [populateAuthors],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100, // We set this interval for optimal live preview
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
