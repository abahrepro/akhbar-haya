import Link from 'next/link'
import React from 'react'

import { AdSlot } from '@/components/Ads'
import type { NewsItem } from './types'

/** ودجت "الأكثر قراءة" */
export const MostReadWidget: React.FC<{ items: NewsItem[] }> = ({ items }) => {
  if (items.length === 0) return null
  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-3.5 text-base font-extrabold">
        <span className="grid size-6.5 place-items-center rounded-lg bg-brand-tint">
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-4 text-brand">
            <path d="M3 13h2v7H3v-7zm4-6h2v13H7V7zm4 3h2v10h-2V10zm4-6h2v16h-2V4zm4 9h2v7h-2v-7z" />
          </svg>
        </span>
        الأكثر قراءة
      </div>
      <div className="flex flex-col px-4">
        {items.map((item, i) => (
          <Link
            key={item.id}
            href={item.href}
            className="group flex items-start gap-3.5 border-b border-border py-3.5 last:border-b-0"
          >
            <span className="w-[30px] shrink-0 text-[26px] font-extrabold leading-none tabular-nums text-brand opacity-35 transition group-hover:opacity-90">
              {i + 1}
            </span>
            <h5 className="font-serif text-[14.5px] font-bold leading-[1.55] transition group-hover:text-brand">
              {item.title}
            </h5>
          </Link>
        ))}
      </div>
    </div>
  )
}

/** النشرة البريدية */
export const NewsletterWidget: React.FC = () => (
  <div className="rounded-[14px] bg-linear-150 from-brand to-brand-deep p-5 text-white shadow-sm">
    <h4 className="mb-1.5 font-serif text-lg font-extrabold">النشرة البريدية</h4>
    <p className="mb-3.5 text-[13.5px] leading-relaxed opacity-90">
      أهم أخبار اليوم تصلك على بريدك كل صباح. اشترك مجاناً.
    </p>
    <form className="flex gap-2">
      <input
        type="email"
        placeholder="بريدك الإلكتروني"
        aria-label="البريد الإلكتروني"
        className="min-w-0 flex-1 rounded-[9px] border-none bg-white px-3.5 py-2.5 text-sm text-foreground outline-none"
      />
      <button
        type="submit"
        className="shrink-0 rounded-[9px] bg-white px-4 text-sm font-extrabold text-brand-deep transition hover:opacity-90"
      >
        اشترك
      </button>
    </form>
  </div>
)

/** الشريط الجانبي الكامل */
export const Sidebar: React.FC<{ mostRead: NewsItem[] }> = ({ mostRead }) => (
  <aside className="sticky top-[90px] flex flex-col gap-6">
    <MostReadWidget items={mostRead} />
    <AdSlot source="google" size="300×250" name="Medium Rectangle" className="h-[250px]" />
    <NewsletterWidget />
    <AdSlot source="google" size="300×600" name="Half Page" className="h-[600px]" />
  </aside>
)
