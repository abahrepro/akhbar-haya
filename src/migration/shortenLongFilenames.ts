/**
 * تقصير أسماء ملفات الوسائط الطويلة.
 *
 * لينكس يحدّ اسم الملف الواحد بـ٢٥٥ بايت، والحرف العربي بايتان — فعنوان
 * من ١٣٥ حرفاً يتجاوز الحد. macOS يعدّ بالأحرف لا البايتات، فقبِلها محلياً
 * ورفضها الخادم: ٣٧ ملفاً تعذّرت كتابته أصلاً.
 *
 * يعيد التسمية على القرص وفي قاعدة البيانات معاً، ويُخرج ملف SQL
 * لتطبيق التعديل نفسه على الخادم.
 *
 * الاستخدام:
 *   pnpm exec tsx --env-file=.env src/migration/shortenLongFilenames.ts [--apply]
 */

import fs from 'fs'
import path from 'path'
import { Client } from 'pg'

const MEDIA_DIR = path.resolve(process.cwd(), 'public/media')
const SQL_OUT = '/tmp/shorten-filenames.sql'

/** أقصى طول للجذع بالبايتات — يترك مساحة للاحقة المقاس والامتداد */
const MAX_STEM_BYTES = 150
/** نعالج كل سجل قد تتجاوز إحدى نسخه الحد */
const TRIGGER_BYTES = 180

const bytes = (s: string) => Buffer.byteLength(s, 'utf8')

/** يقصّ النص إلى حدّ بايتات دون كسر حرف في منتصفه */
const truncateBytes = (s: string, max: number): string => {
  if (bytes(s) <= max) return s
  let out = ''
  for (const ch of s) {
    if (bytes(out + ch) > max) break
    out += ch
  }
  return out.replace(/[-_.]+$/, '')
}

const splitExt = (name: string): [string, string] => {
  const i = name.lastIndexOf('.')
  return i < 1 ? [name, ''] : [name.slice(0, i), name.slice(i)]
}

type Row = {
  id: number
  filename: string | null
  sizes_thumbnail_filename: string | null
  sizes_small_filename: string | null
  sizes_medium_filename: string | null
  sizes_og_filename: string | null
}

const SIZE_COLS = [
  'sizes_thumbnail_filename',
  'sizes_small_filename',
  'sizes_medium_filename',
  'sizes_og_filename',
] as const

const run = async () => {
  const apply = process.argv.includes('--apply')
  const db = new Client({ connectionString: process.env.DATABASE_URL })
  await db.connect()

  const { rows } = await db.query<Row>(
    `select id, filename, ${SIZE_COLS.join(', ')}
       from media
      where octet_length(filename) > $1
      order by id`,
    [TRIGGER_BYTES],
  )

  console.log(`سجلات تحتاج تقصيراً: ${rows.length}`)
  if (!apply) console.log('(تجربة فقط — أضف --apply للتنفيذ)\n')

  const sql: string[] = []
  let renamed = 0
  let missing = 0
  const taken = new Set<string>()

  for (const r of rows) {
    if (!r.filename) continue
    const [stem, ext] = splitExt(r.filename)

    // الجذع الجديد ينتهي بالمعرّف لضمان التفرّد بعد القصّ
    let newStem = `${truncateBytes(stem, MAX_STEM_BYTES)}-${r.id}`
    while (taken.has(newStem)) newStem += 'x'
    taken.add(newStem)

    const sets: string[] = []

    /** يعيد تسمية ملف واحد ويسجّل التعديل */
    const move = (oldName: string, newName: string, col: string) => {
      const from = path.join(MEDIA_DIR, oldName)
      const to = path.join(MEDIA_DIR, newName)
      if (fs.existsSync(from)) {
        if (apply) fs.renameSync(from, to)
        renamed++
      } else {
        // الملف غير موجود محلياً — نصحّح قاعدة البيانات على أي حال
        missing++
      }
      sets.push(`${col} = ${quote(newName)}`)
    }

    move(r.filename, `${newStem}${ext}`, 'filename')

    for (const col of SIZE_COLS) {
      const cur = r[col]
      if (!cur) continue
      // اللاحقة هي ما بعد الجذع الأصلي، مثل «-300x169.webp»
      const suffix = cur.startsWith(stem) ? cur.slice(stem.length) : `-${col}${ext}`
      move(cur, `${newStem}${suffix}`, col)
    }

    sql.push(`update media set ${sets.join(', ')} where id = ${r.id};`)
  }

  fs.writeFileSync(SQL_OUT, sql.join('\n') + '\n')

  if (apply) {
    await db.query('begin')
    for (const s of sql) await db.query(s)
    await db.query('commit')
  }

  console.log(`ملفات أُعيد تسميتها: ${renamed}`)
  console.log(`ملفات غير موجودة على القرص: ${missing}`)
  console.log(`أوامر SQL: ${sql.length} → ${SQL_OUT}`)
  await db.end()
}

const quote = (s: string) => `'${s.replace(/'/g, "''")}'`

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('خطأ:', e)
    process.exit(1)
  })
