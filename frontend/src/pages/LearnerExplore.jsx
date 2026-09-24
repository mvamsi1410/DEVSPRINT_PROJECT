import React, { useEffect, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { apiRequest } from '../services/api'

export default function LearnerExplore() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await apiRequest('/api/courses')
        setCourses(data.courses || data || [])
      } catch (err) {
        console.error(err)
        setError(err.message || 'Unable to load courses')
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [])

  return (
    <DashboardLayout role="learner">
      <div className="page-card">
        <h1>Explore Courses</h1>
        <p>Discover courses and start learning.</p>

        {loading && <p>Loading courses...</p>}

        {error && <p>{error}</p>}

        {!loading && !error && courses.length === 0 && (
          <p>No courses are available yet.</p>
        )}

        {!loading && !error && courses.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px',
              marginTop: '24px'
            }}
          >
            {courses.map((course) => (
              <div
                key={course.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '20px',
                  background: '#fff'
                }}
              >
                <h2>{course.title}</h2>

                <p>
                  <strong>Level:</strong> {course.level}
                </p>

                <p>
                  {course.description ||
                    'No description available.'}
                </p>

                <p>
                  <strong>Instructor:</strong>{' '}
                  {course.trainer || 'Not assigned'}
                </p>

                <button
                  className="btn btn-primary"
                  onClick={() =>
                    window.location.href =
                      `/learner/course/${course.id}`
                  }
                >
                  View Course
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}