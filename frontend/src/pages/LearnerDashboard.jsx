import React, { useEffect, useState } from 'react'
import { apiRequest } from '../services/api'
import { Link } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../context/AuthContext'

const thumbStyles = [
  'linear-gradient(135deg,#071d3b 0%,#123f67 45%,#08152c 100%)',
  'linear-gradient(135deg,#07113b 0%,#1a286b 48%,#050b24 100%)',
  'linear-gradient(135deg,#042611 0%,#0b5b2c 45%,#01150a 100%)',
]

export default function LearnerDashboard() {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const { user } = useAuth()

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true)
        setError('')

        const data = await apiRequest('/api/dashboard')

        console.log('DASHBOARD DATA:', data)

        setDashboardData(data)
      } catch (err) {
        console.error('Dashboard error:', err)

        setError(
          err.message ||
          'Unable to load dashboard'
        )
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  // ==============================
  // LOADING
  // ==============================

  if (loading) {
    return (
      <DashboardLayout role="learner">
        <div
          className="card"
          style={{
            padding: 30,
            textAlign: 'center'
          }}
        >
          Loading your dashboard...
        </div>
      </DashboardLayout>
    )
  }

  // ==============================
  // ERROR
  // ==============================

  if (error) {
    return (
      <DashboardLayout role="learner">
        <div
          className="card"
          style={{
            padding: 30
          }}
        >
          <h2>
            Unable to load dashboard
          </h2>

          <p>
            {error}
          </p>

          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </DashboardLayout>
    )
  }

  // ==============================
  // USER INFORMATION
  // ==============================

  const dashboardUser =
    dashboardData?.user || user

  const firstName =
    dashboardUser?.name?.split(' ')[0] ||
    'Learner'

  // ==============================
  // DASHBOARD DATA
  // ==============================

  const courses =
    dashboardData?.courses || []

  const upcoming =
    dashboardData?.upcoming || []

  const stats =
    dashboardData?.stats || {}

  // ==============================
  // PAGE
  // ==============================

  return (
    <DashboardLayout role="learner">

      {/* ==========================
          HEADER
      ========================== */}

      <div className="learner-dashboard-head">

        <div>

          <h1>
            Dashboard
          </h1>

          <p>
            Welcome back, {firstName}!
            Continue your learning journey.
          </p>

        </div>

      </div>

      {/* ==========================
          STATS
      ========================== */}

      <div
        className="learner-stats"
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(4, 1fr)',
          gap: 14,
          marginBottom: 24
        }}
      >

        {/* COURSES ENROLLED */}

        <div
          className="card"
          style={{ padding: 16 }}
        >

          <div
            style={{
              fontSize: 13,
              color: 'var(--text-600)'
            }}
          >
            Courses Enrolled
          </div>

          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              marginTop: 6
            }}
          >
            {stats.coursesEnrolled ?? courses.length}
          </div>

        </div>

        {/* LEARNING TIME */}

        <div
          className="card"
          style={{ padding: 16 }}
        >

          <div
            style={{
              fontSize: 13,
              color: 'var(--text-600)'
            }}
          >
            Learning Time
          </div>

          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              marginTop: 6
            }}
          >
            {stats.learningTime?.formatted || '0h 0m'}
          </div>

        </div>

        {/* CERTIFICATES */}

        <div
          className="card"
          style={{ padding: 16 }}
        >

          <div
            style={{
              fontSize: 13,
              color: 'var(--text-600)'
            }}
          >
            Certificates
          </div>

          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              marginTop: 6
            }}
          >
            {stats.certificates ?? 0}
          </div>

        </div>

        {/* LEARNING STREAK */}

        <div
          className="card"
          style={{ padding: 16 }}
        >

          <div
            style={{
              fontSize: 13,
              color: 'var(--text-600)'
            }}
          >
            Learning Streak
          </div>

          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              marginTop: 6
            }}
          >
            {stats.streak ?? 0} days
          </div>

        </div>

      </div>

      {/* ==========================
          MAIN CONTENT
      ========================== */}

      <div className="learner-content-grid">

        {/* ========================
            COURSES
        ======================== */}

        <section>

          <div className="learner-section-head">

            <h2>
              Enrolled Courses
            </h2>

            <Link to="/learner/my-learning">
              View All ({courses.length})
            </Link>

          </div>

          <div className="learner-course-grid">

            {courses.length === 0 ? (

              <div
                className="card"
                style={{
                  padding: 20
                }}
              >

                <p>
                  You are not enrolled in any
                  courses yet.
                </p>

                <Link
                  to="/learner/my-learning"
                  className="btn btn-primary"
                >
                  Explore Learning
                </Link>

              </div>

            ) : (

              courses.map((course, index) => (

                <CourseCard
                  key={course.id}
                  course={course}
                  index={index}
                />

              ))

            )}

          </div>

        </section>

        {/* ========================
            RIGHT COLUMN
        ======================== */}

        <aside className="learner-right-column">

          {/* ======================
              UPCOMING
          ====================== */}

          <section className="learner-panel">

            <div className="learner-panel-title">
              📅 Upcoming Sessions &amp; Tests
            </div>

            {upcoming.length === 0 ? (

              <div
                style={{
                  padding: 16,
                  fontSize: 13,
                  color: 'var(--text-500)'
                }}
              >
                No upcoming sessions or tests.
              </div>

            ) : (

              upcoming.map((session) => (

                <Link
                  key={session.title}
                  className="upcoming-item"
                  to={
                    session.type === 'test'
                      ? '/learner/assessments'
                      : '/learner/calendar'
                  }
                >

                  <span className="upcoming-icon">
                    ▰
                  </span>

                  <span>

                    <strong>
                      {session.title}
                    </strong>

                    <small>
                      {session.time}
                    </small>

                  </span>

                  <span className="upcoming-arrow">
                    ›
                  </span>

                </Link>

              ))

            )}

          </section>

          {/* ======================
              LEADERBOARD
          ====================== */}

          <section
            className="learner-panel leaderboard-panel"
          >

            <div
              className="learner-panel-title leaderboard-title"
            >

              🏆 Top Learners Leaderboard

              <span>
                THIS WEEK
              </span>

            </div>

            <div
              style={{
                padding: 18,
                fontSize: 13,
                color: 'var(--text-500)'
              }}
            >

              Leaderboard data will be
              connected to the backend later.

            </div>

          </section>

        </aside>

      </div>

    </DashboardLayout>
  )
}


