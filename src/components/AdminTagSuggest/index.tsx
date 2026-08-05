'use client'

import { useField, useFormFields } from '@payloadcms/ui'
import React, { useCallback, useState } from 'react'

import { lexicalToPlainText } from '@/utilities/lexicalText'

type Suggestion = { id: number; title: string }

/**
 * زرّ يقترح وسوماً من نصّ الخبر.
 *
 * كتابة الوسوم يدوياً عبءٌ يتكرّر مع كل خبر، ولذلك بقي ٤٩٪ من الأرشيف بلا
 * وسم إطلاقاً. المقترحات تأتي من قاموس الوسوم القائم فقط، فالضغط عليها
 * يربط الخبر بوسم موجود ولا ينشئ نسخة ثانية منه.
 */
export const AdminTagSuggest: React.FC = () => {
  const { value: tags, setValue: setTags } = useField<(number | string)[]>({ path: 'tags' })
  const [rawTitle, rawContent] = useFormFields(([fields]) => [
    fields?.title?.value,
    fields?.content?.value,
  ])

  const [items, setItems] = useState<Suggestion[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selected = React.useMemo(() => new Set((tags ?? []).map(Number)), [tags])

  const run = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/suggest-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: typeof rawTitle === 'string' ? rawTitle : '',
          text: lexicalToPlainText(rawContent),
          exclude: tags ?? [],
        }),
      })
      if (!res.ok) throw new Error(String(res.status))
      const data = (await res.json()) as { tags: Suggestion[] }
      setItems(data.tags ?? [])
    } catch {
      setError('تعذّر جلب المقترحات. حاول مرّة أخرى.')
    } finally {
      setBusy(false)
    }
  }, [rawTitle, rawContent, tags])

  const add = (s: Suggestion) => {
    if (selected.has(s.id)) return
    setTags([...(tags ?? []), s.id])
    setItems((prev) => prev?.filter((i) => i.id !== s.id) ?? null)
  }

  const addAll = () => {
    const fresh = (items ?? []).filter((i) => !selected.has(i.id))
    if (fresh.length === 0) return
    setTags([...(tags ?? []), ...fresh.map((i) => i.id)])
    setItems([])
  }

  const hasText = Boolean(
    (typeof rawTitle === 'string' && rawTitle.trim()) || lexicalToPlainText(rawContent, 200),
  )

  return (
    <div className="ah-tagsuggest">
      <button type="button" onClick={run} disabled={busy || !hasText} className="ah-tagsuggest__btn">
        {busy ? 'جارٍ البحث…' : 'اقترح وسوماً من الخبر'}
      </button>

      {!hasText && <p className="ah-tagsuggest__hint">اكتب العنوان ونصّ الخبر أوّلاً.</p>}
      {error && <p className="ah-tagsuggest__error">{error}</p>}

      {items !== null && !busy && items.length === 0 && !error && (
        <p className="ah-tagsuggest__hint">
          لم نجد وسوماً مطابقة في القاموس — اكتب الوسم يدوياً في الخانة أعلاه.
        </p>
      )}

      {items !== null && items.length > 0 && (
        <>
          <div className="ah-tagsuggest__row">
            <span className="ah-tagsuggest__label">اضغط على الوسم لإضافته</span>
            <button type="button" onClick={addAll} className="ah-tagsuggest__all">
              إضافة الكل
            </button>
          </div>
          <ul className="ah-tagsuggest__chips">
            {items.map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => add(s)} className="ah-tagsuggest__chip">
                  <span aria-hidden="true">+</span>
                  {s.title}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="ah-tagsuggest__note">٣ إلى ٦ وسوم تكفي — واختر الأدقّ لا الأعمّ.</p>
    </div>
  )
}
