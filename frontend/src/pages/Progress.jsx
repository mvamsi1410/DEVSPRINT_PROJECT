import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import { apiRequest } from '../services/api'

export default function Progress() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProgress()
  }, [])

  async function loadProgress() {
    try {
      setLoading(true)
      setError('')

      console.log('Loading learner progress...')

      const data = await apiRequest('/api/my-learning')

      console.log('MY LEARNING API RESPONSE:', data)

      const loadedCourses = Array.isArray(data.courses)
        ? data.courses
        : []

      setCourses(loadedCourses)

    } catch (err) {
      console.error('Progress loading error:', err)

      setError(
        err.message ||
        'Unable to load your progress'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout role="learner">

      {/* PAGE HEADER */}

      <div style={{ marginBottom: 24 }}>

        <h2 style={{ marginBottom: 6 }}>
          My Progress
        </h2>

        <p
          style={{
            color: 'var(--text-600)',
            fontSize: 14
          }}
        >
          Track your learning progress across enrolled courses.
        </p>

      </div>


      {/* LOADING */}

      {loading && (

        <div
          className="card"
          style={{
            padding: 24
          }}
        >
          Loading your progress...
        </div>

      )}


      {/* ERROR */}

      {!loading && error && (

        <div
          className="card"
          style={{
            padding: 24
          }}
        >

          <h3
            style={{
              marginTop: 0
            }}
          >
            Unable to load progress
          </h3>

          <p
            style={{
              color: 'var(--text-600)'
            }}
          >
            {error}
          </p>

          <button
            type="button"
            className="btn btn-primary"
            onClick={loadProgress}
          >
            Try Again
          </button>

        </div>

      )}


      {/* NO COURSES */}

      {!loading &&
        !error &&
        courses.length === 0 && (

          <div
            className="card"
            style={{
              padding: 24
            }}
          >

            <h3
              style={{
                marginTop: 0
              }}
            >
              No enrolled courses
            </h3>

            <p
              style={{
                color: 'var(--text-600)',
                marginBottom: 16
              }}
            >
              You have not enrolled in any courses yet.
            </p>

            <Link
              to="/learner/explore"
              className="btn btn-primary"
            >
              Explore Courses
            </Link>

          </div>

        )}


      {/* COURSE PROGRESS */}

      {!loading &&
        !error &&
        courses.length > 0 && (

          <div
            style={{
              display: 'grid',
              gap: 18
            }}
          >

            {courses.map((course) => {

              const progress = Math.max(
                0,
                Math.min(
                  100,
                  Number(course.progress ?? 0)
                )
              )

              return (

                <div
                  className="card"
                  key={course.id}
                  style={{
                    padding: 22
                  }}
                >

                  {/* COURSE TOP */}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 20,
                      marginBottom: 16
                    }}
                  >

                    <div>

                      <h3
                        style={{
                          margin: 0,
                          marginBottom: 7
                        }}
                      >
                        {course.title}
                      </h3>

                      <div
                        style={{
                          fontSize: 13,
                          color: 'var(--text-600)'
                        }}
                      >
                        {course.lessons ||
                          `${course.totalLessons || 0} Lessons`}
                      </div>

                      {course.level && (

                        <div
                          style={{
                            marginTop: 5,
                            fontSize: 12,
                            color: 'var(--text-500)'
                          }}
                        >
                          Level: {course.level}
                        </div>

                      )}

                    </div>


                    {/* PERCENTAGE */}

                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: 'var(--blue-600)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {progress}%
                    </div>

                  </div>


                  {/* PROGRESS BAR */}

                  <div
                    style={{
                      width: '100%',
                      height: 12,
                      background: '#e5e7eb',
                      borderRadius: 20,
                      overflow: 'hidden'
                    }}
                  >

                    <div
                      style={{
                        width: `${progress}%`,
                        height: '100%',
                        background: 'var(--blue-600)',
                        borderRadius: 20,
                        transition: 'width 0.4s ease'
                      }}
                    />

                  </div>


                  {/* PROGRESS TEXT */}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 12
                    }}
                  >

                    <span
                      style={{
                        fontSize: 13,
                        color: 'var(--text-600)'
                      }}
                    >
                      {progress}% Complete
                    </span>


                    {progress === 100 && (

                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700
                        }}
                      >
                        ✓ Course Completed
                      </span>

                    )}

                  </div>


                  {/* COURSE BUTTON */}

                  <div
                    style={{
                      marginTop: 16
                    }}
                  >

                    <Link
                      to={`/learner/course/${course.id}`}
                      className="btn btn-outline"
                    >
                      View Course
                    </Link>

                  </div>

                </div>

              )

            })}

          </div>

        )}

    </DashboardLayout>
  )
}