import Link from 'next/link'
import React from 'react'

import { cn } from '@/utilities/ui'

type Props = {
  className?: string
  /** يستخدم داخل الفوتر حيث الخلفية داكنة */
  onDark?: boolean
}

export const BrandLogo: React.FC<Props> = ({ className, onDark = false }) => (
  <Link href="/" className={cn('flex items-center gap-3 shrink-0', className)}>
    <span className="grid size-11 place-items-center rounded-[13px] bg-linear-150 from-brand to-brand-deep shadow-[0_6px_16px_-6px_rgba(15,124,62,.6)]">
      <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
        <rect x="4" y="5" width="16" height="2.6" rx="1.3" fill="#fff" />
        <rect x="7" y="10.7" width="13" height="2.6" rx="1.3" fill="#fff" />
        <rect x="4" y="16.4" width="16" height="2.6" rx="1.3" fill="#fff" />
      </svg>
    </span>
    <span className="leading-tight">
      <span
        className={cn(
          'block font-serif text-[22px] font-extrabold',
          onDark ? 'text-white' : 'text-foreground',
        )}
      >
        أخبار حياة
      </span>
      <span className={cn('block text-[11.5px] font-bold', onDark ? 'text-[#8fd6a8]' : 'text-brand')}>
        مصداقية الخبر
      </span>
    </span>
  </Link>
)
