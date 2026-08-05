import React from 'react'

import { cn } from '@/utilities/ui'

/**
 * تحويل روابط الفيديو إلى مشغّل مضمّن.
 *
 * المحرّرون معتادون على لصق الرابط في المتن فيتحوّل وحده — سلوك ووردبريس.
 * هنا نطابقه: نتعرّف على الرابط ونبني منه إطار التشغيل الرسمي للمنصّة.
 */

export type VideoSource = { src: string; title: string; ratio: 'video' | 'tall' | 'square' }

/** يستخرج معرّف يوتيوب من كل صيغ روابطه */
const youtubeId = (u: URL): string | null => {
  if (/(^|\.)youtu\.be$/.test(u.hostname)) return u.pathname.slice(1) || null
  if (!/(^|\.)youtube(-nocookie)?\.com$/.test(u.hostname)) return null
  if (u.pathname === '/watch') return u.searchParams.get('v')
  return u.pathname.match(/^\/(embed|shorts|live|v)\/([\w-]+)/)?.[2] ?? null
}

const host = (u: URL, ...names: string[]) =>
  names.some((n) => u.hostname === n || u.hostname.endsWith('.' + n))

/**
 * يتعرّف على رابط المنصّة ويبني منه إطار التشغيل الرسمي.
 * كل منصّة هنا توفّر إطاراً معلَناً؛ ما لا يوفّره يُترك رابطاً كما هو
 * بدل عرض إطار مكسور.
 */
export const parseVideoUrl = (raw?: string | null): VideoSource | null => {
  if (!raw) return null
  let u: URL
  try {
    u = new URL(raw.trim())
  } catch {
    return null
  }

  // ===== يوتيوب =====
  const yt = youtubeId(u)
  // nocookie: لا يزرع تتبّعاً قبل أن يضغط القارئ تشغيل
  if (yt) return { src: `https://www.youtube-nocookie.com/embed/${yt}`, title: 'يوتيوب', ratio: 'video' }

  // ===== فيسبوك =====
  if (host(u, 'facebook.com', 'fb.watch', 'fb.com')) {
    const reel = u.pathname.match(/\/(reel|videos)\/(\d+)/)
    return {
      src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(u.href)}&show_text=false`,
      title: 'فيسبوك',
      ratio: reel?.[1] === 'reel' ? 'tall' : 'video',
    }
  }

  // ===== إكس =====
  if (host(u, 'twitter.com', 'x.com')) {
    const id = u.pathname.match(/\/status\/(\d+)/)?.[1]
    if (id)
      return {
        src: `https://platform.twitter.com/embed/Tweet.html?id=${id}&theme=light&lang=ar`,
        title: 'إكس',
        ratio: 'square',
      }
  }

  // ===== إنستغرام =====
  if (host(u, 'instagram.com', 'instagr.am')) {
    const m = u.pathname.match(/\/(p|reel|reels|tv)\/([\w-]+)/)
    if (m)
      return {
        src: `https://www.instagram.com/${m[1] === 'reels' ? 'reel' : m[1]}/${m[2]}/embed`,
        title: 'إنستغرام',
        ratio: 'tall',
      }
  }

  // ===== تيك توك =====
  if (host(u, 'tiktok.com')) {
    const id = u.pathname.match(/\/video\/(\d+)/)?.[1]
    if (id) return { src: `https://www.tiktok.com/embed/v2/${id}`, title: 'تيك توك', ratio: 'tall' }
  }

  // ===== تيليغرام =====
  if (host(u, 't.me', 'telegram.me')) {
    const m = u.pathname.match(/^\/([\w_]+)\/(\d+)/)
    if (m)
      return {
        src: `https://t.me/${m[1]}/${m[2]}?embed=1`,
        title: 'تيليغرام',
        ratio: 'square',
      }
  }

  // ===== ساوندكلاود / سبوتيفاي (بودكاست) =====
  if (host(u, 'soundcloud.com'))
    return {
      src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(u.href)}&color=%23026938`,
      title: 'ساوندكلاود',
      ratio: 'square',
    }

  if (host(u, 'open.spotify.com')) {
    const m = u.pathname.match(/^\/(episode|show|track|playlist|album)\/(\w+)/)
    if (m)
      return {
        src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`,
        title: 'سبوتيفاي',
        ratio: 'square',
      }
  }

  // ===== فيميو / ديلي موشن =====
  if (host(u, 'vimeo.com')) {
    const id = u.pathname.match(/(\d+)/)?.[1]
    if (id) return { src: `https://player.vimeo.com/video/${id}`, title: 'فيميو', ratio: 'video' }
  }

  if (host(u, 'dailymotion.com', 'dai.ly')) {
    const id = host(u, 'dai.ly')
      ? u.pathname.slice(1)
      : u.pathname.match(/\/video\/([\w]+)/)?.[1]
    if (id)
      return { src: `https://www.dailymotion.com/embed/video/${id}`, title: 'ديلي موشن', ratio: 'video' }
  }

  // ===== رمبل =====
  if (host(u, 'rumble.com')) {
    const id = u.pathname.match(/\/embed\/([\w]+)/)?.[1]
    if (id) return { src: `https://rumble.com/embed/${id}/`, title: 'رمبل', ratio: 'video' }
  }

  return null
}

export const VideoEmbed: React.FC<{ url?: string | null; className?: string }> = ({
  url,
  className,
}) => {
  const v = parseVideoUrl(url)
  if (!v) return null

  /**
   * الارتفاع بحشوة نسبية لا بـ`aspect-ratio`.
   *
   * الإطار عنصر مستبدَل: لا `inset-0` يمدّه ولا `height:100%` — الأول لأن
   * العناصر المستبدَلة تحتفظ بمقاسها الأصلي (٣٠٠×١٥٠)، والثاني لأن ارتفاع
   * الأب المشتقّ من `aspect-ratio` ليس ارتفاعاً محدّداً تُحسب عليه النسب.
   * قِيس الاثنان على الخبر التجريبي: ٤٢٠×١٥٠ ثم ٣٠٠×١٥٠.
   * الحشوة النسبية تعطي صندوقاً بارتفاع محدّد فينضبط الإطار داخله.
   */
  const pad = v.ratio === 'tall' ? '177.78%' : v.ratio === 'square' ? '100%' : '56.25%'
  const width =
    v.ratio === 'tall' ? 'mx-auto max-w-[420px]' : v.ratio === 'square' ? 'mx-auto max-w-[560px]' : ''

  return (
    <div className={cn('not-prose my-6', width, className)}>
      <div
        className="relative h-0 overflow-hidden rounded-[14px] bg-black shadow-sm"
        style={{ paddingTop: pad }}
      >
        {/**
         * المقاس بنمط مباشر لا بفئات Tailwind.
         * `.h-full` لم تكن موجودة في الملف المنشور أصلاً — الماسح لم يلتقط
         * فئات هذا المكوّن الجديد، فبقي الإطار على مقاسه الأصلي ١٥٠ بكسل.
         * ثبّت يدوياً في المتصفّح أن `height:100%` يعطي ٧٤٧ حين يُطبَّق.
         */}
        <iframe
          src={v.src}
          title={v.title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 0,
          }}
        />
      </div>
    </div>
  )
}
