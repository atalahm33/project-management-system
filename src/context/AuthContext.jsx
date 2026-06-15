import React, { createContext, useContext, useState, useEffect } from 'react'
import { getCurrentUser, login as loginApi, logout as logoutApi } from '../api/authApi'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getCurrentUser())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Sync user state from localStorage on mount
    const savedUser = getCurrentUser()
    setUser(savedUser)
    setLoading(false)
  }, [])

  const login = async (credentials) => {
    try {
      const data = await loginApi(credentials)
      if (data?.data?.user) {
        setUser(data.data.user)
      }
      return data
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    logoutApi()
    setUser(null)
  }

  const isAdmin = user?.role?.toLowerCase() === 'admin'

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
