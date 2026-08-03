import React from 'react'
import BeforeDashboard from '@/components/BeforeDashboard'

const vars = {
  ['--ah-brand' as string]: '#026938', ['--ah-brand-deep' as string]: '#014d29',
  ['--ah-alert' as string]: '#d8352a', ['--ah-gold' as string]: '#b8863b',
  ['--ah-card' as string]: '#fff', ['--ah-surface-2' as string]: '#f8faf9',
  ['--ah-surface-3' as string]: '#f4f7f5', ['--ah-line' as string]: '#e6ecea',
  ['--ah-text' as string]: '#14201a', ['--ah-muted' as string]: '#7b8a82',
} as React.CSSProperties

export default function P() {
  return (
    <div style={{ ...vars, padding: 28, background: '#f6f8f9', minHeight: '100vh' }}>
      {/* @ts-expect-error Async Server Component */}
      <BeforeDashboard />
    </div>
  )
}
