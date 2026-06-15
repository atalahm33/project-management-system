import apiClient from './apiClient'

export const login = async (credentials) => {
  const payload = {
    email: credentials.email || credentials.username,
    password: credentials.password
  }
  const response = await apiClient.post('/auth/login', payload)
  
  if (response.data?.token) {
    localStorage.setItem('auth_token', response.data.token)
  }
  if (response.data?.data?.user) {
    localStorage.setItem('auth_user', JSON.stringify(response.data.data.user))
  }
  return response.data
}

export const logout = async () => {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
  return { message: 'تم تسجيل الخروج' }
}

export const registerUser = async (userData) => {
  const response = await apiClient.post('/auth/register', userData)
  return response.data
}

export const getCurrentUser = () => {
  const raw = localStorage.getItem('auth_user')
  return raw ? JSON.parse(raw) : null
}
