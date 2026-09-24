import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { notifications, enrolledCourses } from '../data/mockData'
import { useAuth } from '../context/AuthContext'

export default function Topbar() {
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [query, setQuery] = useState('')

  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const initials = (user?.name || 'U')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()

    if (!q) return []

    return enrolledCourses
      .filter((course) =>
        `${course.title} ${course.instructor} ${course.level}`
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 5)
  }, [query])


  /* =========================================================
     SEARCH
  ========================================================= */

  const handleSearch = (event) => {
    event.preventDefault()

    const first = results[0]

    if (first) {
      navigate(`/learner/course/${first.id}`)
      setQuery('')
    }
  }


  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    setProfileOpen(false)
    setOpen(false)

    logout()

    navigate('/login', {
      replace: true,
    })
  }


  /* =========================================================
     PROFILE
  ========================================================= */

  const handleProfile = () => {
    setProfileOpen(false)

    navigate(
      `/${user?.role || 'learner'}/settings`
    )
  }


  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
      <header className="topbar">

        {/* =================================================
            SEARCH
        ================================================= */}

        <div className="search-area">

          <form
            className="search-box"
            onSubmit={handleSearch}
          >

            <span>
              🔍
            </span>

            <input
              value={query}
              onChange={(e) =>
                setQuery(e.target.value)
              }
              placeholder="Search courses, lessons, assignments, trainers..."
              aria-label="Search"
            />

          </form>


          {/* SEARCH RESULTS */}

          {query.trim() && (

            <div className="search-results">

              {results.length ? (

                results.map((course) => (

                  <button
                    type="button"
                    key={course.id}
                    className="search-result"
                    onClick={() => {
                      navigate(
                        `/learner/course/${course.id}`
                      )

                      setQuery('')
                    }}
                  >

                    <strong>
                      {course.title}
                    </strong>

                    <span>
                      {course.instructor}
                    </span>

                  </button>

                ))

              ) : (

                <div className="search-empty">
                  No matching courses found
                </div>

              )}

            </div>

          )}

        </div>


        {/* =================================================
            RIGHT SIDE
        ================================================= */}

        <div className="topbar-right">

          {/* =================================================
              NOTIFICATIONS
          ================================================= */}

          <div
            className="bell"
            onClick={() => {
              setOpen((o) => !o)
              setProfileOpen(false)
            }}
            style={{
              cursor: 'pointer',
              position: 'relative',
            }}
          >

            🔔

            <span className="dot" />

          </div>


          {/* =================================================
              PROFILE
          ================================================= */}

          <div
            className="profile-wrap"
            style={{
              position: 'relative',
            }}
          >

            <button
              type="button"
              className="user-chip profile-button"
              onClick={() => {
                setProfileOpen((o) => !o)
                setOpen(false)
              }}
              aria-label="Open profile menu"
              aria-expanded={profileOpen}
            >

              <div className="avatar">
                {initials}
              </div>

              <div>

                <div className="name">
                  {user?.name || 'Guest'}
                </div>

                <div
                  className="role"
                  style={{
                    textTransform: 'capitalize',
                  }}
                >
                  {user?.role || ''}
                </div>

              </div>

              <span className="profile-arrow">
                {profileOpen ? '⌃' : '⌄'}
              </span>

            </button>


            {/* =================================================
                PROFILE DROPDOWN
            ================================================= */}

            {profileOpen && (

              <div
                className="profile-menu"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,
                  width: '260px',
                  background: '#ffffff',
                  border: '1px solid #e4e7ec',
                  borderRadius: '12px',
                  boxShadow:
                    '0 12px 30px rgba(16, 24, 40, 0.15)',
                  padding: '8px',
                  zIndex: 9999,
                }}
              >

                {/* PROFILE SUMMARY */}

                <div
                  className="profile-summary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    marginBottom: '6px',
                    borderBottom:
                      '1px solid #eef0f3',
                  }}
                >

                  <div className="avatar">
                    {initials}
                  </div>

                  <div
                    style={{
                      minWidth: 0,
                    }}
                  >

                    <strong
                      style={{
                        display: 'block',
                        color: '#172033',
                        fontSize: '14px',
                        marginBottom: '3px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {user?.name || 'Guest'}
                    </strong>

                    <span
                      style={{
                        display: 'block',
                        color: '#667085',
                        fontSize: '12px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {user?.email || ''}
                    </span>

                  </div>

                </div>


                {/* MY PROFILE */}

                <button
                  type="button"
                  onClick={handleProfile}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    border: 'none',
                    background: 'transparent',
                    borderRadius: '8px',
                    padding: '11px 12px',
                    color: '#344054',
                    fontSize: '14px',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      '#f5f7ff'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      'transparent'
                  }}
                >

                  <span>
                    👤
                  </span>

                  <span>
                    My Profile
                  </span>

                </button>


                {/* ACCOUNT SETTINGS */}

                <button
                  type="button"
                  onClick={handleProfile}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    border: 'none',
                    background: 'transparent',
                    borderRadius: '8px',
                    padding: '11px 12px',
                    color: '#344054',
                    fontSize: '14px',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      '#f5f7ff'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      'transparent'
                  }}
                >

                  <span>
                    ⚙️
                  </span>

                  <span>
                    Account Settings
                  </span>

                </button>


                {/* LOGOUT */}

                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    border: 'none',
                    borderTop:
                      '1px solid #eef0f3',
                    marginTop: '6px',
                    padding: '12px',
                    background: 'transparent',
                    borderRadius: '8px',
                    color: '#d92d20',
                    fontSize: '14px',
                    fontWeight: '600',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      '#fff5f4'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      'transparent'
                  }}
                >

                  <span>
                    🚪
                  </span>

                  <span>
                    Logout
                  </span>

                </button>

              </div>

            )}

          </div>

        </div>


        {/* =================================================
            NOTIFICATION PANEL
        ================================================= */}

        {open && (

          <div className="notif-panel">

            <div className="head">

              <span className="title">
                Notifications
              </span>

              <span className="badge">
                {notifications.length} new
              </span>

            </div>


            {notifications.map((n, i) => (

              <div
                className="notif-item"
                key={i}
              >

                <div className="t">
                  ✓ {n.title}
                </div>

                <div className="time">
                  {n.time}
                </div>

              </div>

            ))}

          </div>

        )}

      </header>
    </>
  )
}