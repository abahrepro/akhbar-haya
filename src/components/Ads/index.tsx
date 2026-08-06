import configPromise from '@payload-config'
import Image from 'next/image'
import { getPayload } from 'payload'
import React, { cache } from 'react'

import type { Ad, AdSetting, Media } from '@/payload-types'
import { cn } from '@/utilities/ui'
import { AdImpression } from './AdImpression'
import { GoogleAd } from './GoogleAd'

export type Placement = 'leaderboard' | 'billboard' | 'sidebar-rect' | 'sidebar-half' | 'in-feed'

/**
 * المقاس المحجوز لكل مساحة.
 *
 * الارتفاع محجوز في التصميم قبل وصول الإعلان فلا تقفز الصفحة تحت القارئ حين
 * يصل — وهذا ما تقيسه جوجل في تجربة الصفحة. والصندوق يقصّ أي إعلان أكبر بدل
 * أن يتمدّد فيكسر التصميم.
 */
const SIZES: Record<Exclude<Placement, 'in-feed'>, { w: number; h: number }> = {
  leaderboard: { w: 970, h: 90 },
  billboard: { w: 970, h: 250 },
  'sidebar-rect': { w: 300, h: 250 },
  'sidebar-half': { w: 300, h: 600 },
}

/** إعدادات جوجل الخاصّة بكل مساحة */
type GoogleSlot = { enabled?: boolean | null; unitId?: string | null }
const SLOT_OF: Record<Exclude<Placement, 'in-feed'>, (s: AdSetting) => GoogleSlot | undefined> = {
  leaderboard: (s) => s.leaderboard,
  billboard: (s) => s.billboard,
  'sidebar-rect': (s) => s.sidebarRect,
  'sidebar-half': (s) => s.sidebarHalf,
}

const getSettings = cache(async (): Promise<AdSetting | null> => {
  const payload = await getPayload({ config: configPromise })
  try {
    return await payload.findGlobal({ slug: 'ad-settings', depth: 0 })
  } catch {
    // الإعدادات قد لا تكون مهيّأة بعد — الغياب يعني «جوجل مطفأ»
    return null
  }
})

/** الإعلان المباع المستحقّ لهذه المساحة، إن وُجد */
const getHouseAd = cache(async (placement: Placement, categoryId?: number | string) => {
  const payload = await getPayload({ config: configPromise })
  const now = new Date().toISOString()
  try {
    const res = await payload.find({
      collection: 'ads',
      where: {
        and: [
          { placement: { equals: placement } },
          { active: { equals: true } },
          { or: [{ startsAt: { exists: false } }, { startsAt: { less_than_equal: now } }] },
          { or: [{ endsAt: { exists: false } }, { endsAt: { greater_than: now } }] },
          // بلا أقسام = كل الموقع؛ ومع أقسام يظهر في قسمه وحده
          ...(categoryId
            ? [{ or: [{ categories: { exists: false } }, { categories: { in: [categoryId] } }] }]
            : []),
        ],
      },
      sort: '-priority',
      limit: 1,
      depth: 1,
    })
    return (res.docs?.[0] as Ad | undefined) ?? null
  } catch {
    // المجموعة قد لا تكون مهيّأة بعد — لا يصحّ أن تسقط الصفحة لأجل إعلان
    return null
  }
})

const asMedia = (v: unknown): Media | null =>
  v && typeof v === 'object' && 'url' in (v as Media) ? (v as Media) : null

