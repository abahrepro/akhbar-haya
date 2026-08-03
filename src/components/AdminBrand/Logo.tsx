import React from 'react'

/** شعار أخبار حياة الظاهر في شاشة الدخول ولوحة التحكّم */
export const Logo: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      direction: 'rtl',
    }}
  >
    <span
      style={{
        width: 56,
        height: 56,
        borderRadius: 16,
        background: 'linear-gradient(150deg, #0f7c3e, #0a5b2c)',
        display: 'grid',
        placeItems: 'center',
        boxShadow: '0 8px 20px -8px rgba(15,124,62,.6)',
        flexShrink: 0,
      }}
    >
      <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true">
        <rect x="4" y="5" width="16" height="2.6" rx="1.3" fill="#fff" />
        <rect x="7" y="10.7" width="13" height="2.6" rx="1.3" fill="#fff" />
        <rect x="4" y="16.4" width="16" height="2.6" rx="1.3" fill="#fff" />
      </svg>
    </span>
    <span style={{ lineHeight: 1.15 }}>
      <strong style={{ display: 'block', fontSize: 26, fontWeight: 800 }}>أخبار حياة</strong>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f7c3e' }}>مصداقية الخبر</span>
    </span>
  </div>
)

export default Logo
