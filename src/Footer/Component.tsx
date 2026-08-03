import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import { BrandLogo } from '@/components/Brand/Logo'
import { IconFacebook, IconTelegram, IconX, IconYoutube } from '@/components/Brand/icons'

const ABOUT_LINKS = [
  { label: 'من نحن', href: '/about' },
  { label: 'اتصل بنا', href: '/contact' },
  { label: 'سياسة الخصوصية', href: '/privacy' },
  { label: 'أعلن معنا', href: '/advertise' },
]

const SOCIALS = [
  { Icon: IconFacebook, label: 'فيسبوك', href: '#' },
  { Icon: IconX, label: 'إكس', href: '#' },
  { Icon: IconYoutube, label: 'يوتيوب', href: '#' },
  { Icon: IconTelegram, label: 'تيليجرام', href: '#' },
]

export async function Footer() {
  const payload = await getPayload({ config: configPromise })

  const categories = await payload.find({
    collection: 'categories',
    sort: 'order',
    limit: 12,
    depth: 0,
    select: { title: true, slug: true },
  })

  const cats = categories.docs.filter((c) => Boolean(c.slug))
  const firstCol = cats.slice(0, 5)
  const secondCol = cats.slice(5, 10)
  const year = new Date().getFullYear()

  return (
    <footer className="mt-10 bg-brand-deep text-[#cfe6d7] dark:bg-[#0a1712]">
      <div className="container grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        {/* الهوية */}
        <div>
          <BrandLogo onDark />
          <p className="mt-3.5 max-w-[34ch] text-[13.5px] leading-[1.8] opacity-80">
            الموقع الإخباري لمجموعة حياة الإعلامية — أخبار محلية وعالمية، اقتصاد، رياضة، وتكنولوجيا،
            على مدار الساعة.
          </p>
          <div className="mt-4 flex gap-2">
            {SOCIALS.map(({ Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="grid size-[34px] place-items-center rounded-[9px] bg-white/10 text-white transition hover:bg-white/25"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        {/* الأقسام */}
        <div>
          <h5 className="mb-3.5 text-[15px] font-extrabold text-white">الأقسام</h5>
          {firstCol.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="block py-1.5 text-[13.5px] opacity-80 transition hover:ps-1 hover:opacity-100"
            >
              {c.title}
            </Link>
          ))}
        </div>

        {/* المزيد */}
        <div>
          <h5 className="mb-3.5 text-[15px] font-extrabold text-white">المزيد</h5>
          {secondCol.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="block py-1.5 text-[13.5px] opacity-80 transition hover:ps-1 hover:opacity-100"
            >
              {c.title}
            </Link>
          ))}
          <Link
            href="/live"
            className="block py-1.5 text-[13.5px] opacity-80 transition hover:ps-1 hover:opacity-100"
          >
            البث المباشر
          </Link>
        </div>

        {/* عن الموقع */}
        <div>
          <h5 className="mb-3.5 text-[15px] font-extrabold text-white">عن الموقع</h5>
          {ABOUT_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block py-1.5 text-[13.5px] opacity-80 transition hover:ps-1 hover:opacity-100"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-4 text-[12.5px] opacity-80">
          <span>© {year} أخبار حياة — جميع الحقوق محفوظة لمجموعة حياة الإعلامية.</span>
          <span>مصداقية الخبر</span>
        </div>
      </div>
    </footer>
  )
}
