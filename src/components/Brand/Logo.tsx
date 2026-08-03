import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import { cn } from '@/utilities/ui'

type Props = {
  className?: string
  /** يُستخدم على الخلفيات الداكنة (الفوتر) — يقلب الشعار إلى أبيض */
  onDark?: boolean
  /** رابط الوجهة — مرّر null لعرض الشعار بدون رابط */
  href?: string | null
  /** ارتفاع الشعار بالبكسل (العرض يُحسب تلقائياً بنسبة 3.28:1) */
  height?: number
}

/** الشعار الكامل: العلامة الدائرية + اسم «أخبار حياة» */
export const BrandLogo: React.FC<Props> = ({
  className,
  onDark = false,
  href = '/',
  height = 44,
}) => {
  const width = Math.round(height * 3.284)

  const img = (
    <Image
      src="/brand/logo-full.svg"
      alt="أخبار حياة"
      width={width}
      height={height}
      priority
      className={cn('h-auto w-auto', onDark && 'brightness-0 invert')}
      style={{ height, width }}
    />
  )

  const classes = cn('flex shrink-0 items-center', className)

  if (href === null) return <div className={classes}>{img}</div>

  return (
    <Link href={href} className={classes} aria-label="أخبار حياة — الصفحة الرئيسية">
      {img}
    </Link>
  )
}

/** العلامة الدائرية وحدها — للمساحات الضيقة */
export const BrandMark: React.FC<{ className?: string; size?: number; onDark?: boolean }> = ({
  className,
  size = 40,
  onDark,
}) => (
  <Image
    src="/brand/logomark.svg"
    alt="أخبار حياة"
    width={size}
    height={size}
    className={cn(onDark && 'brightness-0 invert', className)}
    style={{ height: size, width: size }}
  />
)
