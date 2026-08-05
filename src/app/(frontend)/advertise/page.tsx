import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

const STATS = [
  { n: '+1.2M', l: 'زائر شهرياً' },
  { n: '+4.5M', l: 'مشاهدة صفحة شهرياً' },
  { n: '+800K', l: 'متابع على المنصّات' },
  { n: '3:20', l: 'متوسّط مدّة الزيارة' },
]

const FORMATS = [
  { name: 'بانر علوي', src: 'google', size: '970×90', desc: 'مساحة بارزة أعلى الصفحة بأعلى معدّل مشاهدة.' },
  { name: 'بيلبورد داخل المحتوى', src: 'house', size: '970×250', desc: 'مساحة كبيرة وسط المحتوى تُباع مباشرة عبرنا.' },
  { name: 'إعلان مدعوم (Native)', src: 'house', size: 'بطاقة محتوى', desc: 'يظهر بشكل بطاقة خبر أنيقة وواضح أنه محتوى مدعوم.' },
  { name: 'مستطيل متوسط', src: 'google', size: '300×250', desc: 'في الشريط الجانبي — مثالي لكل الحملات.' },
  { name: 'نصف صفحة', src: 'google', size: '300×600', desc: 'أعلى معدّل ظهور في الشريط الجانبي.' },
  { name: 'شريط سفلي ثابت', src: 'google', size: '728×90', desc: 'يبقى ظاهراً أسفل الشاشة وقابل للإغلاق.' },
]

const WHY = [
  {
    title: 'جمهور واسع',
    text: 'وصول يومي لمئات الآلاف من القرّاء في الأردن والمنطقة.',
    icon: <path d="M12 5a7 7 0 0 0-6.9 5.8 1 1 0 0 0 0 .4A7 7 0 1 0 12 5zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" />,
  },
  {
    title: 'بيئة موثوقة',
    text: 'محتوى مهني يمنح علامتك التجارية مصداقية وأماناً.',
    icon: <path d="M12 1 3 5v6c0 5.6 3.8 10.7 9 12 5.2-1.3 9-6.4 9-12V5l-9-4z" />,
  },
  {
    title: 'تقارير أداء',
    text: 'نزوّدك بتقارير دورية عن مشاهدات ونقرات حملتك.',
    icon: <path d="M3 13h2v7H3v-7zm4-6h2v13H7V7zm4 3h2v10h-2V10zm4-6h2v16h-2V4zm4 9h2v7h-2v-7z" />,
  },
]

export default function AdvertisePage() {
  return (
    <main className="container py-6">
      <nav className="mb-4 flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
        <Link href="/" className="transition hover:text-brand">
          الرئيسية
        </Link>
        <span className="opacity-50">›</span>
        <span className="text-ink-soft">أعلن معنا</span>
      </nav>

      {/* الترويسة */}
      <div className="mb-7 overflow-hidden rounded-[14px] bg-linear-135 from-brand-deep to-brand px-8 py-10 text-white">
        <div className="max-w-[70ch]">
          <span className="mb-3.5 inline-block rounded-full bg-white/15 px-3 py-1 text-[12.5px] font-extrabold">
            أعلن معنا
          </span>
          <h1 className="font-serif text-[clamp(30px,4.6vw,46px)] font-black leading-[1.2]">
            وصّل رسالتك إلى جمهور الأردن والمنطقة
          </h1>
          <p className="mt-3 text-[clamp(15px,2vw,18px)] leading-relaxed opacity-90">
            «أخبار حياة» منصّة إخبارية موثوقة بجمهور واسع ومتفاعل. نوفّر لك حلولاً إعلانية مرنة تناسب
            أهدافك، من المساحات المباشرة إلى الإعلانات المدعومة والحملات المخصّصة.
          </p>
          <Link
            href="/contact"
            className="mt-5 inline-block rounded-full bg-white px-6 py-3 font-extrabold text-brand-deep transition hover:opacity-90"
          >
            احجز مساحتك
          </Link>
        </div>
      </div>

      {/* الأرقام */}
      <div className="mb-9 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((s) => (
          <div
            key={s.l}
            className="rounded-[14px] border border-border bg-card p-5 text-center shadow-sm"
          >
            <div className="font-serif text-[clamp(26px,3.4vw,36px)] font-black tabular-nums text-brand">
              {s.n}
            </div>
            <div className="mt-1 text-[13.5px] font-medium text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>

      {/* المساحات */}
      <div className="mb-4 flex items-center gap-3.5">
        <h2 className="relative ps-3.5 font-serif text-[22px] font-extrabold">
          <span className="absolute start-0 top-1/2 h-[22px] w-[5px] -translate-y-1/2 rounded bg-brand" />
          المساحات الإعلانية المتاحة
        </h2>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="mb-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FORMATS.map((f) => (
          <div key={f.name} className="rounded-[14px] border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 grid h-[78px] place-items-center rounded-lg border border-dashed border-border bg-secondary text-[12.5px] font-extrabold text-muted-foreground">
              {f.size}
            </div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-serif text-[17px] font-extrabold">{f.name}</h3>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                  f.src === 'house'
                    ? 'bg-brand-tint text-brand-deep'
                    : 'border border-border bg-secondary text-muted-foreground'
                }`}
              >
                {f.src === 'house' ? 'من خلالنا' : 'Google Ads'}
              </span>
            </div>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-soft">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* لماذا نحن */}
      <div className="mb-4 flex items-center gap-3.5">
        <h2 className="relative ps-3.5 font-serif text-[22px] font-extrabold">
          <span className="absolute start-0 top-1/2 h-[22px] w-[5px] -translate-y-1/2 rounded bg-brand" />
          لماذا أخبار حياة؟
        </h2>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="mb-9 grid gap-4 sm:grid-cols-3">
        {WHY.map((w) => (
          <div key={w.title} className="rounded-[14px] border border-border bg-card p-5 shadow-sm">
            <span className="mb-3 grid size-11 place-items-center rounded-xl bg-brand-tint">
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-5.5 text-brand">
                {w.icon}
              </svg>
            </span>
            <h3 className="mb-1.5 font-serif text-lg font-extrabold">{w.title}</h3>
            <p className="text-sm leading-relaxed text-ink-soft">{w.text}</p>
          </div>
        ))}
      </div>

      {/* دعوة للتواصل */}
      <div className="rounded-[14px] bg-linear-135 from-brand to-brand-deep p-8 text-center text-white shadow-sm">
        <h2 className="font-serif text-[clamp(22px,3vw,30px)] font-black">جاهز تبدأ حملتك؟</h2>
        <p className="mx-auto mt-2.5 max-w-[52ch] opacity-90">
          تواصل مع فريق الإعلانات وسنعود إليك بعرض يناسب أهدافك وميزانيتك.
        </p>
        <Link
          href="/contact"
          className="mt-5 inline-block rounded-full bg-white px-7 py-3 font-extrabold text-brand-deep transition hover:opacity-90"
        >
          تواصل معنا
        </Link>
      </div>
    </main>
  )
}

export const metadata: Metadata = {
  title: 'أعلن معنا — أخبار حياة',
  description: 'المساحات الإعلانية المتاحة على أخبار حياة وبيانات الجمهور.',
}
