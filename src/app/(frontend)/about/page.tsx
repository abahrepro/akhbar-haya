import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { StaticPageShell } from '@/components/StaticPage'

const VALUES = [
  {
    title: 'المصداقية',
    text: 'نتحقّق من الخبر قبل نشره، ولا نساوم على الحقيقة.',
    icon: (
      <path d="M12 1 3 5v6c0 5.6 3.8 10.7 9 12 5.2-1.3 9-6.4 9-12V5l-9-4zm-1.2 15L7 12.2l1.4-1.4 2.4 2.4 5-5L17.2 9 10.8 16z" />
    ),
  },
  {
    title: 'السرعة',
    text: 'نواكب الحدث لحظة بلحظة دون التفريط بالدقّة.',
    icon: (
      <>
        <path d="M13 3a9 9 0 1 0 8 8h-2a7 7 0 1 1-6-7V3z" />
        <path d="M12 8v5l4 2 .8-1.6L13.5 12V8z" />
      </>
    ),
  },
  {
    title: 'الحياد',
    text: 'ننقل كل الآراء ونحترم عقل القارئ وحقّه في المعرفة.',
    icon: <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-5 0-9 2.5-9 6v2h18v-2c0-3.5-4-6-9-6z" />,
  },
]

export default function AboutPage() {
  return (
    <StaticPageShell
      title="من نحن"
      lead="«أخبار حياة» هي البوابة الإخبارية لمجموعة حياة الإعلامية، تنقل الخبر المحلي والعربي والدولي بمصداقية ومهنية، على مدار الساعة."
    >
      <p>
        انطلقت أخبار حياة لتكون مصدراً موثوقاً للخبر في الأردن والمنطقة، بتغطية شاملة تمتد من الشأن
        المحلي والبرلماني إلى الاقتصاد والرياضة والتكنولوجيا. نلتزم بالدقّة والحياد، ونضع القارئ في
        قلب اهتمامنا.
      </p>

      <h2>قيمنا</h2>
      <div className="my-6 grid gap-4 sm:grid-cols-3">
        {VALUES.map((v) => (
          <div key={v.title} className="rounded-[14px] border border-border bg-card p-5 shadow-sm">
            <span className="mb-3 grid size-11 place-items-center rounded-xl bg-brand-tint">
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-5.5 text-brand">
                {v.icon}
              </svg>
            </span>
            <h3 className="mb-1.5 font-serif text-lg font-extrabold">{v.title}</h3>
            <p className="!mb-0 !text-sm !leading-relaxed text-ink-soft">{v.text}</p>
          </div>
        ))}
      </div>

      <h2>تواصل معنا</h2>
      <p>
        لأي استفسار أو تعاون، يمكنك التواصل معنا عبر صفحة <Link href="/contact">اتصل بنا</Link>.
      </p>
    </StaticPageShell>
  )
}

export const metadata: Metadata = {
  title: 'من نحن — أخبار حياة',
  description: 'تعرّف على أخبار حياة، البوابة الإخبارية لمجموعة حياة الإعلامية.',
}
