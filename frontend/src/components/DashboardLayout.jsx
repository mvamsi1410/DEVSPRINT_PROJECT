import React from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function DashboardLayout({ role, children }) {
  return (
    <div className={`app-shell ${role}-shell`}>
      <Sidebar role={role} />
      <div className="main-col">
        <Topbar />
        <div className="page">{children}</div>
      </div>
    </div>
  )
}
