'use client'

import React, { useState } from 'react'

import { IconFacebook, IconTelegram, IconWhatsapp, IconX } from '@/components/Brand/icons'
import { cn } from '@/utilities/ui'

type Props = { url: string; title: string; className?: string }

export const ShareButtons: React.FC<Props> = ({ url, title, className }) => {
  const [copied, setCopied] = useState(false)
  const u = encodeURIComponent(url)
  const t = encodeURIComponent(title)

  const links = [
    { label: 'فيسبوك', Icon: IconFacebook, href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, hover: 'hover:bg-[#1877f2] hover:border-[#1877f2]' },
    { label: 'إكس', Icon: IconX, href: `https://twitter.com/intent/tweet?url=${u}&text=${t}`, hover: 'hover:bg-black hover:border-black' },
    { label: 'واتساب', Icon: IconWhatsapp, href: `https://wa.me/?text=${t}%20${u}`, hover: 'hover:bg-[#25d366] hover:border-[#25d366]' },
    { label: 'تيليجرام', Icon: IconTelegram, href: `https://t.me/share/url?url=${u}&text=${t}`, hover: 'hover:bg-[#2aabee] hover:border-[#2aabee]' },
  ]

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* المتصفّح قد يمنع النسخ */
    }
  }

  const base =
    'grid size-[34px] place-items-center rounded-[9px] border border-border bg-secondary text-ink-soft transition hover:-translate-y-0.5 hover:text-white'

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {links.map(({ label, Icon, href, hover }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`مشاركة على ${label}`}
          className={cn(base, hover)}
        >
          <Icon className="size-4" />
        </a>
      ))}
      <button
        onClick={copy}
        aria-label="نسخ الرابط"
        title={copied ? 'تم النسخ' : 'نسخ الرابط'}
        className={cn(base, 'cursor-pointer hover:border-brand hover:bg-brand', copied && 'border-brand bg-brand text-white')}
      >
        {copied ? (
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
            <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
            <path d="M3.9 12a3.1 3.1 0 0 1 3.1-3.1h4V7h-4a5 5 0 0 0 0 10h4v-1.9h-4A3.1 3.1 0 0 1 3.9 12zm4.1 1h8v-2H8v2zm5-6v1.9h4a3.1 3.1 0 0 1 0 6.2h-4V17h4a5 5 0 0 0 0-10h-4z" />
          </svg>
        )}
      </button>
    </div>
  )
}
