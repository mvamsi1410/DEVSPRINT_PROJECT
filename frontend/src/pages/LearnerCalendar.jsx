import React from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'

export default function LearnerCalendar() {
  return (
    <DashboardLayout role="learner">
      <div className="page-heading-row"><div><h1>Calendar</h1><p>Upcoming live classes and learning events.</p></div><Link className="btn btn-outline" to="/learner">← Dashboard</Link></div>
      <div className="card assessment-card">
        <div className="assessment-icon">▶</div>
        <div><h2>Live Node.js Session</h2><p>Friday · 6:00 PM</p><span>Node.js Backend Masterclass · Live training session</span></div>
        <button className="btn btn-primary" onClick={() => alert('The live-session link will open when the meeting URL is connected.')}>View Session</button>
      </div>
    </DashboardLayout>
  )
}
