import React, { useEffect, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { apiRequest } from '../services/api'

export default function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true)
        setError('')

        const data = await apiRequest('/api/admin/users')

        console.log('ADMIN USERS:', data)

        setUsers(data.users || data || [])
      } catch (err) {
        console.error('Admin dashboard error:', err)
        setError(err.message || 'Unable to load users')
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  const learners = users.filter(
    (user) => user.role === 'learner'
  )

  const trainers = users.filter(
    (user) => user.role === 'trainer'
  )

  const admins = users.filter(
    (user) => user.role === 'admin'
  )

  return (
    <DashboardLayout role="admin">

      <div className="hero-banner purple">
        <div className="hero-eyebrow">
          🛡 DEVSPRINT ADMIN PORTAL
        </div>

        <h2>
          Enterprise Admin Control Center
        </h2>

        <p>
          Manage users, roles, and platform administration.
        </p>
      </div>

      {loading ? (
        <div
          className="card"
          style={{
            padding: 30,
            textAlign: 'center',
            marginTop: 20
          }}
        >
          Loading admin dashboard...
        </div>
      ) : error ? (
        <div
          className="card"
          style={{
            padding: 30,
            marginTop: 20
          }}
        >
          <h2>Unable to load users</h2>

          <p>{error}</p>

          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 14,
              marginTop: 20,
              marginBottom: 24
            }}
          >

            <div className="card" style={{ padding: 16 }}>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-600)'
                }}
              >
                Total Users
              </div>

              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  marginTop: 6
                }}
              >
                {users.length}
              </div>
            </div>

            <div className="card" style={{ padding: 16 }}>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-600)'
                }}
              >
                Learners
              </div>

              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  marginTop: 6
                }}
              >
                {learners.length}
              </div>
            </div>

            <div className="card" style={{ padding: 16 }}>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-600)'
                }}
              >
                Trainers
              </div>

              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  marginTop: 6
                }}
              >
                {trainers.length}
              </div>
            </div>

            <div className="card" style={{ padding: 16 }}>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-600)'
                }}
              >
                Admins
              </div>

              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  marginTop: 6
                }}
              >
                {admins.length}
              </div>
            </div>

          </div>

          <div className="card" style={{ padding: 22 }}>

            <div className="section-title">
              Platform Users
            </div>

            {users.length === 0 ? (
              <p style={{ marginTop: 15 }}>
                No users found.
              </p>
            ) : (
              <div
                style={{
                  overflowX: 'auto',
                  marginTop: 15
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse'
                  }}
                >
                  <thead>
                    <tr>
                      <th style={headerStyle}>Name</th>
                      <th style={headerStyle}>Email</th>
                      <th style={headerStyle}>Role</th>
                      <th style={headerStyle}>Batch</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>

                        <td style={cellStyle}>
                          {user.name}
                        </td>

                        <td style={cellStyle}>
                          {user.email}
                        </td>

                        <td style={cellStyle}>
                          <strong>
                            {user.role}
                          </strong>
                        </td>

                        <td style={cellStyle}>
                          {user.batch || '—'}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </>
      )}

    </DashboardLayout>
  )
}

const headerStyle = {
  textAlign: 'left',
  padding: '12px 10px',
  borderBottom: '2px solid var(--border)',
  fontSize: 13
}

const cellStyle = {
  padding: '12px 10px',
  borderBottom: '1px solid var(--border)',
  fontSize: 14
}