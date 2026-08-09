import type { BasePayload } from 'payload'

/**
 * أرقام لوحة البداية.
 *
 * تجميعات SQL مباشرة لا نداءات `find` متكرّرة: الأرشيف ١٤٥ ألف خبر، وجمع
 * المشاهدات لكل محرّر عبر واجهة المستندات يعني تحميلها كلّها إلى الذاكرة.
 * كل رقم هنا استعلام واحد يعود بصفّ أو صفوف معدودة.
 */

export type TopPost = { id: number; title: string; views: number; category: string | null }
export type EditorRow = { name: string; posts: number; views: number }
export type CategoryRow = { title: string; posts: number }
export type ViewPoint = { label: string; views: number }
export type MediaRow = { id: number; url: string | null; alt: string | null }

export type Dashboard = {
  publishedToday: number
  breakingActive: number
  editorsToday: number
  viewsToday: number | null
  viewsDelta: number | null
  topPosts: TopPost[]
  editors: EditorRow[]
  categories: CategoryRow[]
  viewSeries: ViewPoint[]
  latestMedia: MediaRow[]
  missingImage: number
  missingCategory: number
}

const q = async <T>(payload: BasePayload, sql: string, params: unknown[] = []): Promise<T[]> => {
  try {
    const { rows } = await payload.db.pool.query(sql, params)
    return rows as T[]
  } catch {
    // ودجة واحدة لا يجوز أن تُسقط اللوحة كلّها
    return []
  }
}

const one = <T>(rows: T[]): T | undefined => rows[0]

export const getDashboard = async (payload: BasePayload): Promise<Dashboard> => {
  const [
    todayRow,
    breakingRow,
    editorsRow,
    top,
    editors,
    categories,
    stats,
    media,
    missing,
  ] = await Promise.all([
    q<{ n: string }>(
      payload,
      `SELECT count(*)::text n FROM posts
       WHERE _status='published' AND published_at >= date_trunc('day', now())`,
    ),
    q<{ n: string }>(
      payload,
      `SELECT count(*)::text n FROM posts WHERE _status='published' AND breaking = true`,
    ),
    q<{ n: string }>(
      payload,
      `SELECT count(DISTINCT created_by_id)::text n FROM posts
       WHERE _status='published' AND published_at >= date_trunc('day', now())`,
    ),
    // الأكثر قراءة — مع قسمه الأول
    q<{ id: number; title: string; views: string; category: string | null }>(
      payload,
      `SELECT p.id, p.title, COALESCE(p.views,0)::text AS views,
              (SELECT c.title FROM posts_rels r JOIN categories c ON c.id = r.categories_id
                WHERE r.parent_id = p.id AND r.path='categories' ORDER BY r."order" LIMIT 1) AS category
       FROM posts p
       WHERE p._status='published'
       ORDER BY p.views DESC NULLS LAST
       LIMIT 5`,
    ),
    // أداء المحرّرين — عدد الأخبار ومجموع مشاهداتها
    q<{ name: string | null; email: string; posts: string; views: string }>(
      payload,
      `SELECT u.name, u.email, count(*)::text AS posts,
              COALESCE(SUM(p.views),0)::text AS views
       FROM posts p JOIN users u ON u.id = p.created_by_id
       WHERE p._status='published'
       GROUP BY u.id, u.name, u.email
       ORDER BY count(*) DESC
       LIMIT 5`,
    ),
    q<{ title: string; posts: string }>(
      payload,
      `SELECT c.title, count(*)::text AS posts
       FROM posts_rels r
       JOIN categories c ON c.id = r.categories_id
       JOIN posts p ON p.id = r.parent_id AND p._status='published'
       WHERE r.path='categories'
       GROUP BY c.id, c.title
       ORDER BY count(*) DESC
       LIMIT 6`,
    ),
    // آخر ثماني لقطات — الفرق بين كل لقطتين هو مشاهدات ذلك اليوم
    q<{ date: string; views: string }>(
      payload,
      `SELECT date, views::text FROM daily_stats ORDER BY date DESC LIMIT 8`,
    ),
    q<{ id: number; url: string | null; alt: string | null }>(
      payload,
      `SELECT id, filename AS url, alt FROM media ORDER BY created_at DESC LIMIT 5`,
    ),
    q<{ no_image: string; no_category: string }>(
      payload,
      `SELECT
         count(*) FILTER (WHERE hero_image_id IS NULL)::text AS no_image,
         count(*) FILTER (WHERE NOT EXISTS (
           SELECT 1 FROM posts_rels r WHERE r.parent_id = p.id AND r.path='categories'
         ))::text AS no_category
       FROM posts p WHERE p._status='published'`,
    ),
  ])

  // اللقطات تعود تنازلياً؛ نعكسها ونحوّل التراكمي إلى يوميّ
  const snaps = [...stats].reverse()
  const viewSeries: ViewPoint[] = snaps.slice(1).map((s, i) => ({
    label: `${new Date(s.date).getDate()}/${new Date(s.date).getMonth() + 1}`,
    views: Math.max(0, Number(s.views) - Number(snaps[i].views)),
  }))

  const last = viewSeries.at(-1)?.views ?? null
  const prev = viewSeries.at(-2)?.views ?? null

  return {
    publishedToday: Number(one(todayRow)?.n ?? 0),
    breakingActive: Number(one(breakingRow)?.n ?? 0),
    editorsToday: Number(one(editorsRow)?.n ?? 0),
    viewsToday: last,
    viewsDelta: last !== null && prev !== null && prev > 0 ? Math.round(((last - prev) / prev) * 100) : null,
    topPosts: top.map((r) => ({
      id: r.id,
      title: r.title,
      views: Number(r.views),
      category: r.category,
    })),
    editors: editors.map((r) => ({
      name: r.name || r.email.split('@')[0],
      posts: Number(r.posts),
      views: Number(r.views),
    })),
    categories: categories.map((r) => ({ title: r.title, posts: Number(r.posts) })),
    viewSeries,
    latestMedia: media,
    missingImage: Number(one(missing)?.no_image ?? 0),
    missingCategory: Number(one(missing)?.no_category ?? 0),
  }
}
