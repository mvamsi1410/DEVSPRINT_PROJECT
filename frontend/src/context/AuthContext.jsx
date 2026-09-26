import React, { createContext, useContext, useState } from 'react'
import { loginUser } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('devsprint_user')
    return saved ? JSON.parse(saved) : null
  })

  const login = async (email, password) => {
    try {
      const data = await loginUser(email, password)

      if (data && data.user && data.token)  {
        const nextUser = data.user

        localStorage.setItem(
          'devsprint_user',
          JSON.stringify(nextUser)
        )

        localStorage.setItem(
          'access_token',
          data.token
        )

        setUser(nextUser)

        return {
          success: true,
          user: nextUser
        }
      }

      return {
        success: false,
        message: data.error || data.message || 'Login failed'
      }
    } catch (error) {
      console.error('Login error:', error)

      return {
        success: false,
        message: error.message || 'Unable to connect to server'
      }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('devsprint_user')
    localStorage.removeItem('access_token')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}