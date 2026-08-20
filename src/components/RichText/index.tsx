import Image from 'next/image'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedLinkNode,
  type DefaultTypedEditorState,
} from '@payloadcms/richtext-lexical'
import {
  JSXConvertersFunction,
  LinkJSXConverter,
  RichText as ConvertRichText,
} from '@payloadcms/richtext-lexical/react'

import { CodeBlock, CodeBlockProps } from '@/blocks/Code/Component'

import type {
  BannerBlock as BannerBlockProps,
  Media,
  MediaBlock as MediaBlockProps,
} from '@/payload-types'

/** كتلة ألبوم الصور — يعرّفها المولّد لاحقاً، ونصفها هنا كي يعرفها المحوّل */
type PhotoGalleryProps = {
  images?: (Media | number)[] | null
  layout?: ('grid' | 'carousel') | null
  caption?: string | null
  blockType: 'photoGallery'
}
import { BannerBlock } from '@/blocks/Banner/Component'
import { cn } from '@/utilities/ui'
import { PhotoGalleryBlock } from '@/blocks/PhotoGallery/Component'
import { VideoEmbed, parseVideoUrl } from '@/components/News/VideoEmbed'
import { postHref } from '@/utilities/postUrl'

type NodeTypes =
  | DefaultNodeTypes
  | SerializedBlockNode<
      MediaBlockProps | BannerBlockProps | CodeBlockProps | PhotoGalleryProps
    >

const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }) => {
  const { value, relationTo } = linkNode.fields.doc!
  if (typeof value !== 'object') {
    throw new Error('Expected value to be an object')
  }
  const slug = value.slug
  return relationTo === 'posts'
    ? postHref(value as Parameters<typeof postHref>[0])
    : `/${slug}`
}

const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref }),
  /**
   * الفقرة التي لا تحوي إلا رابط فيديو تصير مشغّلاً.
   * المحرّرون يلصقون الرابط ويتوقّعونه يتحوّل وحده كما في ووردبريس؛
   * تركه نصاً أزرق يعني خبر فيديو بلا فيديو.
   */
  paragraph: ({ node, nodesToJSX }) => {
    const kids = (node.children ?? []) as { type?: string; text?: string; fields?: { url?: string } }[]
    const solo = kids.filter((c) => !(c.type === 'text' && !c.text?.trim()))
    if (solo.length === 1) {
      const only = solo[0]
      const url = only.type === 'link' || only.type === 'autolink'
        ? only.fields?.url
        : only.type === 'text'
          ? only.text?.trim()
          : undefined
      if (parseVideoUrl(url)) return <VideoEmbed url={url} />
    }
    return <p>{nodesToJSX({ nodes: node.children })}</p>
  },
  /**
   * صورة داخل المتن.
   * المحوّل الافتراضي يخرج <img> عارية بلا مقاس، فتقفز الصفحة عند تحميلها
   * وتخرج عن عرض العمود. نضبط الأبعاد ونعرض التعليق أسفلها.
   */
  upload: ({ node }) => {
    const value = node.value as Media | number | string | null | undefined
    if (!value || typeof value !== 'object' || !value.url) return null
    const caption = (node.fields as { caption?: string } | null)?.caption
    return (
      <figure className="my-6">
        <Image
          src={value.url}
          alt={value.alt || caption || ''}
          width={value.width ?? 1200}
          height={value.height ?? 800}
          sizes="(max-width: 768px) 100vw, 760px"
          className="h-auto w-full rounded-[12px]"
        />
        {caption && (
          <figcaption className="mt-2 text-center text-[14.5px] leading-relaxed text-muted-foreground">
            {caption}
          </figcaption>
        )}
      </figure>
    )
  },
  blocks: {
    banner: ({ node }) => <BannerBlock className="col-start-2 mb-4" {...node.fields} />,
    photoGallery: ({ node }) => <PhotoGalleryBlock {...node.fields} />,
    mediaBlock: ({ node }) => (
      <MediaBlock
        className="col-start-1 col-span-3"
        imgClassName="m-0"
        {...node.fields}
        captionClassName="mx-auto max-w-[48rem]"
        enableGutter={false}
        disableInnerContainer={true}
      />
    ),
    code: ({ node }) => <CodeBlock className="col-start-2" {...node.fields} />,
  },
})

type Props = {
  data: DefaultTypedEditorState
  enableGutter?: boolean
  enableProse?: boolean
} & React.HTMLAttributes<HTMLDivElement>

export default function RichText(props: Props) {
  const { className, enableProse = true, enableGutter = true, ...rest } = props
  return (
    <ConvertRichText
      converters={jsxConverters}
      className={cn(
        'payload-richtext',
        {
          container: enableGutter,
          'max-w-none': !enableGutter,
          'mx-auto prose md:prose-md dark:prose-invert': enableProse,
        },
        className,
      )}
      {...rest}
    />
  )
}
