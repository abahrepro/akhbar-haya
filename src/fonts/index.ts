import localFont from 'next/font/local'

/**
 * تجوّل (Tajawal) — خط الموقع الوحيد.
 *
 * عائلة واحدة تخدم النصوص والعناوين؛ التمييز بالوزن لا بعائلة ثانية.
 * نشحن الأوزان المستعملة فعلاً فقط — الرفيعان (٢٠٠ و٣٠٠) لا يستدعيهما
 * أي مكوّن.
 *
 * لا وزن ٦٠٠ في العائلة، و‏`font-semibold` مستعمل في تسعة عشر موضعاً؛
 * مطابقة CSS تصعد للأثقل فتعرضه بوزن ٧٠٠. نصرّح بذلك هنا كي لا يبدو
 * لاحقاً خطأً في التنسيق.
 *
 * بترخيص SIL Open Font License (نسخته في هذا المجلد) — الاستضافة
 * وإعادة التوزيع مسموحتان صراحةً.
 */
export const tajawal = localFont({
  src: [
    { path: './tajawal/Tajawal-Regular.woff2', weight: '400', style: 'normal' },
    { path: './tajawal/Tajawal-Medium.woff2', weight: '500', style: 'normal' },
    { path: './tajawal/Tajawal-Bold.woff2', weight: '700', style: 'normal' },
    { path: './tajawal/Tajawal-ExtraBold.woff2', weight: '800', style: 'normal' },
    { path: './tajawal/Tajawal-Black.woff2', weight: '900', style: 'normal' },
  ],
  variable: '--font-tajawal',
  display: 'swap',
  fallback: ['SF Arabic', 'Geeza Pro', 'Noto Sans Arabic', 'system-ui', 'sans-serif'],
  preload: true,
})
