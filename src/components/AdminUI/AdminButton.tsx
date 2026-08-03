import React from 'react'

import { cn } from '@/utilities/ui'

type Variant = 'primary' | 'alert' | 'ghost'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[var(--ah-brand)] text-white border-[var(--ah-brand)] hover:bg-[var(--ah-brand-deep)] hover:border-[var(--ah-brand-deep)]',
  alert: 'bg-[var(--ah-alert)] text-white border-[var(--ah-alert)] hover:brightness-92',
  ghost:
    'bg-[var(--ah-surface-2)] text-[var(--ah-text)] border-[var(--ah-line)] hover:border-[var(--ah-brand)] hover:text-[var(--ah-brand)]',
}

/** زر موحّد داخل اللوحة (يُقدَّم كرابط) */
export const AdminButton: React.FC<{
  children: React.ReactNode
  href: string
  variant?: Variant
  external?: boolean
  className?: string
}> = ({ children, href, variant = 'ghost', external, className }) => (
  <a
    href={href}
    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    className={cn(
      'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-bold no-underline transition-all hover:-translate-y-px',
      VARIANTS[variant],
      className,
    )}
  >
    {children}
  </a>
)
