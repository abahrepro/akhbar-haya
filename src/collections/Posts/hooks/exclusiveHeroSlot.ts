import type { CollectionAfterChangeHook } from 'payload'

import type { Post } from '@/payload-types'

/**
 * موضع واحد لا يشغله خبران.
 *
 * تثبيت خبر في موضع يحرّر من كان فيه، فيبقى السلايدر خمسة مواضع لا أكثر
 * ولا يحتاج المحرّر أن يتذكّر فكّ القديم قبل تثبيت الجديد.
 */
export const exclusiveHeroSlot: CollectionAfterChangeHook<Post> = async ({
  doc,
  previousDoc,
  req,
  context,
}) => {
  if (!doc.heroSlot) return doc
  if (previousDoc?.heroSlot === doc.heroSlot) return doc
  if (context?.skipExclusiveHeroSlot) return doc

  const others = await req.payload.find({
    collection: 'posts',
    where: {
      and: [{ heroSlot: { equals: doc.heroSlot } }, { id: { not_equals: doc.id } }],
    },
    limit: 20,
    depth: 0,
    overrideAccess: true,
  })

  for (const other of others.docs) {
    await req.payload.update({
      collection: 'posts',
      id: other.id,
      data: { heroSlot: null },
      overrideAccess: true,
      context: { skipExclusiveHeroSlot: true },
    })
  }

  return doc
}
