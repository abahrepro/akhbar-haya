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

  // إيقاف القراءة الصوتية عند مغادرة الصفحة
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) speechSynthesis.cancel()
    }
  }, [])

  const toggleSpeech = useCallback(() => {
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
    const u = new SpeechSynthesisUtterance((el as HTMLElement).innerText)
    u.lang = 'ar-SA'
    const arVoice = speechSynthesis.getVoices().find((v) => /^ar/i.test(v.lang))
    if (arVoice) u.voice = arVoice
    u.onend = () => setSpeaking(false)
    u.onerror = () => setSpeaking(false)
    speechSynthesis.cancel()
    speechSynthesis.speak(u)
    setSpeaking(true)
  }, [articleSelector, speaking])

  const changeFont = useCallback(
    (dir: 1 | -1) => {
      const el = document.querySelector(articleSelector) as HTMLElement | null
      if (!el) return
      fontStep.current = Math.max(-2, Math.min(5, fontStep.current + dir))
      el.style.fontSize = `${18.5 + fontStep.current * 1.5}px`
    },
    [articleSelector],
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