/* ==================================
   COURSE THUMBNAIL
================================== */

function CodeThumbnail({ index, level }) {

  const lines = [
    'const app = express();',
    'app.use(cors());',
    'function fetchData() {',
    '  return await api.get();',
    '}',
    'export default app;',
  ]

  return (

    <div
      className="learner-course-thumb"
      style={{
        background:
          thumbStyles[
            index % thumbStyles.length
          ]
      }}
    >

      <div className="code-lines">

        {lines.map((line, i) => (

          <span
            key={i}
            style={{
              width:
                `${35 + ((i * 11) % 55)}%`
            }}
          >
            {line}
          </span>

        ))}

      </div>

      <span className="learner-level-pill">
        {level}
      </span>

    </div>
  )
}


/* ==================================
   COURSE CARD
================================== */

function CourseCard({ course, index }) {

  return (

    <article className="learner-course-card">

      <Link
        to={`/learner/course/${course.id}`}
        aria-label={`Open ${course.title}`}
      >

        <CodeThumbnail
          index={index}
          level={course.level}
        />

      </Link>

      <div className="learner-course-body">

        <Link
          to={`/learner/course/${course.id}`}
          className="learner-course-title"
        >
          {course.title}
        </Link>

        <div className="learner-course-instructor">

          Instructor: {course.instructor}

        </div>

        <div className="learner-progress-label">

          <span>
            Progress
          </span>

          <strong>
            {course.progress || 0}%
          </strong>

        </div>

        <div className="learner-progress-track">

          <div
            style={{
              width:
                `${course.progress || 0}%`
            }}
          />

        </div>

        <div className="learner-course-foot">

          <span>
            {course.lessons}
          </span>

          <Link
            to={`/learner/course/${course.id}`}
          >
            Continue →
          </Link>

        </div>

      </div>

    </article>
  )
}