/* ============ المساحة الإعلانية ============ */
export const AdSlot = async ({
  placement,
  categoryId,
  className,
}: {
  placement: Placement
  /** القسم الحالي — لاستهداف إعلان مخصّص لقسم بعينه */
  categoryId?: number | string
  className?: string
}) => {
  if (placement === 'in-feed') return <NativeAd categoryId={categoryId} className={className} />

  const size = SIZES[placement]
  const [ad, settings] = await Promise.all([getHouseAd(placement, categoryId), getSettings()])

  const slot = settings ? SLOT_OF[placement](settings) : undefined
  const googleOn = Boolean(
    settings?.enabled && settings?.publisherId && slot?.enabled && slot?.unitId,
  )

  // لا إعلان مباع ولا جوجل — لا نترك مربّعاً رمادياً فارغاً
  if (!ad && !googleOn) return null

  return (
    <div
      className={cn(
        'relative mx-auto grid w-full place-items-center overflow-hidden rounded-[9px] bg-secondary',
        className,
      )}
      style={{ maxWidth: size.w, height: size.h }}
      data-ad-placement={placement}
    >
      <span className="pointer-events-none absolute end-2 top-1.5 z-2 text-[10px] font-bold text-muted-foreground opacity-70">
        إعلان
      </span>
      {ad ? (
        <HouseCreative ad={ad} size={size} />
      ) : (
        <GoogleAd
          publisherId={String(settings?.publisherId)}
          unitId={String(slot?.unitId)}
          width={size.w}
          height={size.h}
        />
      )}
    </div>
  )
}

/** صورة الإعلان المباع مع تتبّع الظهور والنقر */
const HouseCreative: React.FC<{ ad: Ad; size: { w: number; h: number } }> = ({ ad, size }) => {
  const desktop = asMedia(ad.image)
  const mobile = asMedia(ad.imageMobile)
  if (!desktop?.url) return null

  return (
    <>
      <AdImpression id={ad.id} />
      <a
        href={`/api/ad-click?id=${ad.id}`}
        target="_blank"
        rel="nofollow sponsored noopener"
        className="block size-full"
        aria-label={ad.name}
      >
        <picture>
          {mobile?.url && <source media="(max-width: 640px)" srcSet={mobile.url} />}
          <Image
            src={desktop.url}
            alt={ad.name}
            width={size.w}
            height={size.h}
            className="size-full object-contain"
            unoptimized
          />
        </picture>
      </a>
    </>
  )
}

/* ============ الإعلان المدعوم بين الأخبار ============ */
export const NativeAd = async ({
  categoryId,
  className,
}: {
  categoryId?: number | string
  className?: string
}) => {
  const ad = await getHouseAd('in-feed', categoryId)
  if (!ad) return null

  const img = asMedia(ad.image)
  const href = `/api/ad-click?id=${ad.id}`

  return (
    <div
      className={cn(
        'relative grid items-center gap-4 rounded-[14px] border border-brand/30 bg-linear-135 from-brand-tint/60 to-card p-3.5 shadow-sm sm:grid-cols-[230px_1fr]',
        className,
      )}
    >
      <AdImpression id={ad.id} />
      <a
        href={href}
        target="_blank"
        rel="nofollow sponsored noopener"
        className="aspect-16/10 overflow-hidden rounded-[9px] bg-secondary"
      >
        {img?.url && (
          <Image
            src={img.url}
            alt={ad.name}
            width={460}
            height={288}
            className="size-full object-cover"
            unoptimized
          />
        )}
      </a>
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="self-start rounded-full border border-brand/30 bg-card px-2.5 py-0.5 text-[10.5px] font-extrabold text-brand-deep">
          محتوى مدعوم
        </span>
        <h3 className="text-pretty font-serif text-xl font-extrabold leading-[1.35]">
          {ad.headline || ad.name}
        </h3>
        {ad.sponsor && (
          <span className="text-[13.5px] font-medium text-muted-foreground">
            برعاية: {ad.sponsor}
          </span>
        )}
        <a
          href={href}
          target="_blank"
          rel="nofollow sponsored noopener"
          className="mt-1 self-start rounded-full bg-brand px-4 py-2 text-[14.5px] font-bold text-white transition hover:bg-brand-deep"
        >
          {ad.cta || 'اكتشف العرض'} ←
        </a>
      </div>
    </div>
  )
}
