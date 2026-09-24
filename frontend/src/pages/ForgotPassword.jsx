import React, { useState } from 'react'
import { Link } from 'react-router-dom'

export default function ForgotPassword() {
  const [email, setEmail] = useState('Enter Your Registered Email')
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="auth-shell">
      <div className="card" style={{ width: '100%', maxWidth: 420, padding: 40 }}>
        <h2 style={{ marginTop: 0 }}>Forgot Password</h2>
        <p className="subtitle">Enter your registered email to receive reset instructions.</p>

        {sent && (
          <div className="alert-success">
            ✓ Reset instructions sent! Check your inbox for <strong>{email}</strong> to set a new password.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Registered Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button className="btn btn-primary btn-full" type="submit">Send Reset Instructions</button>
        </form>

        <div className="auth-foot">
          Remembered your password? <Link to="/login" style={{ color: 'var(--blue-600)', fontWeight: 600 }}>Return to Login</Link>
        </div>
      </div>
    </div>
  )
}
