import type { CollectionAfterChangeHook } from 'payload'

import type { Post } from '@/payload-types'

/**
 * يضمن أن خبراً واحداً فقط يكون «مميّزاً» في أي لحظة.
 *
 * عند تعليم خبر بـ«مميّز» يُلغى التعليم تلقائياً عن أي خبر آخر،
 * فيحلّ الجديد محلّ القديم في مكان الهيرو دون تدخّل يدوي.
 */
export const exclusiveFeatured: CollectionAfterChangeHook<Post> = async ({
  doc,
  previousDoc,
  req,
  context,
}) => {
  // لا نعمل شيئاً ما لم يُفعَّل «مميّز» في هذا التعديل تحديداً
  if (!doc.featured) return doc
  if (previousDoc?.featured) return doc

  // نمنع التكرار اللانهائي: التحديثات التي يُطلقها هذا الهوك تحمل هذه العلامة
  if (context?.skipExclusiveFeatured) return doc

  const others = await req.payload.find({
    collection: 'posts',
    where: {
      and: [{ featured: { equals: true } }, { id: { not_equals: doc.id } }],
    },
    limit: 50,
    depth: 0,
    overrideAccess: true,
  })

  for (const other of others.docs) {
    await req.payload.update({
      collection: 'posts',
      id: other.id,
      data: { featured: false },
      overrideAccess: true,
      context: { skipExclusiveFeatured: true, disableRevalidate: true },
    })
  }

  return doc
}
