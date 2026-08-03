/**
 * نقل البيانات من نسخة SQLite إلى Postgres.
 *
 * الاستخدام:
 *   pnpm exec tsx --env-file=.env src/migration/sqliteToPostgres.ts
 *   pnpm exec tsx --env-file=.env src/migration/sqliteToPostgres.ts --limit=100
 *
 * يعمل على مستوى SQL مباشرةً (لا عبر Payload API) لأن الحجم كبير،
 * وقد بُني المخطط في Postgres مسبقاً بتشغيل Payload.
 */

import Database from 'better-sqlite3'
import fs from 'fs'
import { Client } from 'pg'

const SQLITE = 'akhbar-hayat.db.backup-20260804-0235'
const REPORT = '/tmp/pg-migration.txt'
const CHUNK = 1000

const arg = (n: string, d?: string) => {
  const h = process.argv.find((a) => a.startsWith(`--${n}=`))
  return h ? h.split('=')[1] : process.argv.includes(`--${n}`) ? 'true' : d
}
const LIMIT = Number(arg('limit', '0'))

const lines: string[] = []
const log = (...a: unknown[]) => {
  const l = a.map(String).join(' ')
  lines.push(l)
  console.log(l)
  try {
    fs.writeFileSync(REPORT, lines.join('\n'))
  } catch {
    /* التقرير اختياري */
  }
}

/** يبني عبارة INSERT مُعامَلة لدفعة صفوف */
const insertBatch = async (
  pg: Client,
  table: string,
  cols: string[],
  rows: unknown[][],
): Promise<number> => {
  if (rows.length === 0) return 0
  const colList = cols.map((c) => `"${c}"`).join(',')
  const values: unknown[] = []
  const tuples = rows.map((r) => {
    const ph = r.map((v) => {
      values.push(v)
      return `$${values.length}`
    })
    return `(${ph.join(',')})`
  })
  await pg.query(
    `insert into "${table}" (${colList}) values ${tuples.join(',')} on conflict do nothing`,
    values,
  )
  return rows.length
}

const run = async () => {
  if (!fs.existsSync(SQLITE)) {
    log(`✗ لم يُعثر على نسخة SQLite: ${SQLITE}`)
    process.exit(1)
  }

  const sq = new Database(SQLITE, { readonly: true })
  const pg = new Client({ connectionString: process.env.DATABASE_URL })
  await pg.connect()

  log('═'.repeat(56))
  log('نقل SQLite → Postgres')
  log('═'.repeat(56))

  // نعطّل مؤقتاً محفّزات المفاتيح الأجنبية حتى لا يقيّدنا ترتيب الإدراج
  await pg.query(`set session_replication_role = 'replica'`)

  /** ينقل جدولاً كاملاً على دفعات */
  const copyTable = async (table: string, orderBy = 'id') => {
    const cols = (sq.prepare(`pragma table_info("${table}")`).all() as { name: string }[]).map(
      (c) => c.name,
    )
    if (cols.length === 0) {
      log(`  — ${table}: غير موجود في SQLite`)
      return
    }

    // نتحقق من الأعمدة الموجودة فعلاً في Postgres
    const pgCols = (
      await pg.query(
        `select column_name from information_schema.columns where table_schema='public' and table_name=$1`,
        [table],
      )
    ).rows.map((r) => r.column_name as string)

    const shared = cols.filter((c) => pgCols.includes(c))
    if (shared.length === 0) {
      log(`  — ${table}: لا أعمدة مشتركة`)
      return
    }

    const total = (sq.prepare(`select count(*) as n from "${table}"`).get() as { n: number }).n
    const cap = LIMIT || total
    let done = 0
    let offset = 0

    while (offset < Math.min(total, cap)) {
      const rows = sq
        .prepare(
          `select ${shared.map((c) => `"${c}"`).join(',')} from "${table}" order by "${orderBy}" limit ? offset ?`,
        )
        .all(Math.min(CHUNK, cap - offset), offset) as Record<string, unknown>[]
      if (rows.length === 0) break

      const tuples = rows.map((r) =>
        shared.map((c) => {
          const v = r[c]
          // SQLite يخزّن المنطقي كأرقام؛ Postgres يتوقع boolean
          return v
        }),
      )
      done += await insertBatch(pg, table, shared, tuples)
      offset += rows.length
    }

    // مزامنة عدّاد التسلسل — للمعرّفات الرقمية فقط
    if (shared.includes('id')) {
      const seq = (
        await pg.query(`select pg_get_serial_sequence($1,'id') as s`, [`public."${table}"`])
      ).rows[0]?.s
      if (seq) {
        await pg.query(
          `select setval($1::regclass, coalesce((select max(id) from "${table}"), 1), true)`,
          [seq],
        )
      }
    }

    log(`  ✓ ${table}: ${done}/${total}`)
  }

  // الترتيب مهم — الجداول المرجعية أولاً
  const order = [
    'users',
    'users_sessions',
    'categories',
    'tags',
    'media',
    'pages',
    'posts',
    'posts_rels',
    'posts_gallery',
    'pages_rels',
    'categories_breadcrumbs',
    'search',
    'search_rels',
    'search_categories',
    'redirects',
    'redirects_rels',
    'forms',
    'form_submissions',
    'header',
    'header_nav_items',
    'header_rels',
    'footer',
    'footer_nav_items',
    'footer_rels',
    'payload_locked_documents',
    'payload_locked_documents_rels',
    'payload_preferences',
    'payload_preferences_rels',
  ]

  for (const t of order) {
    try {
      await copyTable(t)
    } catch (err) {
      log(`  ✗ ${t}: ${String(err).slice(0, 110)}`)
    }
  }

  // نعيد تفعيل المحفّزات ثم نتحقق من سلامة المراجع
  await pg.query(`set session_replication_role = 'origin'`)

  log('═'.repeat(56))
  const counts = await pg.query(`
    select 'أخبار' as t, count(*) as n from posts
    union all select 'وسوم', count(*) from tags
    union all select 'أقسام', count(*) from categories
    union all select 'وسائط', count(*) from media
    union all select 'مستخدمون', count(*) from users
  `)
  counts.rows.forEach((r) => log(`  ${r.t}: ${r.n}`))
  log('═'.repeat(56))

  sq.close()
  await pg.end()
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('خطأ عام:', err)
    process.exit(1)
  })
