import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import './index.scss'

const baseClass = 'before-dashboard'

const QUICK_LINKS = [
  { href: '/admin/collections/posts/create', label: '✍️ إضافة خبر جديد' },
  { href: '/admin/collections/posts', label: '📰 كل الأخبار' },
  { href: '/admin/collections/media', label: '🖼️ مكتبة الوسائط' },
  { href: '/admin/collections/categories', label: '🗂️ الأقسام' },
  { href: '/admin/collections/tags', label: '🏷️ الوسوم' },
  { href: '/', label: '🌐 معاينة الموقع' },
]

const BeforeDashboard: React.FC = () => {
  return (
    <div className={baseClass}>
      <Banner className={`${baseClass}__banner`} type="success">
        <h4>أهلاً بك في لوحة تحكّم أخبار حياة</h4>
      </Banner>

      <p style={{ marginBottom: 12 }}>روابط سريعة تختصر عليك الطريق:</p>

      <div
        style={{
          display: 'grid',
          gap: 10,
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        }}
      >
        {QUICK_LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target={l.href === '/' ? '_blank' : undefined}
            rel={l.href === '/' ? 'noopener noreferrer' : undefined}
            style={{
              display: 'block',
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid var(--theme-elevation-150)',
              background: 'var(--theme-elevation-50)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            {l.label}
          </a>
        ))}
      </div>

      <p style={{ marginTop: 16, opacity: 0.75, fontSize: 13 }}>
        تذكير: علّم الخبر بـ«عاجل» ليظهر في شريط التنبيه، وبـ«مميّز» ليظهر في أعلى الصفحة الرئيسية.
      </p>
    </div>
  )
}

export default BeforeDashboard
