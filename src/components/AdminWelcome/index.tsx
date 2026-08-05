import type { ServerProps } from 'payload'
import React from 'react'

/**
 * شاشة استقبال الصحفيين — تظهر أعلى لوحة البداية.
 *
 * لوحة Payload الافتراضية شبكة بطاقات تقنية بلا توجيه. المحرّر يحتاج
 * ثلاثة أشياء عند الدخول: يكتب خبراً، يكمل مسودّاته، ويطمئن أن ما نشره
 * ظهر — فهذه الشاشة تقدّمها له بأزرار كبيرة واضحة قبل أي شيء آخر.
 */
export const AdminWelcome: React.FC<ServerProps> = async ({ payload, user }) => {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

  const [drafts, publishedToday] = await Promise.all([
    payload.count({
      collection: 'posts',
      where: { _status: { equals: 'draft' } },
      overrideAccess: false,
      user,
    }),
    payload.count({
      collection: 'posts',
      where: {
        and: [{ _status: { equals: 'published' } }, { publishedAt: { greater_than: startOfDay } }],
      },
      overrideAccess: false,
      user,
    }),
  ])

  const name = (user && 'name' in user && user.name) || 'بك'
  const siteURL = process.env.NEXT_PUBLIC_SERVER_URL || '/'

  return (
    <div className="ah-welcome">
      <h2 className="ah-welcome__title">أهلاً {String(name)} 👋</h2>

      <div className="ah-welcome__actions">
        <a href="/admin/collections/posts/create" className="ah-welcome__action ah-welcome__action--primary">
          <span className="ah-welcome__action-icon">＋</span>
          <span>
            <strong>خبر جديد</strong>
            <small>اكتب وانشر مباشرة</small>
          </span>
        </a>

        <a href="/admin/collections/posts?where[_status][equals]=draft" className="ah-welcome__action">
          <span className="ah-welcome__action-icon">📝</span>
          <span>
            <strong>المسودّات</strong>
            <small>{drafts.totalDocs.toLocaleString('ar-EG')} مسودّة بانتظار الإكمال</small>
          </span>
        </a>

        <a href="/admin/collections/media" className="ah-welcome__action">
          <span className="ah-welcome__action-icon">🖼</span>
          <span>
            <strong>الوسائط</strong>
            <small>رفع الصور وإدارتها</small>
          </span>
        </a>

        <a href={siteURL} target="_blank" rel="noopener" className="ah-welcome__action">
          <span className="ah-welcome__action-icon">🌐</span>
          <span>
            <strong>عرض الموقع</strong>
            <small>نُشر اليوم {publishedToday.totalDocs.toLocaleString('ar-EG')} خبراً</small>
          </span>
        </a>
      </div>
    </div>
  )
}
