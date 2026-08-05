import type { Metadata } from 'next'

import type { Media, Page, Post, Config } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'

/** صورة المشاركة الافتراضية — هوية الموقع */
export const DEFAULT_OG = '/og-default.jpg'

/**
 * صورة المشاركة.
 *
 * الأرشيف المرحّل كلّه بلا «صورة ميتا» — الحقل فارغ في ١٤٥ ألف خبر بينما
 * ١٤٥٬٠٥٢ منها له صورة رئيسية. الاعتماد على حقل الميتا وحده كان يعني أن
 * كل خبر يُشارَك بصورة الموقع العامة بدل صورته. نأخذ أوّل متاح، ونقع على
 * صورة الهوية حين لا توجد صورة إطلاقاً (الرئيسية والأقسام والوسوم).
 */
const getImageURL = (...candidates: (Media | Config['db']['defaultIDType'] | null | undefined)[]) => {
  const serverUrl = getServerSideURL()

  for (const image of candidates) {
    if (image && typeof image === 'object' && 'url' in image) {
      // مقاس og مقصوص ١٢٠٠×٦٣٠ — النسبة التي تتوقّعها منصّات التواصل
      const ogUrl = image.sizes?.og?.url
      if (ogUrl || image.url) return serverUrl + (ogUrl || image.url)
    }
  }

  return serverUrl + DEFAULT_OG
}

export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | null
}): Promise<Metadata> => {
  const { doc } = args

  const ogImage = getImageURL(
    doc?.meta?.image,
    (doc as Partial<Post>)?.heroImage,
  )

  const title = doc?.meta?.title
    ? doc?.meta?.title + ' | أخبار حياة'
    : 'أخبار حياة | مصداقية الخبر'

  return {
    description: doc?.meta?.description,
    openGraph: mergeOpenGraph({
      description: doc?.meta?.description || '',
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title,
      url: Array.isArray(doc?.slug) ? doc?.slug.join('/') : '/',
    }),
    title,
  }
}
