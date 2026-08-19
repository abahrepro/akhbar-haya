import type { Post } from '@/payload-types'

/**
 * هل الخبر عاجل الآن؟
 *
 * التأشير وحده لا يكفي: العاجل له نافذة زمنية تنتهي، والعمود يبقى مؤشّراً
 * حتى يُحفظ الخبر من جديد. المقارنة هنا تجعل الموقع يتوقّف عن عرضه في
 * لحظته دون انتظار أي مهمّة خلفية.
 */
export const isBreakingNow = (post: Pick<Post, 'breaking' | 'breakingUntil'>): boolean => {
  if (!post.breaking) return false
  if (!post.breakingUntil) return true
  return new Date(post.breakingUntil).getTime() > Date.now()
}
