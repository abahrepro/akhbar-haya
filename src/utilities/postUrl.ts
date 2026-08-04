import type { Post } from '@/payload-types'

/**
 * رابط الخبر — المصدر الوحيد لبنية الروابط في الموقع.
 *
 * البنية `/{رقم}/{عنوان}` مطابقة تماماً لما كان عليه ووردبريس
 * (`/%post_id%/%postname%`)، فتبقى روابط الأرشيف المفهرسة في محرّكات
 * البحث — أكثر من ١٤٥ ألف رابط — عاملة كما هي بلا إعادة توجيه.
 *
 * الأخبار المرحّلة تستعمل `wpId`، والأخبار الجديدة معرّفها في Payload.
 */
export const postNumber = (post: Pick<Post, 'id' | 'wpId'>): number | string =>
  post.wpId ?? post.id

export const postHref = (post: Pick<Post, 'id' | 'wpId' | 'slug'>): string =>
  `/${postNumber(post)}/${post.slug ?? ''}`
