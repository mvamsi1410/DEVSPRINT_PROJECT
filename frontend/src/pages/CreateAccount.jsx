import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../services/api'

export default function CreateAccount() {

  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [batchCode, setBatchCode] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreateAccount(event) {

    event.preventDefault()

    setError('')

    const cleanName = name.trim()
    const cleanEmail = email.trim().toLowerCase()
    const cleanMobile = mobile.trim()
    const cleanPassword = password

    if (!cleanName) {
      setError('Please enter your full name')
      return
    }

    if (!cleanEmail) {
      setError('Please enter your email address')
      return
    }

    if (!cleanMobile) {
      setError('Please enter your mobile number')
      return
    }

    if (!cleanPassword) {
      setError('Please enter a password')
      return
    }

    if (cleanPassword.length < 6) {
      setError(
        'Password must be at least 6 characters'
      )
      return
    }

    try {

      setLoading(true)

      const data = await apiRequest(
        '/api/auth/register',
        {
          method: 'POST',

          body: JSON.stringify({
            name: cleanName,
            email: cleanEmail,
            mobile: cleanMobile,
            password: cleanPassword,
            batch_code: batchCode.trim()
          })
        }
      )

      console.log(
        'ACCOUNT CREATED:',
        data
      )

      if (!data || !data.user || !data.token) {
        throw new Error(
          'Account was created but login information was not returned'
        )
      }

      localStorage.setItem(
        'devsprint_user',
        JSON.stringify(data.user)
      )

      localStorage.setItem(
        'access_token',
        data.token
      )

      navigate('/learner', {
        replace: true
      })

    } catch (err) {

      console.error(
        'Create account error:',
        err
      )

      setError(
        err.message ||
        'Unable to create account'
      )

    } finally {

      setLoading(false)

    }
  }

  return (

    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        boxSizing: 'border-box'
      }}
    >

      <div
        style={{
          width: '100%',
          maxWidth: 900,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow:
            '0 20px 50px rgba(0,0,0,0.15)',
          background: '#ffffff'
        }}
      >

        {/* =================================================
            LEFT SIDE
        ================================================= */}

        <div
          style={{
            padding: 40,
            minHeight: 580,
            background:
              'linear-gradient(145deg, #101d55, #070d2d)',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box'
          }}
        >

          <div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}
            >

              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: '#3764e8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700
                }}
              >
                DS
              </div>

              <strong>
                DevSprint LMS
              </strong>

            </div>

          </div>


          <div>

            <h1
              style={{
                fontSize: 34,
                marginBottom: 12
              }}
            >
              Join the sprint.
            </h1>

            <p
              style={{
                color: '#c7cee8',
                lineHeight: 1.6,
                margin: 0
              }}
            >
              Create your learner account
              to enroll in courses, track
              your progress, and earn
              certificates.
            </p>

          </div>


          <div
            style={{
              color: '#8f99c0',
              fontSize: 13
            }}
          >
            © 2026 DevSprint Services.
            All rights reserved.
          </div>

        </div>


        {/* =================================================
            RIGHT SIDE
        ================================================= */}

        <div
          style={{
            padding: 40,
            boxSizing: 'border-box'
          }}
        >

          <h2
            style={{
              marginTop: 0,
              marginBottom: 8
            }}
          >
            Create your account
          </h2>

          <p
            style={{
              color: 'var(--text-500)',
              marginTop: 0,
              lineHeight: 1.5
            }}
          >
            It only takes a minute —
            you'll be redirected to your
            learner dashboard right after.
          </p>


          {/* ERROR */}

          {error && (

            <div
              style={{
                marginTop: 18,
                padding: 12,
                borderRadius: 8,
                background: '#ffebee',
                color: '#c62828',
                fontSize: 14
              }}
            >
              {error}
            </div>

          )}


          <form
            onSubmit={handleCreateAccount}
          >

            {/* FULL NAME */}

            <div
              className="field"
              style={{
                marginTop: 20
              }}
            >

              <label>
                Full Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Enter Your Full Name"
                disabled={loading}
                autoComplete="name"
              />

            </div>


            {/* EMAIL */}

            <div className="field">

              <label>
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Enter Your Email"
                disabled={loading}
                autoComplete="email"
              />

            </div>


            {/* MOBILE */}

            <div className="field">

              <label>
                Mobile Number
              </label>

              <input
                type="tel"
                value={mobile}
                onChange={(e) =>
                  setMobile(e.target.value)
                }
                placeholder="Enter Your Mobile Number"
                disabled={loading}
                autoComplete="tel"
              />

            </div>


            {/* PASSWORD */}

            <div className="field">

              <label>
                Password
              </label>

              <div
                style={{
                  position: 'relative',
                  width: '100%'
                }}
              >

                <input
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter Your Password"
                  disabled={loading}
                  autoComplete="new-password"
                  style={{
                    width: '100%',
                    paddingRight: 65,
                    boxSizing: 'border-box'
                  }}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  disabled={loading}
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    color: '#3764e8',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    padding: 4
                  }}
                >
                  {showPassword
                    ? 'Hide'
                    : 'Show'}
                </button>

              </div>

              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-500)',
                  marginTop: 5
                }}
              >
                Minimum 6 characters
              </div>

            </div>


            {/* BATCH CODE */}

            <div className="field">

              <label>
                Batch Code

                <span
                  style={{
                    fontWeight: 400,
                    color: 'var(--text-500)'
                  }}
                >
                  {' '}
                  (Optional)
                </span>

              </label>

              <input
                type="text"
                value={batchCode}
                onChange={(e) =>
                  setBatchCode(e.target.value)
                }
                placeholder="e.g. MERN-SEP-2026"
                disabled={loading}
              />

            </div>


            {/* CREATE BUTTON */}

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
              style={{
                marginTop: 12,
                padding: 12
              }}
            >

              {loading
                ? 'Creating Account...'
                : 'Create Account & Continue'}

            </button>

          </form>


          {/* LOGIN */}

          <div
            style={{
              textAlign: 'center',
              marginTop: 18,
              fontSize: 14
            }}
          >

            Already registered?{' '}

            <Link
              to="/login"
              style={{
                fontWeight: 600
              }}
            >
              Login here
            </Link>

          </div>

        </div>

      </div>

    </div>
  )
}