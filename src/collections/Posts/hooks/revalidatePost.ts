import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Post } from '../../../payload-types'
import { postHref } from '@/utilities/postUrl'

export const revalidatePost: CollectionAfterChangeHook<Post> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      const path = postHref(doc)

      payload.logger.info(`Revalidating post at path: ${path}`)

      revalidatePath(path)
      revalidateTag('posts-sitemap', 'max')
    }

    // If the post was previously published, we need to revalidate the old path
    if (previousDoc._status === 'published' && doc._status !== 'published') {
      const oldPath = postHref(previousDoc)

      payload.logger.info(`Revalidating old post at path: ${oldPath}`)

      revalidatePath(oldPath)
      revalidateTag('posts-sitemap', 'max')
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Post> = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    const path = doc ? postHref(doc) : "/"

    revalidatePath(path)
    revalidateTag('posts-sitemap', 'max')
  }

  return doc
}
