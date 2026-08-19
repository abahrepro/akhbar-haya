import type { Category, Media, Post } from '@/payload-types'
import { isBreakingNow } from '@/utilities/breaking'
import { postHref } from '@/utilities/postUrl'

/** الشكل المبسّط الذي تستهلكه بطاقات الأخبار */
export type NewsItem = {
  id: string | number
  title: string
  slug: string
  href: string
  excerpt?: string | null
  image?: Media | null
  imageAlt?: string
  category?: { title: string; slug: string; color?: string | null } | null
  publishedAt?: string | null
  type?: Post['type']
  breaking?: boolean | null
}

const asMedia = (v: unknown): Media | null =>
  v && typeof v === 'object' && 'url' in (v as Media) ? (v as Media) : null

const firstCategory = (cats: Post['categories']): NewsItem['category'] => {
  if (!Array.isArray(cats) || cats.length === 0) return null
  const c = cats[0]
  if (typeof c === 'object' && c !== null && 'title' in c) {
    const cat = c as Category
    return { title: cat.title, slug: cat.slug ?? '', color: cat.color }
  }
  return null
}

/** يحوّل مستند Payload إلى NewsItem جاهز للعرض */
export const toNewsItem = (post: Post): NewsItem => ({
  id: post.id,
  title: post.title,
  slug: post.slug ?? '',
  href: postHref(post),
  excerpt: post.excerpt ?? post.meta?.description ?? null,
  image: asMedia(post.heroImage) ?? asMedia(post.meta?.image),
  imageAlt: post.title,
  category: firstCategory(post.categories),
  publishedAt: post.publishedAt,
  type: post.type,
  breaking: isBreakingNow(post),
})
