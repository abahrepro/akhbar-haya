'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '@/utilities/ui'

const COLOR_MODES = [
  { cls: '', label: 'لون الصفحة' },
  { cls: 'ah-read-sepia', label: 'ورقي' },
  { cls: 'ah-read-contrast', label: 'تباين عالٍ' },
] as const

/** شريط تقدّم القراءة أعلى الصفحة */
export const ReadingProgress: React.FC = () => {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement
      const max = el.scrollHeight - el.clientHeight
      setPct(max > 0 ? (el.scrollTop / max) * 100 : 0)
    }
    onScroll()
    document.addEventListener('scroll', onScroll, { passive: true })
    return () => document.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="fixed inset-x-0 top-0 z-80 h-[3px] bg-transparent">
      <div
        className="h-full bg-linear-to-l from-brand to-gold transition-[width] duration-100"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/**
 * أدوات القراءة وإمكانية الوصول:
 * استماع صوتي، حجم الخط، لون الصفحة، ووضع القراءة المركّز.
 */
export const ReaderTools: React.FC<{ articleSelector?: string }> = ({
  articleSelector = '#article-body',
}) => {
  const [speaking, setSpeaking] = useState(false)
  const [colorMode, setColorMode] = useState(0)
  const [readingMode, setReadingMode] = useState(false)
  const fontStep = useRef(0)
  const baseFont = useRef(0)
  const [fontPct, setFontPct] = useState<number | null>(null)
  const pctTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // استعادة تفضيل حجم الخط من الزيارة السابقة
  useEffect(() => {
    const saved = Number(localStorage.getItem('ah-font-step') ?? 0)
    if (!saved) return
    const el = document.querySelector(articleSelector) as HTMLElement | null
    if (!el) return
    baseFont.current = parseFloat(getComputedStyle(el).fontSize) || 19
    fontStep.current = saved
    el.style.setProperty('font-size', `${baseFont.current + saved * 2}px`, 'important')
    el.style.setProperty('line-height', '1.95', 'important')
  }, [articleSelector])

  // إيقاف القراءة الصوتية عند مغادرة الصفحة
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) speechSynthesis.cancel()
    }
  }, [])

  /**
   * أفضل صوت عربي متاح.
   * `getVoices` يعود فارغاً في أول نداء على أغلب المتصفّحات — الأصوات
   * تُحمَّل لاحقاً وتُطلق `voiceschanged`. الاعتماد على النداء الأول كان
   * يترك `voice` فارغاً فيقرأ المتصفّح العربية بصوته الافتراضي (إنجليزي
   * غالباً) — وهذا سبب النطق الغريب.
   */
  const pickArabicVoice = useCallback((): Promise<SpeechSynthesisVoice | undefined> => {
    const best = () => {
      const ar = speechSynthesis.getVoices().filter((v) => /^ar/i.test(v.lang))
      if (!ar.length) return undefined
      // الأصوات المحسّنة أوضح بكثير من الافتراضية القديمة
      const score = (v: SpeechSynthesisVoice) =>
        /premium|enhanced|neural|siri|google/i.test(v.name) ? 2 : v.localService ? 1 : 0
      return [...ar].sort((a, b) => score(b) - score(a))[0]
    }
    const found = best()
    if (found) return Promise.resolve(found)
    return new Promise((resolve) => {
      const done = () => {
        speechSynthesis.removeEventListener('voiceschanged', done)
        resolve(best())
      }
      speechSynthesis.addEventListener('voiceschanged', done)
      // لا ننتظر إلى ما لا نهاية إن لم تصل الأصوات
      setTimeout(done, 1200)
    })
  }, [])

  const toggleSpeech = useCallback(async () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('المتصفّح لا يدعم قراءة النص صوتياً.')
      return
    }
    if (speaking) {
      speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    const el = document.querySelector(articleSelector)
    if (!el) return

    const voice = await pickArabicVoice()
    if (!voice) {
      alert('لا يوجد صوت عربي مثبّت على هذا الجهاز.')
      return
    }

    // نصّ نظيف: المسافات المتكرّرة تُنطق كوقفات عشوائية
    const text = (el as HTMLElement).innerText.replace(/\s+/g, ' ').trim()

    // نقسّم على الجُمل: المحرّكات تبتر النصوص الطويلة، والتقطيع يبقي
    // الوقفات في مواضعها الطبيعية بدل أن تأتي حيث ينقطع النَفَس
    const chunks = text.match(/[^.!؟?\n]+[.!؟?]*/g) ?? [text]

    speechSynthesis.cancel()
    chunks.forEach((chunk, i) => {
      const u = new SpeechSynthesisUtterance(chunk.trim())
      u.voice = voice
      u.lang = voice.lang
      u.rate = 0.92 // أبطأ قليلاً — العربية بلا تشكيل تحتاج مهلة للفهم
      u.pitch = 1
      if (i === chunks.length - 1) u.onend = () => setSpeaking(false)
      u.onerror = () => setSpeaking(false)
      speechSynthesis.speak(u)
    })
    setSpeaking(true)
  }, [articleSelector, speaking, pickArabicVoice])

  /**
   * تكبير النص وتصغيره.
   * كان المقاس الأساس رقماً ثابتاً (١٨٫٥) بينما المتن اليوم ٢٢٫٥ على
   * الشاشات الكبيرة — فأول ضغطة على «A+» كانت **تصغّر** النص. نقرأ
   * المقاس المحسوب فعلياً عند أول استعمال بدل افتراضه.
   */
  const applyFont = useCallback(
    (el: HTMLElement, step: number) => {
      const size = baseFont.current + step * 2
      // ‎!important‎ تتغلّب على أي قاعدة لاحقة أو تدخّل من متصفّح الجوّال
      el.style.setProperty('font-size', `${size}px`, 'important')
      el.style.setProperty('line-height', '1.95', 'important')
      return Math.round((size / baseFont.current) * 100)
    },
    [],
  )

  const changeFont = useCallback(
    (dir: 1 | -1) => {
      const el = document.querySelector(articleSelector) as HTMLElement | null
      if (!el) return
      if (baseFont.current === 0) {
        baseFont.current = parseFloat(getComputedStyle(el).fontSize) || 19
      }
      fontStep.current = Math.max(-2, Math.min(6, fontStep.current + dir))
      const pct = applyFont(el, fontStep.current)
      // نسبة تظهر لحظة الضغط — تأكيد مرئي بأن الزر استجاب
      setFontPct(pct)
      clearTimeout(pctTimer.current)
      pctTimer.current = setTimeout(() => setFontPct(null), 1400)
      try {
        localStorage.setItem('ah-font-step', String(fontStep.current))
      } catch {
        /* التخزين قد يكون معطّلاً */
      }
    },
    [articleSelector, applyFont],
  )

  const cycleColor = useCallback(() => {
    const next = (colorMode + 1) % COLOR_MODES.length
    COLOR_MODES.forEach((m) => m.cls && document.body.classList.remove(m.cls))
    if (COLOR_MODES[next].cls) document.body.classList.add(COLOR_MODES[next].cls)
    setColorMode(next)
  }, [colorMode])

  const toggleReading = useCallback(() => {
    const on = document.body.classList.toggle('ah-reading-mode')
    setReadingMode(on)
  }, [])

  const btn =
    'inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[14px] font-bold text-ink-soft transition hover:border-brand hover:text-brand cursor-pointer'
  const btnActive = 'bg-brand border-brand text-white hover:text-white'

  return (
    <div
      role="toolbar"
      aria-label="أدوات القراءة وإمكانية الوصول"
      className="my-5 flex flex-wrap items-center gap-2 rounded-full border border-border bg-secondary px-3 py-2"
    >
      <span className="me-1 hidden items-center gap-1.5 text-[13.5px] font-bold text-muted-foreground sm:inline-flex">
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-[15px]" aria-hidden="true">
          <path d="M12 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm7 7H5a1 1 0 0 0 0 2h4v3l-2 6h2l1.5-4.5L12 15l1 .5L14.5 20h2l-2-6v-3h4a1 1 0 0 0 0-2z" />
        </svg>
        أدوات القراءة
      </span>

      <button onClick={toggleSpeech} className={cn(btn, speaking && btnActive)}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
          <path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" />
        </svg>
        <span className="hidden sm:inline">{speaking ? 'إيقاف' : 'استماع'}</span>
      </button>

      <div className="inline-flex gap-1">
        <button
          onClick={() => changeFont(-1)}
          aria-label="تصغير حجم الخط"
          className={cn(btn, 'w-[38px] justify-center px-0 text-sm font-extrabold')}
        >
          −A
        </button>
        <button
          onClick={() => changeFont(1)}
          aria-label="تكبير حجم الخط"
          className={cn(btn, 'w-[38px] justify-center px-0 text-sm font-extrabold')}
        >
          +A
        </button>
        {fontPct !== null && (
          <span className="rounded-full bg-brand px-2.5 py-1 text-[13px] font-bold text-white">
            {fontPct}٪
          </span>
        )}
      </div>

      <button onClick={cycleColor} className={cn(btn, colorMode !== 0 && btnActive)}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
          <path d="M12 2a10 10 0 0 0 0 20c1.7 0 3-1.3 3-3 0-.8-.3-1.5-.8-2-.5-.5-.7-1-.7-1.5 0-.8.7-1.5 1.5-1.5H17a5 5 0 0 0 5-5c0-4.4-4.5-7-10-7zM6.5 13a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
        </svg>
        {COLOR_MODES[colorMode].label}
      </button>

      <button onClick={toggleReading} className={cn(btn, readingMode && btnActive)}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
          <path d="M4 4h7a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4V4zm16 0h-4a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h4V4z" />
        </svg>
        <span className="hidden sm:inline">وضع القراءة</span>
      </button>
    </div>
  )
}
