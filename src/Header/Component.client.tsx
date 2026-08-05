'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'

import { BrandLogo } from '@/components/Brand/Logo'
import {
  IconArrow,
  IconCalendar,
  IconClock,
  IconClose,
  IconFacebook,
  IconMenu,
  IconMoon,
  IconSearch,
  IconX,
  IconYoutube,
} from '@/components/Brand/icons'
import { useTheme } from '@/providers/Theme'
import { cn } from '@/utilities/ui'

export type NavItem = { label: string; href: string }
export type TickerItem = { title: string; href: string }

type Props = {
  navItems: NavItem[]
  ticker: TickerItem[]
  hijriDate: string
  gregorianDate: string
}

const POPULAR = ['الملكية العقارية', 'مجلس النواب', 'أسعار الذهب', 'غزة', 'الطقس', 'كأس آسيا']

export const HeaderClient: React.FC<Props> = ({ navItems, ticker, hijriDate, gregorianDate }) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const pathname = usePathname()
  const router = useRouter()
  const { setTheme, theme } = useTheme()

  // إغلاق القوائم عند تغيّر الصفحة
  useEffect(() => {
    setMenuOpen(false)
    setSearchOpen(false)
  }, [pathname])

  // منع تمرير الصفحة عند فتح طبقة
  useEffect(() => {
    document.body.style.overflow = menuOpen || searchOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen, searchOpen])

  // الإغلاق بمفتاح Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [setTheme, theme])

  const submitSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const q = query.trim()
      if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
    },
    [query, router],
  )

  return (
    <>
      {/* ===== شريط الأدوات العلوي ===== */}
      <div className="bg-brand-deep text-[14px] text-[#dff0e6] dark:bg-[#0a1712]">
        <div className="container flex h-10 items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 whitespace-nowrap opacity-95">
            <IconCalendar className="size-3.5" />
            <span>{gregorianDate}</span>
            <span className="hidden size-1 rounded-full bg-current opacity-50 sm:block" />
            <span className="hidden sm:block">{hijriDate}</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/live"
              className="ah-live-glow relative inline-flex items-center gap-2.5 rounded-full bg-[#c62b1f] px-3 py-1.5 text-[13.5px] font-extrabold text-white"
            >
              <span className="ah-eq inline-flex h-[13px] items-center gap-[2px]">
                <i />
                <i />
                <i />
                <i />
              </span>
              البث المباشر
            </Link>

            <div className="hidden items-center gap-1 sm:flex">
              <a
                href="#"
                aria-label="فيسبوك"
                className="grid size-7 place-items-center rounded-[7px] opacity-85 transition hover:bg-white/15 hover:opacity-100"
              >
                <IconFacebook className="size-[15px]" />
              </a>
              <a
                href="#"
                aria-label="إكس"
                className="grid size-7 place-items-center rounded-[7px] opacity-85 transition hover:bg-white/15 hover:opacity-100"
              >
                <IconX className="size-[15px]" />
              </a>
              <a
                href="#"
                aria-label="يوتيوب"
                className="grid size-7 place-items-center rounded-[7px] opacity-85 transition hover:bg-white/15 hover:opacity-100"
              >
                <IconYoutube className="size-[15px]" />
              </a>
            </div>

            <span className="mx-1 h-5 w-px bg-white/20" />
            <button
              onClick={toggleTheme}
              aria-label="تبديل الوضع الليلي"
              title="تبديل الوضع"
              className="grid size-[30px] cursor-pointer place-items-center rounded-lg border border-white/20 bg-white/10 transition hover:bg-white/20"
            >
              <IconMoon className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ===== شريط آخر الأخبار ===== */}
      {ticker.length > 0 && (
        <div className="border-b border-border bg-card">
          <div className="container flex h-[46px] items-stretch overflow-hidden">
            <div className="ah-ticker-tag flex shrink-0 items-center gap-2 bg-brand px-4 text-sm font-extrabold text-white">
              <IconClock className="size-[15px]" />
              آخر الأخبار
            </div>
            <div className="ah-ticker-track relative flex flex-1 items-center overflow-hidden">
              <div className="ah-ticker-move flex gap-10 whitespace-nowrap ps-6">
                {ticker.map((t, i) => (
                  <Link
                    key={i}
                    href={t.href}
                    className="inline-flex items-center gap-10 text-[15.5px] font-medium text-ink-soft transition after:size-[5px] after:rounded-full after:bg-brand after:opacity-60 after:content-[''] hover:text-brand"
                  >
                    {t.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== الهيدر الرئيسي ===== */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md backdrop-saturate-150">
        <div className="container flex h-[74px] items-center gap-5">
          <BrandLogo />

          <nav className="hidden flex-1 items-center gap-0.5 lg:flex">
            {navItems.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'whitespace-nowrap rounded-[9px] px-3 py-2 text-[16.5px] font-bold transition',
                    active
                      ? 'bg-brand text-white'
                      : 'text-ink-soft hover:bg-brand-tint hover:text-brand',
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="ms-auto flex items-center gap-2 lg:ms-0">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden w-[190px] cursor-pointer items-center gap-2 rounded-full border border-border bg-secondary px-3.5 py-2 text-[15.5px] text-muted-foreground transition hover:border-brand lg:flex"
            >
              <IconSearch className="size-4 shrink-0" />
              <span>ابحث في أخبار حياة…</span>
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="بحث"
              className="grid size-10 cursor-pointer place-items-center rounded-[10px] border border-border bg-secondary text-ink-soft lg:hidden"
            >
              <IconSearch className="size-[18px]" />
            </button>
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="القائمة"
              className="grid size-10 cursor-pointer place-items-center rounded-[10px] border border-border bg-secondary text-ink-soft lg:hidden"
            >
              <IconMenu className="size-[18px]" />
            </button>
          </div>
        </div>
      </header>

      {/* ===== قائمة الموبايل ===== */}
      <div
        className={cn('ah-drawer-layer fixed inset-0 z-[90]', menuOpen ? 'visible' : 'invisible')}
      >
        <div
          onClick={() => setMenuOpen(false)}
          className={cn(
            'absolute inset-0 bg-[rgba(4,10,7,.5)] transition-opacity duration-300',
            menuOpen ? 'opacity-100' : 'opacity-0',
          )}
        />
        <div
          className={cn(
            'ah-drawer flex w-[min(320px,86vw)] flex-col overflow-y-auto bg-card p-[18px] shadow-[-12px_0_40px_rgba(0,0,0,.25)]',
            menuOpen && 'is-open',
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <BrandLogo height={38} />
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="إغلاق"
              className="grid size-[38px] cursor-pointer place-items-center rounded-[10px] border border-border bg-secondary text-ink-soft"
            >
              <IconClose className="size-[18px]" />
            </button>
          </div>

          <button
            onClick={() => {
              setMenuOpen(false)
              setSearchOpen(true)
            }}
            className="mb-3.5 flex cursor-pointer items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2.5 text-[15.5px] text-muted-foreground"
          >
            <IconSearch className="size-4" />
            ابحث في أخبار حياة…
          </button>

          <nav className="flex flex-col">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between rounded-[10px] px-3 py-3 text-base font-bold transition',
                  pathname === item.href
                    ? 'bg-brand text-white'
                    : 'text-foreground hover:bg-brand-tint hover:text-brand',
                )}
              >
                {item.label}
                <IconArrow className="size-[15px] opacity-60" />
              </Link>
            ))}
          </nav>

          <div className="mt-auto flex gap-2 pt-4">
            {[IconFacebook, IconX, IconYoutube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="grid size-[38px] place-items-center rounded-[10px] border border-border bg-secondary text-ink-soft"
              >
                <Icon className="size-[17px]" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ===== نافذة البحث ===== */}
      <div className={cn('fixed inset-0 z-[95]', searchOpen ? 'visible' : 'invisible')}>
        <div
          onClick={() => setSearchOpen(false)}
          className={cn(
            'absolute inset-0 bg-[rgba(4,10,7,.55)] transition-opacity duration-300',
            searchOpen ? 'opacity-100' : 'opacity-0',
          )}
        />
        <div
          className={cn(
            'absolute inset-x-0 top-0 bg-card px-5 pb-8 pt-7 shadow-[0_12px_40px_rgba(0,0,0,.25)] transition-transform duration-300 ease-out',
            searchOpen ? 'translate-y-0' : '-translate-y-full',
          )}
        >
          <div className="mx-auto max-w-[760px]">
            <div className="flex items-center gap-3">
              <form
                onSubmit={submitSearch}
                className="flex flex-1 items-center gap-2.5 rounded-full border-2 border-brand bg-secondary px-5 py-3"
              >
                <IconSearch className="size-5 text-brand" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ابحث عن خبر، موضوع، أو كلمة…"
                  className="flex-1 border-none bg-transparent text-[18px] text-foreground outline-none"
                />
              </form>
              <button
                onClick={() => setSearchOpen(false)}
                aria-label="إغلاق"
                className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl border border-border bg-secondary text-ink-soft"
              >
                <IconClose className="size-5" />
              </button>
            </div>

            <div className="mt-5">
              <div className="mb-3 text-[13.5px] font-extrabold tracking-wide text-muted-foreground">
                الأكثر بحثاً
              </div>
              <div className="flex flex-wrap gap-2.5">
                {POPULAR.map((p) => (
                  <Link
                    key={p}
                    href={`/search?q=${encodeURIComponent(p)}`}
                    className="rounded-full border border-border bg-secondary px-4 py-2 text-[14.5px] font-bold text-ink-soft transition hover:border-brand hover:text-brand"
                  >
                    {p}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
