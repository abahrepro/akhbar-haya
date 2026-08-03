const TZ = 'Asia/Amman'

/** التاريخ الميلادي بالعربية — مثال: الاثنين، 3 آب 2026 */
export const formatGregorian = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('ar-JO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TZ,
  }).format(d)
}

/** التاريخ الهجري — مثال: 9 صفر 1448 هـ */
export const formatHijri = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  const formatted = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TZ,
  }).format(d)
  return formatted.replace(/\s*هـ?\s*$/, '') + ' هـ'
}

/** الوقت — مثال: 11:20 */
export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('ar-JO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: TZ,
  }).format(d)
}

/**
 * وقت نسبي للأخبار — مثال: قبل 35 دقيقة / اليوم 11:20 / أمس / 3 آب 2026
 */
export const formatRelative = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  const diffMs = Date.now() - d.getTime()
  const mins = Math.floor(diffMs / 60000)

  if (mins < 1) return 'الآن'
  if (mins < 60) return `قبل ${mins} دقيقة`

  const hours = Math.floor(mins / 60)
  if (hours < 24) return hours === 1 ? 'قبل ساعة' : hours === 2 ? 'قبل ساعتين' : `قبل ${hours} ساعات`

  const days = Math.floor(hours / 24)
  if (days === 1) return 'أمس'
  if (days < 7) return `قبل ${days} أيام`

  return new Intl.DateTimeFormat('ar-JO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TZ,
  }).format(d)
}
