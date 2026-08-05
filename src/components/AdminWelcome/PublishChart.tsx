'use client'

import React from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export type DayPoint = { label: string; count: number }

/**
 * أعمدة النشر اليومي — بلغة shadcn البصرية:
 * شبكة باهتة، محاور بلا خطوط، أعمدة بزوايا ناعمة بأخضر الهوية.
 * المخطط زمنيّ فيُرسم داخل حاوية LTR كي يتقدّم الزمن يساراً→يميناً.
 */
export const PublishChart: React.FC<{ data: DayPoint[] }> = ({ data }) => (
  <div dir="ltr" style={{ width: '100%', height: 240 }}>
    <ResponsiveContainer>
      <BarChart data={data} margin={{ top: 6, right: 4, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--theme-elevation-100)" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'var(--theme-elevation-450)', fontSize: 11.5 }}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          tick={{ fill: 'var(--theme-elevation-450)', fontSize: 11.5 }}
        />
        <Tooltip
          cursor={{ fill: 'var(--theme-elevation-100)' }}
          contentStyle={{
            background: 'var(--theme-elevation-0)',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 10,
            fontFamily: 'inherit',
            fontSize: 13,
          }}
          formatter={(v) => [`${v} خبراً`, 'نُشر']}
        />
        <Bar dataKey="count" fill="var(--ah-brand, #026938)" radius={[6, 6, 0, 0]} maxBarSize={26} />
      </BarChart>
    </ResponsiveContainer>
  </div>
)
