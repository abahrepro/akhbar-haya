import type { Metadata } from 'next'
import React from 'react'

import { StaticPageShell } from '@/components/StaticPage'

const INFO = [
  {
    label: 'العنوان',
    value: 'عمّان، الأردن',
    icon: <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" />,
  },
  {
    label: 'البريد الإلكتروني',
    value: 'info@akhbarhayat.com',
    icon: <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 4v10h16V8l-8 5-8-5z" />,
  },
  {
    label: 'الهاتف',
    value: '+962 6 000 0000',
    icon: <path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11 11 0 0 0 3.5.56 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11 11 0 0 0 .56 3.5 1 1 0 0 1-.24 1l-2.2 2.3z" />,
  },
  {
    label: 'ساعات العمل',
    value: 'على مدار الساعة',
    icon: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 10V6h-2v7h6v-2h-4z" />,
  },
]

const field = 'rounded-[10px] border border-border bg-secondary px-3.5 py-3 text-[16px] outline-none focus:border-brand'

export default function ContactPage() {
  return (
    <StaticPageShell
      title="اتصل بنا"
      lead="يسعدنا تواصلك مع «أخبار حياة». راسلنا عبر النموذج أدناه أو عبر المعلومات المرفقة، وسنردّ في أقرب وقت ممكن."
    >
      <div className="grid gap-7 rounded-[14px] border border-border bg-card p-6 shadow-sm sm:grid-cols-2">
        <form className="flex flex-col gap-3.5">
          <label className="flex flex-col gap-1.5">
            <span className="text-[14.5px] font-bold text-ink-soft">الاسم</span>
            <input type="text" placeholder="اسمك الكامل" className={field} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[14.5px] font-bold text-ink-soft">البريد الإلكتروني</span>
            <input type="email" placeholder="بريدك الإلكتروني" className={field} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[14.5px] font-bold text-ink-soft">الموضوع</span>
            <input type="text" placeholder="موضوع الرسالة" className={field} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[14.5px] font-bold text-ink-soft">الرسالة</span>
            <textarea rows={4} placeholder="اكتب رسالتك…" className={`${field} resize-y`} />
          </label>
          <button
            type="submit"
            className="mt-1 self-start cursor-pointer rounded-full bg-brand px-6 py-3 font-bold text-white transition hover:bg-brand-deep"
          >
            إرسال الرسالة
          </button>
        </form>

        <div>
          {INFO.map((row) => (
            <div
              key={row.label}
              className="flex items-center gap-3 border-b border-border py-3 last:border-b-0"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-brand-tint">
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-5 text-brand">
                  {row.icon}
                </svg>
              </span>
              <span>
                <b className="block text-[15.5px]">{row.label}</b>
                <span className="text-[14px] text-muted-foreground">{row.value}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </StaticPageShell>
  )
}

export const metadata: Metadata = {
  title: 'اتصل بنا — أخبار حياة',
  description: 'تواصل مع فريق أخبار حياة.',
}
