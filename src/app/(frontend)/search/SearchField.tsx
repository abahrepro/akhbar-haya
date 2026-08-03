'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import { IconSearch } from '@/components/Brand/icons'

export const SearchField: React.FC<{ initial?: string }> = ({ initial = '' }) => {
  const [value, setValue] = useState(initial)
  const router = useRouter()

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const q = value.trim()
        router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
      }}
      className="mx-auto mt-4 flex max-w-[640px] items-center gap-2.5 rounded-full border-2 border-brand bg-card p-1.5 ps-5 shadow-sm"
    >
      <IconSearch className="size-5 shrink-0 text-brand" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="ابحث في أخبار حياة…"
        aria-label="البحث"
        className="min-w-0 flex-1 border-none bg-transparent text-[16.5px] text-foreground outline-none"
      />
      <button
        type="submit"
        className="shrink-0 cursor-pointer rounded-full bg-brand px-5 py-2.5 text-[15px] font-extrabold text-white transition hover:bg-brand-deep"
      >
        بحث
      </button>
    </form>
  )
}
