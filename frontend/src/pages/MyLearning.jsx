import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import { apiRequest } from '../services/api'

export default function MyLearning() {
  const [tab, setTab] = useState('all')
    const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

    useEffect(() => {
    async function loadMyLearning() {
      try {
        const data = await apiRequest('/api/my-learning')

        console.log('MY LEARNING API:', data)

        setCourses(data.courses || [])
      } catch (err) {
        console.error('My Learning error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadMyLearning()
  }, [])
  const [wishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('devsprint_wishlist') || '[]') } catch { return [] }
  })

 const visibleCourses = useMemo(() => {
  if (tab === 'in progress') {
    return courses.filter((c) => c.progress > 0 && c.progress < 100)
  }

  if (tab === 'completed') {
    return courses.filter((c) => c.progress >= 100)
  }

  if (tab === 'saved / wishlist') {
    return courses.filter((c) => wishlist.includes(c.id))
  }

  return courses
}, [tab, courses, wishlist])

  return (
    <DashboardLayout role="learner">
      <div className="card" style={{ padding: 26 }}>
        <h2 style={{ marginTop: 0, marginBottom: 4 }}>My Learning</h2>
        <p className="subtitle" style={{ marginBottom: 18 }}>Manage and track your enrolled training programs.</p>

        <div className="tabs">
          {['all', 'in progress', 'completed', 'saved / wishlist'].map((t) => (
            <span key={t} className={'tab' + (tab === t ? ' active' : '')} onClick={() => setTab(t)} style={{ textTransform: 'capitalize', cursor: 'pointer' }}>
              {t === 'all' ? 'All Courses' : t}
            </span>
          ))}
        </div>

        <div className="course-grid">
          {visibleCourses.map((c) => (
            <div className="course-card" key={c.id}>
              <div className="course-thumb" style={{ background: c.gradient }}>
                <span className="level-pill">{c.level}</span>
              </div>
              <div className="course-body">
                <div style={{ fontSize: 11, color: 'var(--text-400)', marginBottom: 4 }}>★ 4.8 (1240 learners)</div>
                <div className="title">{c.title}</div>
                <div className="meta">Instructor: {c.instructor}</div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${c.progress}%` }} />
                </div>
                <div className="course-foot">
                  <span>{c.lessons}</span>
                  <Link className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 12 }} to={`/learner/course/${c.id}`}>Continue →</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
