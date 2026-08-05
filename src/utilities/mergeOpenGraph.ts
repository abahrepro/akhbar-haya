import type { Metadata } from 'next'
import { getServerSideURL } from './getURL'
import { DEFAULT_OG } from './generateMeta'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description: 'الموقع الإخباري لمجموعة حياة الإعلامية — أخبار محلية وعالمية على مدار الساعة.',
  images: [
    {
      url: `${getServerSideURL()}${DEFAULT_OG}`,
    },
  ],
  siteName: 'أخبار حياة',
  title: 'أخبار حياة | مصداقية الخبر',
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
