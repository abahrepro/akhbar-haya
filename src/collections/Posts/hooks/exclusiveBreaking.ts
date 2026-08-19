import type { CollectionAfterChangeHook } from 'payload'

import type { Post } from '@/payload-types'

/**
 * خبر عاجل واحد في أي لحظة.
 *
 * كان العاجل بلا حصرية بعكس «المميّز»: تأشير خمسة أخبار يُبقيها كلّها
 * مؤشّرة، فتظهر شارة «عاجل» على بطاقات خمسة أخبار والشريط يعرض أحدثها
 * وحده — فيتناقض ما يراه القارئ في مكانين من الصفحة نفسها.
 *
 * تعليم خبر جديد يفكّ ما قبله فوراً حتى لو بقي من مدّته وقت: الأعجل يزيح
 * الأقدم، وهذا ما يتوقّعه المحرّر حين يعلّم خبراً بأنه عاجل.
 */
export const exclusiveBreaking: CollectionAfterChangeHook<Post> = async ({
  doc,
  previousDoc,
  req,
  context,
}) => {
  if (!doc.breaking) return doc
  if (previousDoc?.breaking) return doc
  if (context?.skipExclusiveBreaking) return doc

  const others = await req.payload.find({
    collection: 'posts',
    where: { and: [{ breaking: { equals: true } }, { id: { not_equals: doc.id } }] },
    limit: 50,
    depth: 0,
    overrideAccess: true,
  })

  for (const other of others.docs) {
    await req.payload.update({
      collection: 'posts',
      id: other.id,
      data: { breaking: false, breakingUntil: null },
      overrideAccess: true,
      context: { skipExclusiveBreaking: true },
    })
  }

  return doc
}
