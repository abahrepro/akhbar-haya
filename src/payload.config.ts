import { postgresAdapter } from '@payloadcms/db-postgres'
import { ar } from '@payloadcms/translations/languages/ar'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Ads } from './collections/Ads'
import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Tags } from './collections/Tags'
import { Users } from './collections/Users'
import { adClick, adView } from './endpoints/adTracking'
import { suggestTags } from './endpoints/suggestTags'
import { AdSettings } from './globals/AdSettings'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  // العربية هي لغة لوحة التحكّم الوحيدة — تفرض RTL بغضّ النظر عن لغة المتصفّح
  i18n: {
    fallbackLanguage: 'ar',
    supportedLanguages: { ar },
  },
  admin: {
    /**
     * هوية تبويب المتصفّح.
     * الافتراضي يضع «Payload» لاحقةً للعنوان وأيقونتَه في التبويب، فيظهر
     * اسم أداة لا اسم المؤسّسة أمام المحرّرين وفي سجلّ التصفّح.
     */
    meta: {
      titleSuffix: '— أخبار حياة',
      icons: [
        { rel: 'icon', type: 'image/svg+xml', url: '/favicon.svg' },
        { rel: 'icon', type: 'image/x-icon', url: '/favicon.ico' },
        { rel: 'apple-touch-icon', url: '/apple-touch-icon.png' },
      ],
    },
    components: {
      beforeDashboard: ['@/components/AdminWelcome#AdminWelcome'],
      // استبدال شعار Payload بهوية أخبار حياة
      graphics: {
        Icon: '@/components/AdminBrand#AdminIcon',
        Logo: '@/components/AdminBrand#AdminLogo',
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
      // البناء يشغّل عدة عمّال متوازين؛ مجمّع صغير لكل عامل يمنع استنفاد اتصالات الخادم
      max: Number(process.env.DB_POOL_MAX ?? 8),
      idleTimeoutMillis: 30_000,
    },
  }),
  collections: [Pages, Posts, Media, Categories, Tags, Users, Ads],
  globals: [AdSettings],
  cors: [getServerSideURL()].filter(Boolean),
  endpoints: [suggestTags, adView, adClick],
  plugins,
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        const secret = process.env.CRON_SECRET
        if (!secret) return false

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${secret}`
      },
    },
    tasks: [],
  },
})
