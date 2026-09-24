import React from 'react'
import { useLocation } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'

export default function ComingSoon({ role }) {
  const location = useLocation()
  const label = location.pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'Page'

  return (
    <DashboardLayout role={role}>
      <div className="card" style={{ padding: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>🚧</div>
        <h2 style={{ textTransform: 'capitalize', marginBottom: 6 }}>{label}</h2>
        <p style={{ color: 'var(--text-600)', fontSize: 14 }}>This screen isn't wired up yet — hook it up to your backend once the API for it is ready.</p>
      </div>
    </DashboardLayout>
  )
}
