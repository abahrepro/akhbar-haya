import localFont from 'next/font/local'

/**
 * خطوط thmanyah — مرخّصة للاستخدام التجاري.
 * تُقدَّم عبر next/font/local الذي يعبّئ الملفات بأسماء مجزّأة (packaged/obfuscated)
 * بما يتوافق مع بند الترخيص الخاص بالتضمين في مواقع الويب.
 */

export const thmanyahSans = localFont({
  src: [
    { path: './thmanyahsans-Light.woff2', weight: '300', style: 'normal' },
    { path: './thmanyahsans-Regular.woff2', weight: '400', style: 'normal' },
    { path: './thmanyahsans-Medium.woff2', weight: '500', style: 'normal' },
    { path: './thmanyahsans-Bold.woff2', weight: '700', style: 'normal' },
    { path: './thmanyahsans-Black.woff2', weight: '900', style: 'normal' },
  ],
  variable: '--font-thmanyah-sans',
  display: 'swap',
  fallback: ['SF Arabic', 'Geeza Pro', 'Noto Sans Arabic', 'system-ui', 'sans-serif'],
  preload: true,
})

export const thmanyahSerif = localFont({
  src: [
    { path: './thmanyahserifdisplay-Regular.woff2', weight: '400', style: 'normal' },
    { path: './thmanyahserifdisplay-Medium.woff2', weight: '500', style: 'normal' },
    { path: './thmanyahserifdisplay-Bold.woff2', weight: '700', style: 'normal' },
    { path: './thmanyahserifdisplay-Black.woff2', weight: '900', style: 'normal' },
  ],
  variable: '--font-thmanyah-serif',
  display: 'swap',
  fallback: ['SF Arabic', 'Geeza Pro', 'Georgia', 'serif'],
  preload: true,
})
