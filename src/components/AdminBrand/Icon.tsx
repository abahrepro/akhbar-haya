import React from 'react'

/** الأيقونة المصغّرة في شريط لوحة التحكّم العلوي */
export const Icon: React.FC = () => (
  <span
    style={{
      width: 32,
      height: 32,
      borderRadius: 9,
      background: 'linear-gradient(150deg, #0f7c3e, #0a5b2c)',
      display: 'grid',
      placeItems: 'center',
    }}
  >
    <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
      <rect x="4" y="5" width="16" height="2.6" rx="1.3" fill="#fff" />
      <rect x="7" y="10.7" width="13" height="2.6" rx="1.3" fill="#fff" />
      <rect x="4" y="16.4" width="16" height="2.6" rx="1.3" fill="#fff" />
    </svg>
  </span>
)

export default Icon
