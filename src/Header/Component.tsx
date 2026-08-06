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
      limit: 50,
      depth: 0,
      select: { title: true, slug: true, parent: true },
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

  /**
   * القائمة شجرة لا قائمة مسطّحة.
   *
   * أحد عشر قسماً جنب بعضها تملأ العرض وتربك العين. القسم الذي له أب يهبط
   * تحته في قائمة منسدلة، والترتيب داخل المستوى الواحد بحقل «الترتيب».
   * الأب يبقى رابطاً لصفحته — لا يصير عنوان قائمة فحسب.
   */
  const parentId = (c: { parent?: unknown }): number | null => {
    const p = c.parent
    if (typeof p === 'number') return p
    if (p && typeof p === 'object' && 'id' in p) return Number((p as { id: number }).id)
    return null
  }

  const visible = categories.docs.filter((c) => Boolean(c.slug))
  const byId = new Map(visible.map((c) => [Number(c.id), c]))

  const navItems: NavItem[] = [
    { label: 'الرئيسية', href: '/' },
    ...visible
      // الأبناء يظهرون تحت آبائهم لا في الصفّ الأعلى
      .filter((c) => {
        const pid = parentId(c)
        return pid === null || !byId.has(pid)
      })
      .map((c) => {
        const children = visible
          .filter((k) => parentId(k) === Number(c.id))
          .map((k) => ({ label: k.title, href: `/category/${k.slug}` }))
        return {
          label: c.title,
          href: `/category/${c.slug}`,
          ...(children.length ? { children } : {}),
        }
      }),
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
