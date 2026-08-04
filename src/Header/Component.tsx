import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { HeaderClient, type NavItem, type TickerItem } from './Component.client'
import { formatGregorian, formatHijri } from '@/utilities/formatArabicDate'
import { postHref } from '@/utilities/postUrl'

export async function Header() {
  const payload = await getPayload({ config: configPromise })

  const [categories, latest] = await Promise.all([
    payload.find({
      collection: 'categories',
      where: { showInNav: { equals: true } },
      sort: 'order',
      limit: 10,
      depth: 0,
      select: { title: true, slug: true },
    }),
    payload.find({
      collection: 'posts',
      where: { _status: { equals: 'published' } },
      sort: '-publishedAt',
      limit: 6,
      depth: 0,
      select: { title: true, slug: true, wpId: true },
    }),
  ])

  const navItems: NavItem[] = [
    { label: 'الرئيسية', href: '/' },
    ...categories.docs
      .filter((c) => Boolean(c.slug))
      .map((c) => ({ label: c.title, href: `/category/${c.slug}` })),
  ]

  const ticker: TickerItem[] = latest.docs
    .filter((p) => Boolean(p.title && p.slug))
    .map((p) => ({ title: p.title as string, href: postHref(p) }))

  const now = new Date()

  return (
    <HeaderClient
      navItems={navItems}
      ticker={ticker}
      gregorianDate={formatGregorian(now)}
      hijriDate={formatHijri(now)}
    />
  )
}
