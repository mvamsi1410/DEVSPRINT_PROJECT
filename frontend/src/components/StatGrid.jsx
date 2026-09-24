import React from 'react'
import { Link } from 'react-router-dom'

export default function StatGrid({ stats }) {
  return (
    <div className="stat-grid" style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
      {stats.map((s, i) => {
        const content = (
          <div className="stat-card" key={i} style={s.to ? { cursor: 'pointer' } : undefined}>
          <div className="stat-top">
            <div className="stat-icon" style={{ background: s.color || '#eef1f8' }}>{s.icon}</div>
            {s.badge && <span className="stat-badge" style={s.urgent ? { background: '#fdeaea', color: '#dc2626' } : undefined}>{s.badge}</span>}
          </div>
          <div className="stat-value">{s.value}</div>
          <div className="stat-label">{s.label}</div>
          {s.sub && <div className="stat-label" style={{ color: '#16a34a' }}>{s.sub}</div>}
          </div>
        )
        return s.to ? <Link key={i} to={s.to} style={{ textDecoration: 'none', color: 'inherit' }}>{content}</Link> : content
      })}
    </div>
  )
}
