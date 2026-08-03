import React from 'react'

/** الشعار الكامل في شاشة دخول لوحة التحكّم */
export const Logo: React.FC = () => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src="/brand/logo-full.svg"
    alt="أخبار حياة"
    style={{ width: 280, height: 'auto', display: 'block', margin: '0 auto' }}
  />
)

export default Logo
