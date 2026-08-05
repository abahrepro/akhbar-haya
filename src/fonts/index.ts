import localFont from 'next/font/local'

/**
 * الإسكندرية (Alexandria) — خط الموقع الوحيد.
 *
 * عائلة واحدة تخدم النصوص والعناوين معاً؛ التمييز بالوزن لا بعائلة ثانية.
 * نشحن الأوزان المستعملة فعلاً في الكود فقط (٤٠٠–٩٠٠): الأوزان الرفيعة
 * الثلاثة لا يستدعيها أي مكوّن، وشحنها يكلّف ١٦٠ كيلوبايت بلا مقابل.
 *
 * الخط بترخيص SIL Open Font License، فالاستضافة وإعادة التوزيع مسموحتان
 * صراحةً — بخلاف الخط السابق الذي قيّد التضمين بصيغ مُحزَّمة.
 */
export const alexandria = localFont({
  src: [
    { path: './alexandria/Alexandria-Regular.woff2', weight: '400', style: 'normal' },
    { path: './alexandria/Alexandria-Medium.woff2', weight: '500', style: 'normal' },
    { path: './alexandria/Alexandria-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: './alexandria/Alexandria-Bold.woff2', weight: '700', style: 'normal' },
    { path: './alexandria/Alexandria-ExtraBold.woff2', weight: '800', style: 'normal' },
    { path: './alexandria/Alexandria-Black.woff2', weight: '900', style: 'normal' },
  ],
  variable: '--font-alexandria',
  display: 'swap',
  fallback: ['SF Arabic', 'Geeza Pro', 'Noto Sans Arabic', 'system-ui', 'sans-serif'],
  preload: true,
})
