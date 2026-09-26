import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import { apiRequest } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function TrainerDashboard() {
  const { user } = useAuth()

  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadCourses() {
      try {
        setLoading(true)
        setError('')

        const data = await apiRequest('/api/courses')

        console.log('TRAINER COURSES:', data)

        setCourses(data.courses || data || [])
      } catch (err) {
        console.error('Trainer dashboard error:', err)
        setError(err.message || 'Unable to load trainer dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [])

  const trainerName = user?.name || 'Instructor'

  return (
    <DashboardLayout role="trainer">

      {/* =================================================
          HERO BANNER
      ================================================= */}

      <div className="hero-banner blue">

        <div className="hero-eyebrow">
          🎓 TRAINER &amp; INSTRUCTOR PORTAL
        </div>

        <h2>
          Good morning, {trainerName} 👋
        </h2>

        <p>
          Manage your courses, review student progress, and create new learning content.
        </p>

        <Link
          to="/trainer/create-course"
          className="btn btn-primary hero-cta"
        >
          + Create New Course
        </Link>

      </div>

      {/* =================================================
          LOADING
      ================================================= */}

      {loading ? (

        <div
          className="card"
          style={{
            padding: 30,
            textAlign: 'center',
            marginTop: 20
          }}
        >
          Loading trainer dashboard...
        </div>

      ) : error ? (

        /* =================================================
           ERROR
        ================================================= */

        <div
          className="card"
          style={{
            padding: 30,
            marginTop: 20
          }}
        >

          <h2>
            Unable to load courses
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

      ) : (

        <>
          {/* =================================================
              STATISTICS
          ================================================= */}

          <div
            className="learner-stats"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 14,
              marginBottom: 24,
              marginTop: 20
            }}
          >

            {/* TOTAL COURSES */}

            <div
              className="card"
              style={{
                padding: 16
              }}
            >

              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-600)'
                }}
              >
                Total Courses
              </div>

              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  marginTop: 6
                }}
              >
                {courses.length}
              </div>

            </div>


            {/* ACTIVE COURSES */}

            <div
              className="card"
              style={{
                padding: 16
              }}
            >

              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-600)'
                }}
              >
                Active Courses
              </div>

              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  marginTop: 6
                }}
              >
                {courses.length}
              </div>

            </div>


            {/* STUDENTS */}

            <div
              className="card"
              style={{
                padding: 16
              }}
            >

              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-600)'
                }}
              >
                Students
              </div>

              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  marginTop: 6
                }}
              >
                —
              </div>

              <small
                style={{
                  color: 'var(--text-500)'
                }}
              >
                Student API will be connected later
              </small>

            </div>

          </div>


          {/* =================================================
              TWO COLUMN AREA
          ================================================= */}

          <div className="two-col">

            {/* =================================================
                MY COURSES
            ================================================= */}

            <div
              className="card"
              style={{
                padding: 22
              }}
            >

              <div className="section-title">
                My Courses
              </div>


              {/* NO COURSES */}

              {courses.length === 0 ? (

                <div
                  style={{
                    padding: '20px 0'
                  }}
                >

                  <p>
                    You haven't created any courses yet.
                  </p>

                  <Link
                    to="/trainer/create-course"
                    className="btn btn-primary"
                  >
                    Create Your First Course
                  </Link>

                </div>

              ) : (

                /* COURSES */

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    marginTop: 15
                  }}
                >

                  {courses.map((course) => (

                    <div
                      key={course.id}
                      className="card"
                      style={{
                        padding: 16,
                        border: '1px solid var(--border)'
                      }}
                    >

                      <h3
                        style={{
                          marginBottom: 6
                        }}
                      >
                        {course.title}
                      </h3>


                      <p
                        style={{
                          marginBottom: 8,
                          color: 'var(--text-600)'
                        }}
                      >
                        Instructor: {course.instructor}
                      </p>


                      <div
                        style={{
                          display: 'flex',
                          gap: 10,
                          flexWrap: 'wrap'
                        }}
                      >

                        <span>
                          Level: {course.level}
                        </span>

                        <span>
                          Lessons: {course.totalLessons || 0}
                        </span>

                      </div>


                      <div
                        style={{
                          marginTop: 12
                        }}
                      >

                        <Link
                          to={`/trainer/course/${course.id}`}
                          className="btn btn-outline"
                        >
                          View Course
                        </Link>

                      </div>

                    </div>

                  ))}

                </div>

              )}

            </div>


            {/* =================================================
                QUICK ACTIONS
            ================================================= */}

            <div
              className="card"
              style={{
                padding: 22
              }}
            >

              <div className="section-title">
                Quick Actions
              </div>


              <Link
                to="/trainer/create-course"
                className="btn btn-outline btn-full"
                style={{
                  marginBottom: 10
                }}
              >
                + Create New Course
              </Link>


              <Link
                to="/trainer/assignments"
                className="btn btn-outline btn-full"
                style={{
                  marginBottom: 10
                }}
              >
                Evaluate Submissions
              </Link>


              <Link
                to="/trainer/students"
                className="btn btn-outline btn-full"
              >
                View Student Cohort Progress
              </Link>

            </div>

          </div>

        </>

      )}

    </DashboardLayout>
  )
}