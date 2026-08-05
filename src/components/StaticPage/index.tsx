import Link from 'next/link'
import React from 'react'

/** غلاف موحّد للصفحات الثابتة (من نحن، اتصل بنا، الخصوصية…) */
export const StaticPageShell: React.FC<{
  title: string
  lead?: string
  updated?: string
  children: React.ReactNode
}> = ({ title, lead, updated, children }) => (
  <main className="container mx-auto max-w-[820px] py-8">
    <nav className="mb-4 flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
      <Link href="/" className="transition hover:text-brand">
        الرئيسية
      </Link>
      <span className="opacity-50">›</span>
      <span className="text-ink-soft">{title}</span>
    </nav>

    {updated && (
      <span className="mb-2 inline-block rounded-full border border-border bg-secondary px-3.5 py-1 text-[13px] font-bold text-muted-foreground">
        آخر تحديث: {updated}
      </span>
    )}

    <h1 className="font-serif text-[clamp(28px,4.2vw,42px)] font-black">{title}</h1>
    {lead && <p className="mt-3.5 text-[18.5px] leading-[1.8] text-ink-soft">{lead}</p>}

    <div className="ah-static mt-6">{children}</div>
  </main>
)
