import React from 'react'

import { ACCENT, type Accent } from './IconTile'

/* ============================================================
   منحنى مساحي — بدون أي مكتبة خارجية
   ============================================================ */
export const AreaChart: React.FC<{
  data: { label: string; value: number }[]
  accent?: Accent
  height?: number
}> = ({ data, accent = 'violet', height = 190 }) => {
  if (data.length === 0) return null

  const c = ACCENT[accent]
  const W = 600
  const H = height
  const padY = 18
  const max = Math.max(...data.map((d) => d.value), 1)
  const stepX = data.length > 1 ? W / (data.length - 1) : W

  const pts = data.map((d, i) => ({
    x: i * stepX,
    y: H - padY - (d.value / max) * (H - padY * 2),
  }))

  // منحنى ناعم بمنتصفات النقاط
  const line = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    const prev = pts[i - 1]
    const cx = (prev.x + p.x) / 2
    return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`
  }, '')

  const area = `${line} L ${W} ${H} L 0 ${H} Z`
  const gid = `ah-grad-${accent}`
  const peak = pts.reduce((a, p, i) => (data[i].value > data[a].value ? i : a), 0)

  return (
    <div className="w-full" dir="ltr">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} role="img">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.fg} stopOpacity="0.28" />
            <stop offset="100%" stopColor={c.fg} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* خطوط شبكية أفقية */}
        {[0, 0.5, 1].map((t) => (
          <line
            key={t}
            x1="0"
            x2={W}
            y1={padY + t * (H - padY * 2)}
            y2={padY + t * (H - padY * 2)}
            stroke="currentColor"
            strokeOpacity="0.07"
            strokeWidth="1"
          />
        ))}

        <path d={area} fill={`url(#${gid})`} />
        <path d={line} fill="none" stroke={c.fg} strokeWidth="2.5" strokeLinecap="round" />

        {/* نقطة الذروة */}
        <circle cx={pts[peak].x} cy={pts[peak].y} r="5" fill="#fff" stroke={c.fg} strokeWidth="2.5" />
      </svg>

      <div className="mt-1 flex justify-between text-[10.5px] text-[var(--ah-muted)]" dir="rtl">
        {data.map((d, i) =>
          i % 2 === 0 || data.length <= 8 ? <span key={i}>{d.label}</span> : <span key={i} />,
        )}
      </div>
    </div>
  )
}

/* ============================================================
   حلقة نسبة مئوية
   ============================================================ */
export const RadialStat: React.FC<{
  value: number
  total: number
  accent?: Accent
  size?: number
}> = ({ value, total, accent = 'coral', size = 92 }) => {
  const c = ACCENT[accent]
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0
  const r = size / 2 - 7
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.09"
          strokeWidth="7"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={c.fg}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[15px] font-extrabold tabular-nums">
        {pct}%
      </span>
    </div>
  )
}

/* ============================================================
   أعمدة مصغّرة
   ============================================================ */
export const MiniBars: React.FC<{
  data: { label: string; value: number; accent: Accent }[]
  height?: number
}> = ({ data, height = 120 }) => {
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="flex items-end gap-2.5" style={{ height }}>
      {data.map((d) => {
        const c = ACCENT[d.accent]
        const h = Math.max(6, (d.value / max) * (height - 24))
        return (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="text-[11px] font-extrabold tabular-nums" style={{ color: c.fg }}>
              {d.value}
            </span>
            <div
              className="w-full rounded-t-md rounded-b-sm transition-all"
              style={{ height: h, background: c.fg, opacity: 0.85 }}
            />
          </div>
        )
      })}
    </div>
  )
}
