import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)
import { redirects } from './redirects'

const NEXT_PUBLIC_SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.__NEXT_PRIVATE_ORIGIN || 'http://localhost:3000'

const nextConfig: NextConfig = {
  // Temporarily required on Windows until Next.js fixes Turbopack Sass resolution.
  // See: https://github.com/vercel/next.js/issues/86431
  sassOptions: {
    loadPaths: ['./node_modules/@payloadcms/ui/dist/scss/'],
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
    qualities: [100],
    remotePatterns: [
      ...[NEXT_PUBLIC_SERVER_URL /* 'https://example.com' */].map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', '') as 'http' | 'https',
        }
      }),
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  reactStrictMode: true,

  /**
   * الترويسة الافتراضية تعلن «Next.js, Payload» لكل زائر — وهي أوّل ما
   * يقرؤه ماسح آليّ ليختار الثغرات المعروفة لهذه التقنيات بالذات.
   */
  poweredByHeader: false,
  redirects,
  /**
   * صفحات HTML تُراجَع مع الخادم في كل زيارة.
   *
   * الافتراضي كان `s-maxage` سنةً كاملة مع `stale-while-revalidate`،
   * فيعرض المتصفّح النسخة القديمة فوراً ويجدّد في الخلفية — القارئ يرى
   * دائماً البناء السابق لا الحالي: الخبر العاجل يتأخّر، وكل إصلاح
   * يبدو كأنه لم يصل. المراجعة رخيصة: ‏ETag موجود والردّ 304 بلا جسم.
   * أصول ‎_next/static‎ لا يمسّها هذا — أسماؤها مبصومة وتخزينها سنة سليم.
   */
  async headers() {
    /**
     * ترويسات الأمان — لم تكن على الموقع ولا واحدة.
     *
     * إطارُ موقعٍ آخر يحمل صفحتنا هو أداة تصيّد جاهزة: يضع المهاجم صفحة
     * دخولنا داخل صفحته ويلتقط ما يُكتب فيها. ومنع تخمين نوع الملف يقطع
     * حيلة رفع سكربت باسم صورة. والمُحيل الكامل يسرّب عناوين صفحاتنا
     * الداخلية إلى كل موقع نرسل إليه القارئ.
     */
    const security = [
      // يفرض التشفير سنة كاملة، فلا تُختطف أوّل زيارة على http
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      // لا نطلب هذه الأذونات، وإغلاقها يمنع أي سكربت مدسوس من طلبها
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
    ]

    return [
      { source: '/:path*', headers: security },
      {
        source: '/((?!_next/|api/).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
      // لوحة التحكّم لا تُفهرس ولا تُخزَّن في وسيط
      {
        source: '/admin/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ]
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
