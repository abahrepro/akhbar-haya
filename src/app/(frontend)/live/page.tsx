import configPromise from '@payload-config'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import type { Post } from '@/payload-types'
import { AdSlot } from '@/components/Ads'
import { SectionHead } from '@/components/News/Bits'
import { NewsCard } from '@/components/News/Cards'
import { toNewsItem } from '@/components/News/types'

export const revalidate = 300

/** جدول البرامج — يُنقل لاحقاً إلى Global في لوحة التحكّم */
const SCHEDULE = [
  { time: '10:00', name: 'نشرة أخبار الصباح' },
  { time: '11:00', name: 'برنامج حياة الاقتصادية' },
  { time: '12:00', name: 'نشرة أخبار الظهيرة' },
  { time: '13:30', name: 'حوار اليوم — ضيف وقضية' },
  { time: '15:00', name: 'نشرة منتصف النهار' },
  { time: '18:00', name: 'النشرة الرئيسية' },
  { time: '20:00', name: 'بانوراما الأسبوع' },
]

/** يحدد البرنامج الجاري حسب توقيت عمّان */
const currentProgramIndex = (): number => {
  const now = new Date()
  const amman = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Amman',
  }).format(now)
  const [h, m] = amman.split(':').map(Number)
  const mins = h * 60 + m
  let idx = -1
  SCHEDULE.forEach((p, i) => {
    const [ph, pm] = p.time.split(':').map(Number)
    if (ph * 60 + pm <= mins) idx = i
  })
  return idx
}

export default async function LivePage() {
  const payload = await getPayload({ config: configPromise })
  const videos = await payload.find({
    collection: 'posts',
    where: { and: [{ _status: { equals: 'published' } }, { type: { equals: 'video' } }] },
    sort: '-publishedAt',
    limit: 6,
    depth: 1,
  })
  const clips = (videos.docs as Post[]).map(toNewsItem)
  const nowIdx = currentProgramIndex()

  return (
    <main className="container py-6">
      <nav className="mb-4 flex items-center gap-2 text-[14px] font-medium text-muted-foreground">
        <Link href="/" className="transition hover:text-brand">
          الرئيسية
        </Link>
        <span className="opacity-50">›</span>
        <span className="text-ink-soft">البث المباشر</span>
      </nav>

      <div className="mb-6 flex min-w-0 flex-col gap-5 lg:grid lg:items-start lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* المشغّل */}
        <div className="overflow-hidden rounded-[14px] border border-border shadow-sm">
          <div className="relative aspect-video bg-linear-140 from-[#123047] to-[#05121f]">
            <span className="ah-live-glow absolute start-3.5 top-3.5 z-3 inline-flex items-center gap-2 rounded-full bg-alert px-3 py-1.5 text-[14px] font-extrabold text-white">
              <span className="size-2 animate-pulse rounded-full bg-white" />
              مباشر
            </span>
            <button
              aria-label="تشغيل البث"
              className="absolute inset-0 z-2 m-auto grid size-[76px] cursor-pointer place-items-center rounded-full bg-white/92 text-brand-deep shadow-xl transition hover:scale-105"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="ms-1 size-8" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3.5 bg-card px-4.5 py-4">
            <div>
              <h1 className="font-serif text-[clamp(19px,2.4vw,25px)] font-extrabold">
                البث المباشر — قناة حياة
              </h1>
              {nowIdx >= 0 && (
                <div className="mt-1 text-[14.5px] font-medium text-muted-foreground">
                  يبثّ الآن: {SCHEDULE[nowIdx].name}
                </div>
              )}
            </div>
            <span className="inline-flex items-center gap-1.5 text-[14px] font-bold text-alert">
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
                <path d="M12 5a7 7 0 0 0-6.9 5.8 1 1 0 0 0 0 .4A7 7 0 1 0 12 5zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" />
              </svg>
              على الهواء
            </span>
          </div>
        </div>

        {/* جدول اليوم */}
        <aside className="overflow-hidden rounded-[14px] border border-border bg-card shadow-sm">
          <h3 className="flex items-center gap-2 border-b border-border px-4 py-3.5 font-serif text-[18px] font-extrabold">
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-4 text-brand" aria-hidden="true">
              <path d="M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm12 7v10H5V9h14z" />
            </svg>
            جدول اليوم
          </h3>
          {SCHEDULE.map((p, i) => (
            <div
              key={p.time}
              className={`flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 ${
                i === nowIdx ? 'bg-brand-tint' : ''
              }`}
            >
              <span
                className={`text-[14px] font-extrabold tabular-nums ${
                  i === nowIdx ? 'text-brand' : 'text-muted-foreground'
                }`}
              >
                {p.time}
              </span>
              <span className="text-[15.5px] font-bold">{p.name}</span>
              {i === nowIdx && (
                <span className="ms-auto rounded-full bg-alert px-2 py-0.5 text-[10.5px] font-extrabold text-white">
                  الآن
                </span>
              )}
            </div>
          ))}
        </aside>
      </div>

      <AdSlot source="google" size="970×90" name="Leaderboard" className="mb-8 h-[104px]" />

      {clips.length > 0 && (
        <section>
          <SectionHead title="مقاطع مختارة" href="/category/video" moreLabel="كل المقاطع" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clips.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

export const metadata: Metadata = {
  title: 'البث المباشر — أخبار حياة',
  description: 'شاهد البث المباشر لقناة حياة وتابع جدول البرامج والمقاطع المختارة.',
}
