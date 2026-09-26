import React, { useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../context/AuthContext'

export default function AccountSettings({ role }) {
  const [tab, setTab] = useState('info')
  const { user } = useAuth()

  return (
    <DashboardLayout role={role}>
      <div className="card" style={{ padding: 26 }}>
        <h2 style={{ marginTop: 0, marginBottom: 4 }}>Account Settings</h2>
        <p className="subtitle" style={{ marginBottom: 20 }}>Manage profile preferences, password security, and notification triggers.</p>

        <div className="tabs">
          <span className={'tab' + (tab === 'info' ? ' active' : '')} onClick={() => setTab('info')}>Account Info</span>
          <span className={'tab' + (tab === 'security' ? ' active' : '')} onClick={() => setTab('security')}>Security &amp; Password</span>
          <span className={'tab' + (tab === 'notifications' ? ' active' : '')} onClick={() => setTab('notifications')}>Notifications</span>
        </div>

        {tab === 'info' && <AccountInfo user={user} />}
        {tab === 'security' && <SecurityPassword />}
        {tab === 'notifications' && <NotificationPrefs />}
      </div>
    </DashboardLayout>
  )
}

function AccountInfo({ user }) {
  return (
    <div>
      <div className="form-grid">
        <div className="field">
          <label>Full Name</label>
          <input defaultValue={user?.name} />
        </div>
        <div className="field">
          <label>Email Address</label>
          <input defaultValue={user?.email} />
        </div>
        <div className="field">
          <label>Mobile Number</label>
          <input defaultValue="+91 99999 00000" />
        </div>
        <div className="field">
          <label>Registration Cohort / Batch Code</label>
          <input defaultValue="MERN-SEP-2026" disabled />
        </div>
      </div>
      <button className="btn btn-primary">Save Changes</button>
    </div>
  )
}

function SecurityPassword() {
  return (
    <div style={{ maxWidth: 420 }}>
      <div className="section-title" style={{ fontSize: 14 }}>Change Password</div>
      <div className="field">
        <label>Current Password</label>
        <input type="password" placeholder="••••••••" />
      </div>
      <div className="field">
        <label>New Password</label>
        <input type="password" placeholder="••••••••" />
      </div>
      <div className="field">
        <label>Confirm New Password</label>
        <input type="password" placeholder="••••••••" />
      </div>
      <button className="btn btn-primary">Update Password</button>
    </div>
  )
}

function NotificationPrefs() {
  const [prefs, setPrefs] = useState({
    email: true,
    push: true,
    weekly: true,
    grade: true,
  })
  const toggle = (key) => setPrefs((p) => ({ ...p, [key]: !p[key] }))

  const rows = [
    { key: 'email', label: 'Email alerts when new assignments are assigned' },
    { key: 'push', label: 'Push notification 1 hour before Live Workshop sessions' },
    { key: 'weekly', label: 'Weekly summary report of learning hours & streak progress' },
    { key: 'grade', label: 'Instant alert when assignment grade/feedback is submitted by trainer' },
  ]

  return (
    <div>
      <div className="section-title" style={{ fontSize: 14 }}>Notification Preferences</div>
      {rows.map((r) => (
        <div className="toggle-row" key={r.key}>
          <span>{r.label}</span>
          <label className="switch">
            <input type="checkbox" checked={prefs[r.key]} onChange={() => toggle(r.key)} />
            <span className="track" />
          </label>
        </div>
      ))}
    </div>
  )
}
