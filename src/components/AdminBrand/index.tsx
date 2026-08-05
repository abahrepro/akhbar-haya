import Image from 'next/image'
import React from 'react'

/**
 * هوية أخبار حياة داخل لوحة التحكّم.
 *
 * Payload يعرض شعاره في موضعين: أعلى الشريط الجانبي وشاشة الدخول.
 * يستبدلهما عبر `admin.components.graphics` — نقطة الاستبدال الرسمية،
 * فلا نلمس شيئاً من اللوحة نفسها.
 */

/** العلامة الدائرية — أعلى الشريط الجانبي */
export const AdminIcon: React.FC = () => (
  <Image src="/favicon.svg" alt="أخبار حياة" width={30} height={30} priority />
)

/** الشعار الكامل — شاشة تسجيل الدخول */
export const AdminLogo: React.FC = () => (
  <Image
    src="/brand/logo-full.svg"
    alt="أخبار حياة"
    width={260}
    height={79}
    priority
    style={{ height: 'auto', maxWidth: '100%' }}
  />
)
